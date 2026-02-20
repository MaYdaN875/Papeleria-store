<?php
/**
 * Endpoint publico: solicitud de recuperacion de contrasena.
 */

require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['POST']);
adminRequireMethod('POST');

$data = adminReadJsonBody();
$email = strtolower(trim((string)($data['email'] ?? '')));

try {
  $pdo = adminGetPdo();
  storeEnsurePasswordResetTable($pdo);

  if (!adminTableExists($pdo, 'customer_users')) {
    adminJsonResponse(500, [
      'ok' => false,
      'message' => 'Faltan tablas de recuperacion de contrasena. Ejecuta setup.sql en la base de datos.',
    ]);
  }

  $rateLimitEntries = [
    storeBuildRateLimitEntry('ip', storeGetClientIp(), 10, 60 * 60, 30 * 60),
  ];
  if ($email !== '') {
    $rateLimitEntries[] = storeBuildRateLimitEntry('email', $email, 5, 60 * 60, 60 * 60);
  }

  storeEnforceRateLimit($pdo, 'password_reset_request', $rateLimitEntries);
  // En este endpoint cada solicitud cuenta para evitar abuso por spam.
  storeRegisterRateLimitFailure($pdo, 'password_reset_request', $rateLimitEntries);

  $publicBaseUrl = storeResolvePublicAppBaseUrl();

  if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $userStmt = $pdo->prepare('
      SELECT id, name, email
      FROM customer_users
      WHERE email = :email
      LIMIT 1
    ');
    $userStmt->execute(['email' => $email]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
      $tokenData = storeCreatePasswordResetToken($pdo, (int)$user['id'], storeGetClientIp(), 60);
      $resetUrl = $publicBaseUrl . '/reset-password?token=' . rawurlencode((string)$tokenData['token']);
      $mailSent = storeSendPasswordResetEmail((string)$user['email'], (string)$user['name'], $resetUrl);

      if (!$mailSent) {
        error_log('public/auth/forgot_password.php mail send failed for email: ' . (string)$user['email']);
      }
    }
  }

  adminJsonResponse(200, [
    'ok' => true,
    'message' => 'Si el correo existe, enviamos un enlace para restablecer la contrasena.',
  ]);
} catch (PDOException $e) {
  error_log('public/auth/forgot_password.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}
