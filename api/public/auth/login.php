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

if ($email === '' || $password === '') {
  adminJsonResponse(400, ['ok' => false, 'message' => 'Correo y contraseña son obligatorios.']);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  adminJsonResponse(400, ['ok' => false, 'message' => 'Correo no válido.']);
}

try {
  $pdo = adminGetPdo();

  if (!adminTableExists($pdo, 'customer_users') || !adminTableExists($pdo, 'customer_sessions')) {
    adminJsonResponse(500, [
      'ok' => false,
      'message' => 'Faltan tablas de clientes. Ejecuta setup.sql en la base de datos.',
    ]);
  }

  $stmt = $pdo->prepare('
    SELECT id, name, email, password_hash
    FROM customer_users
    WHERE email = :email
    LIMIT 1
  ');
  $stmt->execute(['email' => $email]);
  $user = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$user || !password_verify($password, $user['password_hash'])) {
    adminJsonResponse(401, ['ok' => false, 'message' => 'Credenciales incorrectas.']);
  }

  $token = bin2hex(random_bytes(32));
  $expiresAt = storeCreateSession($pdo, (int)$user['id'], $token, 168);

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
