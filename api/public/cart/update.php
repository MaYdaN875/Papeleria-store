<?php
/**
 * Actualizar el carrito del cliente autenticado en la base de datos.
 * Reemplaza el contenido actual por la lista de ítems enviada.
 */

require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['POST', 'OPTIONS']);
adminRequireMethod('POST');

try {
    $pdo = adminGetPdo();
    $session = storeRequireSession($pdo);

    if (!adminTableExists($pdo, 'products')) {
        adminJsonResponse(500, ['ok' => false, 'message' => 'Módulo de productos no configurado.']);
    }

    storeEnsureCartTable($pdo);

    $data = adminReadJsonBody();
    $items = $data['items'] ?? [];

    if (!is_array($items)) {
        adminJsonResponse(400, ['ok' => false, 'message' => 'El formato de "items" no es válido.']);
    }

    $customerUserId = (int) $session['customer_user_id'];

    $pdo->beginTransaction();

    $deleteStmt = $pdo->prepare('DELETE FROM customer_cart_items WHERE customer_user_id = :customer_user_id');
    $deleteStmt->execute(['customer_user_id' => $customerUserId]);

    if (count($items) > 0) {
        $insertStmt = $pdo->prepare('
          INSERT INTO customer_cart_items (customer_user_id, product_id, quantity, created_at, updated_at)
          VALUES (:customer_user_id, :product_id, :quantity, NOW(), NOW())
        ');

        foreach ($items as $idx => $item) {
            $productId = (int) ($item['product_id'] ?? 0);
            $quantity = (int) ($item['quantity'] ?? 0);

            if ($productId <= 0 || $quantity <= 0) {
                $pdo->rollBack();
                adminJsonResponse(400, [
                    'ok' => false,
                    'message' => 'Ítem ' . ($idx + 1) . ': product_id y quantity deben ser positivos.',
                ]);
            }

            $insertStmt->execute([
                'customer_user_id' => $customerUserId,
                'product_id' => $productId,
                'quantity' => $quantity,
            ]);
        }
    }

    $pdo->commit();

    adminJsonResponse(200, [
        'ok' => true,
        'message' => 'Carrito actualizado correctamente.',
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('public/cart/update.php DB error: ' . $e->getMessage());
    adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}

