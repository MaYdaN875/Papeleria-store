<?php
/**
 * Helpers de autenticación y sesiones admin.
 */

function adminGetBearerToken(): ?string {
  $authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

  if ($authorization === '' && function_exists('apache_request_headers')) {
    $headers = apache_request_headers();
    if (is_array($headers)) {
      $authorization = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }
  }

  if ($authorization === '' && function_exists('getallheaders')) {
    $headers = getallheaders();
    if (is_array($headers)) {
      $authorization = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }
  }

  if (!preg_match('/^Bearer\s+(.+)$/i', $authorization, $matches)) {
    return null;
  }

  $token = trim($matches[1] ?? '');
  return $token !== '' ? $token : null;
}

/**
 * Valida token de sesión en tabla admin_sessions.
 */
function adminRequireSession(PDO $pdo): array {
  $token = adminGetBearerToken();
  if (!$token) {
    adminJsonResponse(401, ['ok' => false, 'message' => 'Sesión no autorizada']);
  }

  $tokenHash = hash('sha256', $token);

  $stmt = $pdo->prepare('
    SELECT
      s.id,
      s.admin_user_id,
      s.expires_at,
      u.email
    FROM admin_sessions s
    INNER JOIN admin_users u ON u.id = s.admin_user_id
    WHERE s.token_hash = :token_hash
      AND s.revoked_at IS NULL
      AND s.expires_at > NOW()
    LIMIT 1
  ');
  $stmt->execute(['token_hash' => $tokenHash]);
  $session = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$session) {
    adminJsonResponse(401, ['ok' => false, 'message' => 'Sesión inválida o expirada']);
  }

  $touchStmt = $pdo->prepare('UPDATE admin_sessions SET last_used_at = NOW() WHERE id = :id');
  $touchStmt->execute(['id' => (int)$session['id']]);

  return $session;
}

/**
 * Crea una sesión nueva para admin y devuelve fecha de expiración.
 */
function adminCreateSession(PDO $pdo, int $adminUserId, string $token, int $hoursValid = 24): string {
  $tokenHash = hash('sha256', $token);
  $expiresAt = date('Y-m-d H:i:s', time() + ($hoursValid * 3600));

  $cleanupStmt = $pdo->prepare('
    DELETE FROM admin_sessions
    WHERE admin_user_id = :admin_user_id
      AND (expires_at <= NOW() OR revoked_at IS NOT NULL)
  ');
  $cleanupStmt->execute(['admin_user_id' => $adminUserId]);

  $insertStmt = $pdo->prepare('
    INSERT INTO admin_sessions (admin_user_id, token_hash, expires_at, created_at, last_used_at)
    VALUES (:admin_user_id, :token_hash, :expires_at, NOW(), NOW())
  ');
  $insertStmt->execute([
    'admin_user_id' => $adminUserId,
    'token_hash' => $tokenHash,
    'expires_at' => $expiresAt,
  ]);

  return $expiresAt;
}

/**
 * Revoca sesión actual.
 */
function adminRevokeSession(PDO $pdo): bool {
  $token = adminGetBearerToken();
  if (!$token) {
    return false;
  }

  $tokenHash = hash('sha256', $token);
  $stmt = $pdo->prepare('
    UPDATE admin_sessions
    SET revoked_at = NOW()
    WHERE token_hash = :token_hash
      AND revoked_at IS NULL
  ');
  $stmt->execute(['token_hash' => $tokenHash]);
  return $stmt->rowCount() > 0;
}
