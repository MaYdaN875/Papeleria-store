<?php
/**
 * Endpoint: admin_offer_remove.php
 *
 * Función:
 * - Quita oferta de un producto sin eliminar el producto base.
 */

require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['POST']);
adminRequireMethod('POST');

$data = adminReadJsonBody();
$productId = isset($data['product_id']) ? (int)$data['product_id'] : 0;

if ($productId <= 0) {
  adminJsonResponse(400, ['ok' => false, 'message' => 'Producto inválido para quitar oferta']);
}

try {
  $pdo = adminGetPdo();
  adminRequireSession($pdo);

  $offersTableStmt = $pdo->query("
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'product_offers'
  ");
  $offersTableExists = ((int)$offersTableStmt->fetchColumn()) > 0;
  if (!$offersTableExists) {
    adminJsonResponse(400, ['ok' => false, 'message' => 'La tabla product_offers no existe. Ejecuta setup.sql.']);
  }

  $removeStmt = $pdo->prepare('
    UPDATE product_offers
    SET is_active = 0, updated_at = NOW()
    WHERE product_id = :product_id
      AND is_active = 1
  ');
  $removeStmt->execute(['product_id' => $productId]);

  adminJsonResponse(200, [
    'ok' => true,
    'message' => 'Oferta eliminada del producto',
  ]);
} catch (PDOException $e) {
  error_log('admin_offer_remove.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}
