<?php
/**
 * Endpoint público: crear sesión de Stripe Checkout.
 * Requiere autenticación de cliente (Bearer). Crea la orden en estado pending y devuelve la URL de pago.
 */

require_once __DIR__ . '/../../_admin_common.php';
require_once __DIR__ . '/../../core/stripe_loader.php';

if (!loadStripeSdk()) {
  adminHandleCors(['POST', 'OPTIONS']);
  adminJsonResponse(503, [
    'ok' => false,
    'message' => 'Stripe no está instalado. Sube la carpeta stripe-php dentro de api/ (ver prompt/STRIPE_SETUP.md).',
  ]);
}

adminHandleCors(['POST', 'OPTIONS']);
adminRequireMethod('POST');

try {
  $pdo = adminGetPdo();
  $session = storeRequireSession($pdo);

  if (!adminTableExists($pdo, 'orders') || !adminTableExists($pdo, 'order_items')) {
    adminJsonResponse(503, ['ok' => false, 'message' => 'Módulo de pedidos no configurado. Ejecuta la migración de órdenes.']);
  }

  $secretKey = getStripeSecretKey();
  if ($secretKey === '') {
    adminJsonResponse(503, ['ok' => false, 'message' => 'Stripe no configurado (STRIPE_SECRET_KEY).']);
  }

  $body = adminReadJsonBody();
  $items = $body['items'] ?? [];
  if (!is_array($items) || count($items) === 0) {
    adminJsonResponse(400, ['ok' => false, 'message' => 'Se requiere al menos un ítem en "items" (product_id, quantity).']);
  }

  $baseUrl = rtrim(storeResolvePublicAppBaseUrl(), '/');
  $successUrl = isset($body['success_url']) && $body['success_url'] !== ''
    ? $body['success_url']
    : $baseUrl . '/checkout/success?session_id={CHECKOUT_SESSION_ID}';
  $cancelUrl = isset($body['cancel_url']) && $body['cancel_url'] !== ''
    ? $body['cancel_url']
    : $baseUrl . '/cart';

  $customerUserId = (int) $session['customer_user_id'];
  $hasOffers = adminTableExists($pdo, 'product_offers');

  $orderLines = [];

  foreach ($items as $idx => $item) {
    $productId = isset($item['product_id']) ? (int) $item['product_id'] : 0;
    $quantity = isset($item['quantity']) ? (int) $item['quantity'] : 0;
    if ($productId <= 0 || $quantity <= 0) {
      adminJsonResponse(400, ['ok' => false, 'message' => 'Ítem ' . ($idx + 1) . ': product_id y quantity deben ser positivos.']);
    }

    $sql = "
      SELECT p.id, p.name, p.price,
             " . ($hasOffers ? "COALESCE(po.offer_price, p.price)" : "p.price") . " AS final_price
      FROM products p
      " . ($hasOffers ? "LEFT JOIN product_offers po ON po.product_id = p.id AND po.is_active = 1" : "") . "
      WHERE p.id = :id AND p.is_active = 1
      LIMIT 1
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id' => $productId]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$product) {
      adminJsonResponse(400, ['ok' => false, 'message' => 'Producto no encontrado o inactivo: ' . $productId]);
    }

    $unitPrice = (float) $product['final_price'];
    if ($unitPrice < 0) {
      adminJsonResponse(400, ['ok' => false, 'message' => 'Precio inválido para producto: ' . $product['name']]);
    }

    $orderLines[] = [
      'product_id' => $productId,
      'product_name' => (string) $product['name'],
      'quantity' => $quantity,
      'price' => $unitPrice,
    ];
  }

  $subtotal = 0.0;
  foreach ($orderLines as $line) {
    $subtotal += $line['price'] * $line['quantity'];
  }
  if ($subtotal <= 0) {
    adminJsonResponse(400, ['ok' => false, 'message' => 'El total debe ser mayor que cero.']);
  }

  // Comisión (3.5% + $3 MXN) incorporada al total; en Stripe solo se muestran productos
  $feePercent = 0.035;
  $feeFixed = 3.0;
  $fee = round($subtotal * $feePercent + $feeFixed, 2);
  $fee = max(0.0, $fee);
  $total = round($subtotal + $fee, 2);

  // Repartir el total (subtotal + comisión) entre las líneas de producto para Stripe
  $stripeLineItems = [];
  $totalCentsRemaining = (int) round($total * 100);
  $lastIndex = count($orderLines) - 1;
  foreach ($orderLines as $i => $line) {
    $lineSubtotal = $line['price'] * $line['quantity'];
    $quantity = (int) $line['quantity'];
    if ($i === $lastIndex) {
      $lineTotalCents = $totalCentsRemaining;
    } else {
      $lineTotalCents = (int) round($lineSubtotal * 100 * $total / $subtotal);
      $totalCentsRemaining -= $lineTotalCents;
    }
    $unitAmountCents = $quantity > 0 ? (int) round((float) $lineTotalCents / $quantity) : 0;
    if ($unitAmountCents < 1) {
      $unitAmountCents = 1;
    }
    $stripeLineItems[] = [
      'price_data' => [
        'currency' => 'mxn',
        'unit_amount' => $unitAmountCents,
        'product_data' => [
          'name' => (string) $line['product_name'],
          'description' => 'Cantidad: ' . $quantity,
        ],
      ],
      'quantity' => $quantity,
    ];
  }

  $pdo->beginTransaction();
  try {
    $insertOrder = $pdo->prepare('
      INSERT INTO orders (customer_user_id, total, currency, status, created_at, updated_at)
      VALUES (:customer_user_id, :total, :currency, :status, NOW(), NOW())
    ');
    $insertOrder->execute([
      'customer_user_id' => $customerUserId,
      'total' => $total,
      'currency' => 'mxn',
      'status' => 'pending',
    ]);
    $orderId = (int) $pdo->lastInsertId();

    $insertItem = $pdo->prepare('
      INSERT INTO order_items (order_id, product_id, quantity, price, created_at)
      VALUES (:order_id, :product_id, :quantity, :price, NOW())
    ');
    foreach ($orderLines as $line) {
      $insertItem->execute([
        'order_id' => $orderId,
        'product_id' => $line['product_id'],
        'quantity' => $line['quantity'],
        'price' => $line['price'],
      ]);
    }

    \Stripe\Stripe::setApiKey($secretKey);
    $checkoutSession = \Stripe\Checkout\Session::create([
      'mode' => 'payment',
      'line_items' => $stripeLineItems,
      'success_url' => $successUrl,
      'cancel_url' => $cancelUrl,
      'metadata' => [
        'order_id' => (string) $orderId,
        'customer_user_id' => (string) $customerUserId,
      ],
      'payment_intent_data' => [
        'metadata' => [
          'order_id' => (string) $orderId,
        ],
      ],
    ]);

    $sessionId = $checkoutSession->id;
    $updateOrder = $pdo->prepare('
      UPDATE orders SET stripe_checkout_session_id = :sid, updated_at = NOW() WHERE id = :id
    ');
    $updateOrder->execute(['sid' => $sessionId, 'id' => $orderId]);

    $pdo->commit();

    adminJsonResponse(200, [
      'ok' => true,
      'url' => $checkoutSession->url,
      'sessionId' => $sessionId,
      'orderId' => $orderId,
    ]);
  } catch (\Stripe\Exception\ApiErrorException $e) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }
    error_log('Stripe create-session: ' . $e->getMessage());
    adminJsonResponse(502, ['ok' => false, 'message' => 'Error al crear la sesión de pago. Intenta de nuevo.']);
  } catch (Throwable $e) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }
    throw $e;
  }
} catch (PDOException $e) {
  error_log('checkout/create-session.php DB: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}
