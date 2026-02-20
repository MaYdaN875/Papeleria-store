<?php
/**
 * Endpoint público: sesión actual del cliente.
 */

require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['GET']);
adminRequireMethod('GET');

try {
  $pdo = adminGetPdo();

  if (!adminTableExists($pdo, 'customer_users') || !adminTableExists($pdo, 'customer_sessions')) {
    adminJsonResponse(401, ['ok' => false, 'message' => 'Sesión inválida.']);
  }

  $session = storeRequireSession($pdo);
  adminJsonResponse(200, [
    'ok' => true,
    'user' => [
      'id' => (int)$session['customer_user_id'],
      'name' => (string)$session['name'],
      'email' => (string)$session['email'],
    ],
  ]);
} catch (PDOException $e) {
  error_log('public/auth/me.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}
