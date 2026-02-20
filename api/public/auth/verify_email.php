<?php
/**
 * Endpoint publico: confirmar correo de cliente con token.
 */

require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['POST']);
adminRequireMethod('POST');

$data = adminReadJsonBody();
$token = trim((string)($data['token'] ?? ''));

try {
  $pdo = adminGetPdo();
  storeEnsureEmailVerificationSchema($pdo);

  if (!adminTableExists($pdo, 'customer_users') || !adminTableExists($pdo, 'customer_email_verifications')) {
    adminJsonResponse(500, [
      'ok' => false,
      'message' => 'Faltan tablas de verificacion de correo. Ejecuta setup.sql en la base de datos.',
    ]);
  }

  $rateLimitEntries = [
    storeBuildRateLimitEntry('ip', storeGetClientIp(), 20, 15 * 60, 15 * 60),
  ];
  if ($token !== '') {
    $rateLimitEntries[] = storeBuildRateLimitEntry('token', $token, 8, 15 * 60, 30 * 60);
  }

  storeEnforceRateLimit($pdo, 'email_verification_apply', $rateLimitEntries);

  if ($token === '') {
    storeRegisterRateLimitFailure($pdo, 'email_verification_apply', $rateLimitEntries);
    adminJsonResponse(400, ['ok' => false, 'message' => 'Token de verificacion obligatorio.']);
  }

  $wasVerified = storeConsumeEmailVerificationToken($pdo, $token);
  if (!$wasVerified) {
    storeRegisterRateLimitFailure($pdo, 'email_verification_apply', $rateLimitEntries);
    adminJsonResponse(400, ['ok' => false, 'message' => 'Token invalido o expirado.']);
  }

  storeClearRateLimit($pdo, 'email_verification_apply', $rateLimitEntries);

  adminJsonResponse(200, [
    'ok' => true,
    'message' => 'Correo verificado correctamente. Ya puedes iniciar sesion.',
  ]);
} catch (PDOException $e) {
  error_log('public/auth/verify_email.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}
