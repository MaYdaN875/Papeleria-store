<?php
/**
 * Endpoint público: listar órdenes del cliente autenticado.
 */

require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['GET']);
adminRequireMethod('GET');

try {
  $pdo = adminGetPdo();
  $session = storeRequireSession($pdo);

  if (!adminTableExists($pdo, 'orders')) {
    adminJsonResponse(200, ['ok' => true, 'orders' => []]);
  }

  $customerUserId = (int) $session['customer_user_id'];
  $stmt = $pdo->prepare('
    SELECT id, total, currency, status, created_at, updated_at
    FROM orders
    WHERE customer_user_id = :customer_user_id
    ORDER BY created_at DESC
  ');
  $stmt->execute(['customer_user_id' => $customerUserId]);
  $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

  foreach ($orders as &$row) {
    $row['id'] = (int) $row['id'];
    $row['total'] = (float) $row['total'];
    $row['currency'] = (string) $row['currency'];
    $row['status'] = (string) $row['status'];
  }

  adminJsonResponse(200, [
    'ok' => true,
    'orders' => $orders,
  ]);
} catch (PDOException $e) {
  error_log('orders/list.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}
