<?php
/**
 * Endpoint publico: aplicar nueva contrasena con token de recuperacion.
 */

require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['POST']);
adminRequireMethod('POST');

$data = adminReadJsonBody();
$token = trim((string)($data['token'] ?? ''));
$password = (string)($data['password'] ?? '');

try {
  $pdo = adminGetPdo();
  storeEnsurePasswordResetTable($pdo);

  if (
    !adminTableExists($pdo, 'customer_users') ||
    !adminTableExists($pdo, 'customer_sessions')
  ) {
    adminJsonResponse(500, [
      'ok' => false,
      'message' => 'Faltan tablas de recuperacion de contrasena. Ejecuta setup.sql en la base de datos.',
    ]);
  }

  $rateLimitEntries = [
    storeBuildRateLimitEntry('ip', storeGetClientIp(), 20, 15 * 60, 15 * 60),
  ];
  if ($token !== '') {
    $rateLimitEntries[] = storeBuildRateLimitEntry('token', $token, 8, 15 * 60, 30 * 60);
  }

  storeEnforceRateLimit($pdo, 'password_reset_apply', $rateLimitEntries);

  if ($token === '' || $password === '') {
    storeRegisterRateLimitFailure($pdo, 'password_reset_apply', $rateLimitEntries);
    adminJsonResponse(400, ['ok' => false, 'message' => 'Token y contrasena son obligatorios.']);
  }

  if (strlen($password) < 8) {
    storeRegisterRateLimitFailure($pdo, 'password_reset_apply', $rateLimitEntries);
    adminJsonResponse(400, ['ok' => false, 'message' => 'La contrasena debe tener al menos 8 caracteres.']);
  }

  $passwordHash = password_hash($password, PASSWORD_BCRYPT);
  $wasUpdated = storeConsumePasswordReset($pdo, $token, $passwordHash);
  if (!$wasUpdated) {
    storeRegisterRateLimitFailure($pdo, 'password_reset_apply', $rateLimitEntries);
    adminJsonResponse(400, ['ok' => false, 'message' => 'Token invalido o expirado.']);
  }

  storeClearRateLimit($pdo, 'password_reset_apply', $rateLimitEntries);

  adminJsonResponse(200, [
    'ok' => true,
    'message' => 'Contrasena actualizada correctamente. Inicia sesion de nuevo.',
  ]);
} catch (PDOException $e) {
  error_log('public/auth/reset_password.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}
