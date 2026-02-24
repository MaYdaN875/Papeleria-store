<?php
/**
 * Endpoint: admin_product_delete.php
 *
 * Función:
 * - Elimina físicamente un producto de la tabla products.
 * - También elimina registros relacionados en tablas dependientes
 *   para evitar errores de llaves foráneas.
 * - Requiere sesión admin válida.
 */
require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['POST']);
adminRequireMethod('POST');

$data = adminReadJsonBody();
$id = isset($data['id']) ? (int) $data['id'] : 0;

if ($id <= 0) {
  adminJsonResponse(400, ['ok' => false, 'message' => 'ID inválido']);
}

try {
  $pdo = adminGetPdo();
  adminRequireSession($pdo);

  $pdo->beginTransaction();

  // Tablas relacionadas que pueden tener foreign keys hacia products.
  // Verificamos si existen antes de hacer DELETE para no romper la transacción.
  $relatedTables = [
    'order_items' => 'product_id',
    'product_images' => 'product_id',
    'product_offers' => 'product_id',
    'home_carousel_assignments' => 'product_id',
  ];

  $dbName = $pdo->query('SELECT DATABASE()')->fetchColumn();
  $checkTableStmt = $pdo->prepare(
    'SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = :db AND TABLE_NAME = :tbl'
  );

  foreach ($relatedTables as $table => $column) {
    $checkTableStmt->execute(['db' => $dbName, 'tbl' => $table]);
    if ((int) $checkTableStmt->fetchColumn() > 0) {
      $pdo->prepare("DELETE FROM `$table` WHERE `$column` = :id")->execute(['id' => $id]);
    }
  }

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
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
}
