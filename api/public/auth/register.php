<?php
/**
 * Endpoint público: registro de clientes.
 */

require_once __DIR__ . '/../../_admin_common.php';
require_once __DIR__ . '/../../core/recaptcha.php';

adminHandleCors(['POST']);
adminRequireMethod('POST');

$data = adminReadJsonBody();
$name = trim((string) ($data['name'] ?? ''));
$email = strtolower(trim((string) ($data['email'] ?? '')));
$password = (string) ($data['password'] ?? '');
$recaptchaToken = (string) ($data['recaptcha_token'] ?? '');

// Verificar reCAPTCHA v2 antes de procesar registro.
if (!verifyRecaptcha($recaptchaToken)) {
  adminJsonResponse(403, ['ok' => false, 'message' => 'Verificación reCAPTCHA fallida. Intenta de nuevo.']);
}

try {
  $pdo = adminGetPdo();
  storeEnsureEmailVerificationSchema($pdo);
  $publicBaseUrl = storeResolvePublicAppBaseUrl();

  if (!adminTableExists($pdo, 'customer_users') || !adminTableExists($pdo, 'customer_sessions')) {
    adminJsonResponse(500, [
      'ok' => false,
      'message' => 'Faltan tablas de clientes. Ejecuta setup.sql en la base de datos.',
    ]);
  }

  $rateLimitEntries = [
    storeBuildRateLimitEntry('ip', storeGetClientIp(), 10, 60 * 60, 30 * 60),
  ];
  if ($email !== '') {
    $rateLimitEntries[] = storeBuildRateLimitEntry('email', $email, 4, 60 * 60, 60 * 60);
  }

  storeEnforceRateLimit($pdo, 'register', $rateLimitEntries);

  if ($name === '' || $email === '' || $password === '') {
    storeRegisterRateLimitFailure($pdo, 'register', $rateLimitEntries);
    adminJsonResponse(400, ['ok' => false, 'message' => 'Nombre, correo y contraseña son obligatorios.']);
  }

  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    storeRegisterRateLimitFailure($pdo, 'register', $rateLimitEntries);
    adminJsonResponse(400, ['ok' => false, 'message' => 'Correo no válido.']);
  }

  if (strlen($password) < 8) {
    storeRegisterRateLimitFailure($pdo, 'register', $rateLimitEntries);
    adminJsonResponse(400, ['ok' => false, 'message' => 'La contraseña debe tener al menos 8 caracteres.']);
  }

  $passwordHash = password_hash($password, PASSWORD_BCRYPT);

  $insertStmt = $pdo->prepare('
    INSERT INTO customer_users (
      name,
      email,
      password_hash,
      email_verified_at,
      email_verification_required,
      created_at,
      updated_at
    )
    VALUES (:name, :email, :password_hash, NULL, 1, NOW(), NOW())
  ');

  try {
    $insertStmt->execute([
      'name' => $name,
      'email' => $email,
      'password_hash' => $passwordHash,
    ]);
  } catch (PDOException $duplicateError) {
    if ((int) $duplicateError->errorInfo[1] === 1062) {
      $existingUserStmt = $pdo->prepare('
        SELECT id, name, email_verified_at, email_verification_required
        FROM customer_users
        WHERE email = :email
        LIMIT 1
      ');
      $existingUserStmt->execute(['email' => $email]);
      $existingUser = $existingUserStmt->fetch(PDO::FETCH_ASSOC);

      $verificationRequired = ((int) ($existingUser['email_verification_required'] ?? 0)) === 1;
      $isVerified = trim((string) ($existingUser['email_verified_at'] ?? '')) !== '';

      storeRegisterRateLimitFailure($pdo, 'register', $rateLimitEntries);

      if ($existingUser && $verificationRequired && !$isVerified) {
        $verificationToken = storeCreateEmailVerificationToken(
          $pdo,
          (int) $existingUser['id'],
          storeGetClientIp(),
          24 * 60
        );
        $verificationUrl = $publicBaseUrl . '/verify-email?token=' . rawurlencode((string) $verificationToken['token']);
        $mailSent = storeSendEmailVerificationEmail($email, (string) $existingUser['name'], $verificationUrl);
        if (!$mailSent) {
          error_log('public/auth/register.php resend verify mail failed for email: ' . $email);
        }

        $payload = [
          'ok' => false,
          'requiresEmailVerification' => true,
          'message' => 'Ese correo ya existe pero no esta verificado. Reenviamos el enlace de verificacion.',
        ];

        adminJsonResponse(409, $payload);
      }

      adminJsonResponse(409, ['ok' => false, 'message' => 'Ese correo ya está registrado.']);
    }
    throw $duplicateError;
  }

  $customerId = (int) $pdo->lastInsertId();
  $verificationToken = storeCreateEmailVerificationToken($pdo, $customerId, storeGetClientIp(), 24 * 60);
  $verificationUrl = $publicBaseUrl . '/verify-email?token=' . rawurlencode((string) $verificationToken['token']);
  $mailSent = storeSendEmailVerificationEmail($email, $name, $verificationUrl);
  if (!$mailSent) {
    error_log('public/auth/register.php mail send failed for email: ' . $email);
  }

  storeClearRateLimit($pdo, 'register', $rateLimitEntries);

  $payload = [
    'ok' => true,
    'requiresEmailVerification' => true,
    'message' => 'Te enviamos un enlace para verificar tu correo antes de iniciar sesion.',
  ];

  adminJsonResponse(201, $payload);
} catch (PDOException $e) {
  error_log('public/auth/register.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}
