<?php
/**
 * Endpoint público: detalle de una orden (solo del cliente autenticado).
 * Query: ?id=123
 */

require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['GET']);
adminRequireMethod('GET');

try {
  $pdo = adminGetPdo();
  $session = storeRequireSession($pdo);

  $orderId = isset($_GET['id']) ? (int) $_GET['id'] : 0;
  if ($orderId <= 0) {
    adminJsonResponse(400, ['ok' => false, 'message' => 'Parámetro "id" inválido']);
  }

  if (!adminTableExists($pdo, 'orders') || !adminTableExists($pdo, 'order_items')) {
    adminJsonResponse(404, ['ok' => false, 'message' => 'Orden no encontrada']);
  }

  $customerUserId = (int) $session['customer_user_id'];

  $stmt = $pdo->prepare('
    SELECT id, customer_user_id, total, currency, status,
           stripe_checkout_session_id, created_at, updated_at
    FROM orders
    WHERE id = :id AND customer_user_id = :customer_user_id
    LIMIT 1
  ');
  $stmt->execute(['id' => $orderId, 'customer_user_id' => $customerUserId]);
  $order = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$order) {
    adminJsonResponse(404, ['ok' => false, 'message' => 'Orden no encontrada']);
  }

  $itemsStmt = $pdo->prepare('
    SELECT oi.id, oi.product_id, oi.quantity, oi.price, oi.created_at,
           p.name AS product_name
    FROM order_items oi
    LEFT JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = :order_id
    ORDER BY oi.id
  ');
  $itemsStmt->execute(['order_id' => $orderId]);
  $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

  foreach ($items as &$item) {
    $item['id'] = (int) $item['id'];
    $item['product_id'] = (int) $item['product_id'];
    $item['quantity'] = (int) $item['quantity'];
    $item['price'] = (float) $item['price'];
    $item['product_name'] = $item['product_name'] ?? 'Producto #' . $item['product_id'];
  }

  $order['id'] = (int) $order['id'];
  $order['total'] = (float) $order['total'];
  $order['items'] = $items;
  unset($order['customer_user_id']);
  unset($order['stripe_checkout_session_id']);

  adminJsonResponse(200, [
    'ok' => true,
    'order' => $order,
  ]);
} catch (PDOException $e) {
  error_log('orders/get.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}
