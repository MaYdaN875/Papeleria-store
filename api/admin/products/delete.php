<?php
/**
 * Endpoint: admin_product_delete.php
 *
 * Función:
 * - Elimina físicamente un producto de la tabla products.
 * - También elimina registros relacionados en product_images para evitar errores
 *   de llaves foráneas.
 * - Requiere sesión admin válida.
 */
require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['POST']);
adminRequireMethod('POST');

$data = adminReadJsonBody();
$id = isset($data['id']) ? (int)$data['id'] : 0;

if ($id <= 0) {
  adminJsonResponse(400, ['ok' => false, 'message' => 'ID inválido']);
}

try {
  $pdo = adminGetPdo();
  adminRequireSession($pdo);

  $pdo->beginTransaction();

  // Si existen imágenes asociadas, se eliminan antes del producto.
  $deleteImagesStmt = $pdo->prepare('
    DELETE FROM product_images
    WHERE product_id = :id
  ');
  $deleteImagesStmt->execute(['id' => $id]);

  $deleteProductStmt = $pdo->prepare('
    DELETE FROM products
    WHERE id = :id
    LIMIT 1
  ');
  $deleteProductStmt->execute(['id' => $id]);

  if ($deleteProductStmt->rowCount() === 0) {
    $pdo->rollBack();
    adminJsonResponse(404, ['ok' => false, 'message' => 'Producto no encontrado']);
  }

  $pdo->commit();

  adminJsonResponse(200, [
    'ok' => true,
    'message' => 'Producto eliminado correctamente',
    'deletedId' => $id,
  ]);
} catch (PDOException $e) {
  if (isset($pdo) && $pdo->inTransaction()) {
    $pdo->rollBack();
  }

  error_log('admin_product_delete.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}

