<?php
/**
 * Endpoint público: registro de clientes.
 */

require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['POST']);
adminRequireMethod('POST');

$data = adminReadJsonBody();
$name = trim((string)($data['name'] ?? ''));
$email = strtolower(trim((string)($data['email'] ?? '')));
$password = (string)($data['password'] ?? '');

if ($name === '' || $email === '' || $password === '') {
  adminJsonResponse(400, ['ok' => false, 'message' => 'Nombre, correo y contraseña son obligatorios.']);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  adminJsonResponse(400, ['ok' => false, 'message' => 'Correo no válido.']);
}

if (strlen($password) < 8) {
  adminJsonResponse(400, ['ok' => false, 'message' => 'La contraseña debe tener al menos 8 caracteres.']);
}

try {
  $pdo = adminGetPdo();

  if (!adminTableExists($pdo, 'customer_users') || !adminTableExists($pdo, 'customer_sessions')) {
    adminJsonResponse(500, [
      'ok' => false,
      'message' => 'Faltan tablas de clientes. Ejecuta setup.sql en la base de datos.',
    ]);
  }

  $passwordHash = password_hash($password, PASSWORD_BCRYPT);

  $insertStmt = $pdo->prepare('
    INSERT INTO customer_users (name, email, password_hash, created_at, updated_at)
    VALUES (:name, :email, :password_hash, NOW(), NOW())
  ');

  try {
    $insertStmt->execute([
      'name' => $name,
      'email' => $email,
      'password_hash' => $passwordHash,
    ]);
  } catch (PDOException $duplicateError) {
    if ((int)$duplicateError->errorInfo[1] === 1062) {
      adminJsonResponse(409, ['ok' => false, 'message' => 'Ese correo ya está registrado.']);
    }
    throw $duplicateError;
  }

  $customerId = (int)$pdo->lastInsertId();
  $token = bin2hex(random_bytes(32));
  $expiresAt = storeCreateSession($pdo, $customerId, $token, 168);

  adminJsonResponse(201, [
    'ok' => true,
    'token' => $token,
    'expiresAt' => $expiresAt,
    'user' => [
      'id' => $customerId,
      'name' => $name,
      'email' => $email,
    ],
  ]);
} catch (PDOException $e) {
  error_log('public/auth/register.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}
