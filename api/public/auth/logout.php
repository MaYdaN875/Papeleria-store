<?php
/**
 * Endpoint público: cierre de sesión de clientes.
 */

require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['POST']);
adminRequireMethod('POST');

try {
  $pdo = adminGetPdo();

  if (!adminTableExists($pdo, 'customer_sessions')) {
    adminJsonResponse(200, ['ok' => true, 'message' => 'Sesión cerrada.']);
  }

  storeRevokeSession($pdo);
  adminJsonResponse(200, ['ok' => true, 'message' => 'Sesión cerrada.']);
} catch (PDOException $e) {
  error_log('public/auth/logout.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}
