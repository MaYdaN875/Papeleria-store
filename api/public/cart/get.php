<?php
/**
 * Obtener el carrito del cliente autenticado desde la base de datos.
 */

require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['GET', 'OPTIONS']);
adminRequireMethod('GET');

try {
    $pdo = adminGetPdo();
    $session = storeRequireSession($pdo);

    if (!adminTableExists($pdo, 'products')) {
        adminJsonResponse(500, ['ok' => false, 'message' => 'Módulo de productos no configurado.']);
    }

    storeEnsureCartTable($pdo);

    $customerUserId = (int) $session['customer_user_id'];

    $stmt = $pdo->prepare('
      SELECT c.product_id,
             c.quantity,
             p.name,
             p.price
      FROM customer_cart_items c
      INNER JOIN products p ON p.id = c.product_id
      WHERE c.customer_user_id = :customer_user_id
    ');
    $stmt->execute(['customer_user_id' => $customerUserId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $items = [];
    foreach ($rows as $row) {
        $items[] = [
            'product_id' => (int) $row['product_id'],
            'quantity' => (int) $row['quantity'],
            'name' => (string) $row['name'],
            'price' => (string) $row['price'],
        ];
    }

    adminJsonResponse(200, [
        'ok' => true,
        'items' => $items,
    ]);
} catch (PDOException $e) {
    error_log('public/cart/get.php DB error: ' . $e->getMessage());
    adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}

