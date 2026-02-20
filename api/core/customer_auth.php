<?php
/**
 * Helpers de autenticación para clientes (tienda pública).
 */

function storeGetBearerToken(): ?string {
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

function storeCreateSession(PDO $pdo, int $customerUserId, string $token, int $hoursValid = 168): string {
  $tokenHash = hash('sha256', $token);
  $expiresAt = date('Y-m-d H:i:s', time() + ($hoursValid * 3600));

  $cleanupStmt = $pdo->prepare('
    DELETE FROM customer_sessions
    WHERE customer_user_id = :customer_user_id
      AND (expires_at <= NOW() OR revoked_at IS NOT NULL)
  ');
  $cleanupStmt->execute(['customer_user_id' => $customerUserId]);

  $insertStmt = $pdo->prepare('
    INSERT INTO customer_sessions (customer_user_id, token_hash, expires_at, created_at, last_used_at)
    VALUES (:customer_user_id, :token_hash, :expires_at, NOW(), NOW())
  ');
  $insertStmt->execute([
    'customer_user_id' => $customerUserId,
    'token_hash' => $tokenHash,
    'expires_at' => $expiresAt,
  ]);

  return $expiresAt;
}

function storeRequireSession(PDO $pdo): array {
  $token = storeGetBearerToken();
  if (!$token) {
    adminJsonResponse(401, ['ok' => false, 'message' => 'Sesión no autorizada']);
  }

  $tokenHash = hash('sha256', $token);

  $stmt = $pdo->prepare('
    SELECT
      s.id,
      s.customer_user_id,
      s.expires_at,
      u.name,
      u.email
    FROM customer_sessions s
    INNER JOIN customer_users u ON u.id = s.customer_user_id
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

  $touchStmt = $pdo->prepare('UPDATE customer_sessions SET last_used_at = NOW() WHERE id = :id');
  $touchStmt->execute(['id' => (int)$session['id']]);

  return $session;
}

function storeRevokeSession(PDO $pdo): bool {
  $token = storeGetBearerToken();
  if (!$token) return false;

  $tokenHash = hash('sha256', $token);
  $stmt = $pdo->prepare('
    UPDATE customer_sessions
    SET revoked_at = NOW()
    WHERE token_hash = :token_hash
      AND revoked_at IS NULL
  ');
  $stmt->execute(['token_hash' => $tokenHash]);
  return $stmt->rowCount() > 0;
}
