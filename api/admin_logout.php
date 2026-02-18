<?php
/**
 * Endpoint: admin_logout.php
 *
 * Función:
 * - Revoca sesión admin actual (token Bearer).
 */

require_once __DIR__ . '/_admin_common.php';

adminHandleCors(['POST']);
adminRequireMethod('POST');

try {
  $pdo = adminGetPdo();
  $revoked = adminRevokeSession($pdo);

  adminJsonResponse(200, [
    'ok' => true,
    'message' => $revoked ? 'Sesión cerrada correctamente' : 'No había sesión activa',
  ]);
} catch (PDOException $e) {
  error_log('admin_logout.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}

