<?php
/**
 * Endpoint publico: reenvio de verificacion de correo.
 */

require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['POST']);
adminRequireMethod('POST');

$data = adminReadJsonBody();
$email = strtolower(trim((string)($data['email'] ?? '')));

try {
  $pdo = adminGetPdo();
  storeEnsureEmailVerificationSchema($pdo);

  if (!adminTableExists($pdo, 'customer_users')) {
    adminJsonResponse(500, [
      'ok' => false,
      'message' => 'Faltan tablas de clientes. Ejecuta setup.sql en la base de datos.',
    ]);
  }

  $rateLimitEntries = [
    storeBuildRateLimitEntry('ip', storeGetClientIp(), 10, 60 * 60, 30 * 60),
  ];
  if ($email !== '') {
    $rateLimitEntries[] = storeBuildRateLimitEntry('email', $email, 5, 60 * 60, 60 * 60);
  }

  storeEnforceRateLimit($pdo, 'email_verification_resend', $rateLimitEntries);
  // Cada solicitud cuenta para evitar abuso del endpoint.
  storeRegisterRateLimitFailure($pdo, 'email_verification_resend', $rateLimitEntries);

  $publicBaseUrl = storeResolvePublicAppBaseUrl();

  if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $userStmt = $pdo->prepare('
      SELECT id, name, email, email_verified_at, email_verification_required
      FROM customer_users
      WHERE email = :email
      LIMIT 1
    ');
    $userStmt->execute(['email' => $email]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
      $verificationRequired = ((int)($user['email_verification_required'] ?? 0)) === 1;
      $isVerified = trim((string)($user['email_verified_at'] ?? '')) !== '';

      if ($verificationRequired && !$isVerified) {
        $verificationToken = storeCreateEmailVerificationToken($pdo, (int)$user['id'], storeGetClientIp(), 24 * 60);
        $verificationUrl = $publicBaseUrl . '/verify-email?token=' . rawurlencode((string)$verificationToken['token']);
        $mailSent = storeSendEmailVerificationEmail((string)$user['email'], (string)$user['name'], $verificationUrl);
        if (!$mailSent) {
          error_log('public/auth/resend_verification.php mail send failed for email: ' . (string)$user['email']);
        }
      }
    }
  }

  adminJsonResponse(200, [
    'ok' => true,
    'message' => 'Si el correo existe y esta pendiente, enviamos un nuevo enlace de verificacion.',
  ]);
} catch (PDOException $e) {
  error_log('public/auth/resend_verification.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}
