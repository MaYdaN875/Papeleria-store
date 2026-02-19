<?php
/**
 * Endpoint: admin_home_slide_delete.php
 *
 * Función:
 * - Elimina un slide del home por id.
 * - Requiere sesión admin válida.
 */

require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['POST']);
adminRequireMethod('POST');

$data = adminReadJsonBody();
$id = isset($data['id']) ? (int)$data['id'] : 0;

if ($id <= 0) {
  adminJsonResponse(400, ['ok' => false, 'message' => 'ID de slide inválido']);
}

try {
  $pdo = adminGetPdo();
  adminRequireSession($pdo);

  if (!adminTableExists($pdo, 'home_slides')) {
    adminJsonResponse(400, [
      'ok' => false,
      'message' => 'No existe la tabla home_slides. Ejecuta setup.sql para habilitar slides.',
    ]);
  }

  $deleteStmt = $pdo->prepare('
    DELETE FROM home_slides
    WHERE id = :id
    LIMIT 1
  ');
  $deleteStmt->execute(['id' => $id]);

  if ($deleteStmt->rowCount() === 0) {
    adminJsonResponse(404, ['ok' => false, 'message' => 'Slide no encontrado']);
  }

  adminJsonResponse(200, [
    'ok' => true,
    'message' => 'Slide eliminado correctamente',
    'deletedId' => $id,
  ]);
} catch (PDOException $e) {
  error_log('admin_home_slide_delete.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}

