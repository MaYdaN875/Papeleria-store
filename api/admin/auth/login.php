<?php
/**
 * Endpoint: admin_login.php
 *
 * Función:
 * - Valida credenciales de administrador.
 * - Crea sesión en DB y devuelve token Bearer con expiración.
 */

require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['POST']);
adminRequireMethod('POST');

$data = adminReadJsonBody();
$identifier = trim((string)($data['email'] ?? $data['user'] ?? $data['username'] ?? ''));
$password = (string)($data['password'] ?? '');

if ($identifier === '' || $password === '') {
  adminJsonResponse(400, ['ok' => false, 'message' => 'Faltan usuario/correo o contraseña']);
}

try {
  $pdo = adminGetPdo();

  $stmt = $pdo->prepare('
    SELECT id, password_hash
    FROM admin_users
    WHERE email = :identifier
      OR SUBSTRING_INDEX(email, "@", 1) = :identifier
    LIMIT 1
  ');
  $stmt->execute(['identifier' => $identifier]);
  $user = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$user || !password_verify($password, $user['password_hash'])) {
    adminJsonResponse(401, ['ok' => false, 'message' => 'Credenciales incorrectas']);
  }

  $token = bin2hex(random_bytes(32));
  $expiresAt = adminCreateSession($pdo, (int)$user['id'], $token, 24);

  adminJsonResponse(200, [
    'ok' => true,
    'token' => $token,
    'adminId' => (int)$user['id'],
    'expiresAt' => $expiresAt,
  ]);
} catch (PDOException $e) {
  error_log('admin_login.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}

