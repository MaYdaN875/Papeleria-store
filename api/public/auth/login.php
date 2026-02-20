<?php
/**
 * Endpoint público: login de clientes.
 */

require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['POST']);
adminRequireMethod('POST');

$data = adminReadJsonBody();
$email = strtolower(trim((string)($data['email'] ?? '')));
$password = (string)($data['password'] ?? '');

try {
  $pdo = adminGetPdo();
  storeEnsureEmailVerificationSchema($pdo);

  if (!adminTableExists($pdo, 'customer_users') || !adminTableExists($pdo, 'customer_sessions')) {
    adminJsonResponse(500, [
      'ok' => false,
      'message' => 'Faltan tablas de clientes. Ejecuta setup.sql en la base de datos.',
    ]);
  }

  $rateLimitEntries = [
    storeBuildRateLimitEntry('ip', storeGetClientIp(), 25, 15 * 60, 15 * 60),
  ];
  if ($email !== '') {
    $rateLimitEntries[] = storeBuildRateLimitEntry('email', $email, 8, 15 * 60, 15 * 60);
  }

  storeEnforceRateLimit($pdo, 'login', $rateLimitEntries);

  if ($email === '' || $password === '') {
    storeRegisterRateLimitFailure($pdo, 'login', $rateLimitEntries);
    adminJsonResponse(400, ['ok' => false, 'message' => 'Correo y contraseña son obligatorios.']);
  }

  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    storeRegisterRateLimitFailure($pdo, 'login', $rateLimitEntries);
    adminJsonResponse(400, ['ok' => false, 'message' => 'Correo no válido.']);
  }

  $stmt = $pdo->prepare('
    SELECT id, name, email, password_hash, email_verified_at, email_verification_required
    FROM customer_users
    WHERE email = :email
    LIMIT 1
  ');
  $stmt->execute(['email' => $email]);
  $user = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$user || !password_verify($password, $user['password_hash'])) {
    storeRegisterRateLimitFailure($pdo, 'login', $rateLimitEntries);
    adminJsonResponse(401, ['ok' => false, 'message' => 'Credenciales incorrectas.']);
  }

  $verificationRequired = ((int)($user['email_verification_required'] ?? 0)) === 1;
  $isVerified = trim((string)($user['email_verified_at'] ?? '')) !== '';
  if ($verificationRequired && !$isVerified) {
    storeClearRateLimit($pdo, 'login', $rateLimitEntries);
    adminJsonResponse(403, [
      'ok' => false,
      'message' => 'Debes verificar tu correo antes de iniciar sesion.',
      'requiresEmailVerification' => true,
    ]);
  }

  $token = bin2hex(random_bytes(32));
  $expiresAt = storeCreateSession($pdo, (int)$user['id'], $token, 168);
  storeClearRateLimit($pdo, 'login', $rateLimitEntries);

  adminJsonResponse(200, [
    'ok' => true,
    'token' => $token,
    'expiresAt' => $expiresAt,
    'user' => [
      'id' => (int)$user['id'],
      'name' => (string)$user['name'],
      'email' => (string)$user['email'],
    ],
  ]);
} catch (PDOException $e) {
  error_log('public/auth/login.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}
