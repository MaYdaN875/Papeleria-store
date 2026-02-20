<?php
/**
 * Helpers de autenticación para clientes (tienda pública).
 */

const STORE_AUTH_RATE_LIMIT_TABLE = 'customer_auth_rate_limits';

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

function storeEnsureRateLimitTable(PDO $pdo): void {
  static $tableEnsured = false;
  if ($tableEnsured) return;

  $pdo->exec('
    CREATE TABLE IF NOT EXISTS customer_auth_rate_limits (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      action VARCHAR(40) NOT NULL,
      scope VARCHAR(20) NOT NULL,
      identifier_hash CHAR(64) NOT NULL,
      attempt_count INT NOT NULL DEFAULT 0,
      window_started_at DATETIME NOT NULL,
      blocked_until DATETIME NULL,
      last_attempt_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_customer_auth_rate_limit (action, scope, identifier_hash),
      INDEX idx_customer_auth_rate_limit_blocked (blocked_until),
      INDEX idx_customer_auth_rate_limit_window (window_started_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  ');

  $tableEnsured = true;
}

function storeGetClientIp(): string {
  $ip = '';

  $candidates = [
    $_SERVER['HTTP_CF_CONNECTING_IP'] ?? '',
    $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '',
    $_SERVER['HTTP_X_REAL_IP'] ?? '',
    $_SERVER['REMOTE_ADDR'] ?? '',
  ];

  foreach ($candidates as $candidate) {
    $candidate = trim((string)$candidate);
    if ($candidate === '') continue;

    // X-Forwarded-For puede incluir múltiples IPs separadas por coma.
    $parts = explode(',', $candidate);
    $firstPart = trim((string)($parts[0] ?? ''));
    if ($firstPart === '') continue;

    if (filter_var($firstPart, FILTER_VALIDATE_IP)) {
      $ip = $firstPart;
      break;
    }
  }

  return $ip !== '' ? $ip : 'unknown';
}

function storeBuildRateLimitEntry(
  string $scope,
  string $identifier,
  int $maxAttempts,
  int $windowSeconds,
  int $blockSeconds
): array {
  $normalizedIdentifier = trim($identifier);
  if ($scope === 'email') {
    $normalizedIdentifier = strtolower($normalizedIdentifier);
  }

  return [
    'scope' => $scope,
    'identifier_hash' => hash('sha256', $normalizedIdentifier),
    'max_attempts' => max(1, $maxAttempts),
    'window_seconds' => max(60, $windowSeconds),
    'block_seconds' => max(60, $blockSeconds),
  ];
}

function storeResetRateLimitWindowIfExpired(PDO $pdo, int $id, string $windowStartedAt, int $windowSeconds): bool {
  $windowStartTs = strtotime($windowStartedAt);
  if ($windowStartTs === false) return false;

  if ((time() - $windowStartTs) < $windowSeconds) return false;

  $stmt = $pdo->prepare('
    UPDATE customer_auth_rate_limits
    SET attempt_count = 0,
        blocked_until = NULL,
        window_started_at = NOW(),
        last_attempt_at = NOW()
    WHERE id = :id
  ');
  $stmt->execute(['id' => $id]);
  return true;
}

function storeEnforceRateLimit(PDO $pdo, string $action, array $entries): void {
  if (count($entries) === 0) return;

  storeEnsureRateLimitTable($pdo);

  $now = time();
  $remainingSeconds = null;

  $selectStmt = $pdo->prepare('
    SELECT id, blocked_until, window_started_at
    FROM customer_auth_rate_limits
    WHERE action = :action
      AND scope = :scope
      AND identifier_hash = :identifier_hash
    LIMIT 1
  ');

  foreach ($entries as $entry) {
    $selectStmt->execute([
      'action' => $action,
      'scope' => $entry['scope'],
      'identifier_hash' => $entry['identifier_hash'],
    ]);
    $state = $selectStmt->fetch(PDO::FETCH_ASSOC);
    if (!$state) continue;

    $wasReset = storeResetRateLimitWindowIfExpired(
      $pdo,
      (int)$state['id'],
      (string)$state['window_started_at'],
      (int)$entry['window_seconds']
    );
    if ($wasReset) continue;

    $blockedUntil = (string)($state['blocked_until'] ?? '');
    if ($blockedUntil === '') continue;

    $blockedUntilTs = strtotime($blockedUntil);
    if ($blockedUntilTs === false || $blockedUntilTs <= $now) continue;

    $secondsLeft = max(1, $blockedUntilTs - $now);
    $remainingSeconds = $remainingSeconds === null
      ? $secondsLeft
      : max($remainingSeconds, $secondsLeft);
  }

  if ($remainingSeconds === null) return;

  header('Retry-After: ' . $remainingSeconds);
  $minutesLeft = (int)ceil($remainingSeconds / 60);

  adminJsonResponse(429, [
    'ok' => false,
    'message' => 'Demasiados intentos. Intenta de nuevo en ' . $minutesLeft . ' minuto(s).',
    'retryAfterSeconds' => $remainingSeconds,
  ]);
}

function storeRegisterRateLimitFailure(PDO $pdo, string $action, array $entries): void {
  if (count($entries) === 0) return;

  storeEnsureRateLimitTable($pdo);

  $selectStmt = $pdo->prepare('
    SELECT id, attempt_count, window_started_at
    FROM customer_auth_rate_limits
    WHERE action = :action
      AND scope = :scope
      AND identifier_hash = :identifier_hash
    LIMIT 1
  ');

  $insertStmt = $pdo->prepare('
    INSERT INTO customer_auth_rate_limits (
      action,
      scope,
      identifier_hash,
      attempt_count,
      window_started_at,
      blocked_until,
      last_attempt_at
    ) VALUES (
      :action,
      :scope,
      :identifier_hash,
      1,
      NOW(),
      NULL,
      NOW()
    )
  ');

  $updateStmt = $pdo->prepare('
    UPDATE customer_auth_rate_limits
    SET attempt_count = :attempt_count,
        window_started_at = :window_started_at,
        blocked_until = :blocked_until,
        last_attempt_at = NOW()
    WHERE id = :id
  ');

  foreach ($entries as $entry) {
    $selectStmt->execute([
      'action' => $action,
      'scope' => $entry['scope'],
      'identifier_hash' => $entry['identifier_hash'],
    ]);
    $state = $selectStmt->fetch(PDO::FETCH_ASSOC);

    if (!$state) {
      $insertStmt->execute([
        'action' => $action,
        'scope' => $entry['scope'],
        'identifier_hash' => $entry['identifier_hash'],
      ]);
      continue;
    }

    $windowStartTs = strtotime((string)$state['window_started_at']);
    $attemptCount = (int)$state['attempt_count'];

    if ($windowStartTs === false || (time() - $windowStartTs) >= (int)$entry['window_seconds']) {
      $attemptCount = 1;
      $blockedUntil = null;
      $windowStartedAt = date('Y-m-d H:i:s');
    } else {
      $attemptCount++;
      $blockedUntil = null;
      $windowStartedAt = (string)$state['window_started_at'];
      if ($attemptCount >= (int)$entry['max_attempts']) {
        $blockedUntil = date('Y-m-d H:i:s', time() + (int)$entry['block_seconds']);
      }
    }

    $updateStmt->execute([
      'attempt_count' => $attemptCount,
      'window_started_at' => $windowStartedAt,
      'blocked_until' => $blockedUntil,
      'id' => (int)$state['id'],
    ]);
  }
}

function storeClearRateLimit(PDO $pdo, string $action, array $entries): void {
  if (count($entries) === 0) return;

  storeEnsureRateLimitTable($pdo);

  $deleteStmt = $pdo->prepare('
    DELETE FROM customer_auth_rate_limits
    WHERE action = :action
      AND scope = :scope
      AND identifier_hash = :identifier_hash
  ');

  foreach ($entries as $entry) {
    $deleteStmt->execute([
      'action' => $action,
      'scope' => $entry['scope'],
      'identifier_hash' => $entry['identifier_hash'],
    ]);
  }
}

function storeEnsurePasswordResetTable(PDO $pdo): void {
  static $tableEnsured = false;
  if ($tableEnsured) return;

  $pdo->exec('
    CREATE TABLE IF NOT EXISTS customer_password_resets (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      customer_user_id INT NOT NULL,
      token_hash CHAR(64) NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      requested_ip VARCHAR(45) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_customer_password_resets_user (customer_user_id),
      INDEX idx_customer_password_resets_expires (expires_at),
      INDEX idx_customer_password_resets_used (used_at),
      CONSTRAINT fk_customer_password_resets_user
        FOREIGN KEY (customer_user_id) REFERENCES customer_users(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  ');

  $tableEnsured = true;
}

function storeEnsureEmailVerificationSchema(PDO $pdo): void {
  static $schemaEnsured = false;
  if ($schemaEnsured) return;

  if (adminTableExists($pdo, 'customer_users')) {
    $columns = adminGetTableColumns($pdo, 'customer_users');

    if (!in_array('email_verified_at', $columns, true)) {
      $pdo->exec('ALTER TABLE customer_users ADD COLUMN email_verified_at DATETIME NULL AFTER password_hash');
    }

    if (!in_array('email_verification_required', $columns, true)) {
      $pdo->exec('ALTER TABLE customer_users ADD COLUMN email_verification_required TINYINT(1) NOT NULL DEFAULT 0 AFTER email_verified_at');
    }
  }

  $pdo->exec('
    CREATE TABLE IF NOT EXISTS customer_email_verifications (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      customer_user_id INT NOT NULL,
      token_hash CHAR(64) NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      requested_ip VARCHAR(45) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_customer_email_verifications_user (customer_user_id),
      INDEX idx_customer_email_verifications_expires (expires_at),
      INDEX idx_customer_email_verifications_used (used_at),
      CONSTRAINT fk_customer_email_verifications_user
        FOREIGN KEY (customer_user_id) REFERENCES customer_users(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  ');

  $schemaEnsured = true;
}

function storeResolvePublicAppBaseUrl(): string {
  return rtrim(STORE_PUBLIC_APP_URL, '/');
}

function storeCreatePasswordResetToken(
  PDO $pdo,
  int $customerUserId,
  ?string $requestedIp = null,
  int $minutesValid = 60
): array {
  storeEnsurePasswordResetTable($pdo);

  $cleanupStmt = $pdo->prepare('
    DELETE FROM customer_password_resets
    WHERE customer_user_id = :customer_user_id
      AND (used_at IS NOT NULL OR expires_at <= NOW())
  ');
  $cleanupStmt->execute(['customer_user_id' => $customerUserId]);

  $invalidateStmt = $pdo->prepare('
    UPDATE customer_password_resets
    SET used_at = NOW()
    WHERE customer_user_id = :customer_user_id
      AND used_at IS NULL
      AND expires_at > NOW()
  ');
  $invalidateStmt->execute(['customer_user_id' => $customerUserId]);

  $token = bin2hex(random_bytes(32));
  $tokenHash = hash('sha256', $token);
  $expiresAt = date('Y-m-d H:i:s', time() + (max(1, $minutesValid) * 60));

  $insertStmt = $pdo->prepare('
    INSERT INTO customer_password_resets (customer_user_id, token_hash, expires_at, requested_ip, created_at)
    VALUES (:customer_user_id, :token_hash, :expires_at, :requested_ip, NOW())
  ');
  $insertStmt->execute([
    'customer_user_id' => $customerUserId,
    'token_hash' => $tokenHash,
    'expires_at' => $expiresAt,
    'requested_ip' => $requestedIp,
  ]);

  return [
    'token' => $token,
    'expiresAt' => $expiresAt,
  ];
}

function storeCreateEmailVerificationToken(
  PDO $pdo,
  int $customerUserId,
  ?string $requestedIp = null,
  int $minutesValid = 1440
): array {
  storeEnsureEmailVerificationSchema($pdo);

  $cleanupStmt = $pdo->prepare('
    DELETE FROM customer_email_verifications
    WHERE customer_user_id = :customer_user_id
      AND (used_at IS NOT NULL OR expires_at <= NOW())
  ');
  $cleanupStmt->execute(['customer_user_id' => $customerUserId]);

  $invalidateStmt = $pdo->prepare('
    UPDATE customer_email_verifications
    SET used_at = NOW()
    WHERE customer_user_id = :customer_user_id
      AND used_at IS NULL
      AND expires_at > NOW()
  ');
  $invalidateStmt->execute(['customer_user_id' => $customerUserId]);

  $token = bin2hex(random_bytes(32));
  $tokenHash = hash('sha256', $token);
  $expiresAt = date('Y-m-d H:i:s', time() + (max(1, $minutesValid) * 60));

  $insertStmt = $pdo->prepare('
    INSERT INTO customer_email_verifications (customer_user_id, token_hash, expires_at, requested_ip, created_at)
    VALUES (:customer_user_id, :token_hash, :expires_at, :requested_ip, NOW())
  ');
  $insertStmt->execute([
    'customer_user_id' => $customerUserId,
    'token_hash' => $tokenHash,
    'expires_at' => $expiresAt,
    'requested_ip' => $requestedIp,
  ]);

  return [
    'token' => $token,
    'expiresAt' => $expiresAt,
  ];
}

function storeSendEmailVerificationEmail(string $toEmail, string $customerName, string $verificationUrl): bool {
  $displayName = trim($customerName) !== '' ? trim($customerName) : 'cliente';
  $subject = 'Verifica tu correo - God Art';
  $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

  $message = "Hola {$displayName},\n\n";
  $message .= "Gracias por registrarte en God Art.\n";
  $message .= "Confirma tu correo con este enlace (expira en 24 horas):\n{$verificationUrl}\n\n";
  $message .= "Si no realizaste este registro, ignora este correo.\n\n";
  $message .= "Equipo God Art";

  $headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: God Art <' . STORE_MAIL_FROM . '>',
    'Reply-To: ' . STORE_MAIL_REPLY_TO,
  ];

  return @mail($toEmail, $encodedSubject, $message, implode("\r\n", $headers));
}

function storeSendPasswordResetEmail(string $toEmail, string $customerName, string $resetUrl): bool {
  $displayName = trim($customerName) !== '' ? trim($customerName) : 'cliente';
  $subject = 'Recupera tu contraseña - God Art';
  $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

  $message = "Hola {$displayName},\n\n";
  $message .= "Recibimos una solicitud para restablecer tu contraseña.\n";
  $message .= "Usa este enlace para continuar (expira en 60 minutos):\n{$resetUrl}\n\n";
  $message .= "Si no solicitaste este cambio, ignora este correo.\n\n";
  $message .= "Equipo God Art";

  $headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: God Art <' . STORE_MAIL_FROM . '>',
    'Reply-To: ' . STORE_MAIL_REPLY_TO,
  ];

  return @mail($toEmail, $encodedSubject, $message, implode("\r\n", $headers));
}

function storeConsumeEmailVerificationToken(PDO $pdo, string $token): bool {
  storeEnsureEmailVerificationSchema($pdo);

  $normalizedToken = trim($token);
  if ($normalizedToken === '') return false;
  $tokenHash = hash('sha256', $normalizedToken);

  $selectStmt = $pdo->prepare('
    SELECT id, customer_user_id
    FROM customer_email_verifications
    WHERE token_hash = :token_hash
      AND used_at IS NULL
      AND expires_at > NOW()
    LIMIT 1
  ');
  $selectStmt->execute(['token_hash' => $tokenHash]);
  $verificationRow = $selectStmt->fetch(PDO::FETCH_ASSOC);
  if (!$verificationRow) return false;

  $verificationId = (int)$verificationRow['id'];
  $customerUserId = (int)$verificationRow['customer_user_id'];

  $pdo->beginTransaction();
  try {
    $verifyUserStmt = $pdo->prepare('
      UPDATE customer_users
      SET email_verified_at = NOW(),
          email_verification_required = 0,
          updated_at = NOW()
      WHERE id = :id
    ');
    $verifyUserStmt->execute(['id' => $customerUserId]);

    $markUsedStmt = $pdo->prepare('
      UPDATE customer_email_verifications
      SET used_at = NOW()
      WHERE id = :id
        AND used_at IS NULL
    ');
    $markUsedStmt->execute(['id' => $verificationId]);
    if ($markUsedStmt->rowCount() <= 0) {
      $pdo->rollBack();
      return false;
    }

    $closePendingStmt = $pdo->prepare('
      UPDATE customer_email_verifications
      SET used_at = NOW()
      WHERE customer_user_id = :customer_user_id
        AND used_at IS NULL
        AND id <> :id
    ');
    $closePendingStmt->execute([
      'customer_user_id' => $customerUserId,
      'id' => $verificationId,
    ]);

    $pdo->commit();
    return true;
  } catch (Throwable $error) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }
    throw $error;
  }
}

function storeConsumePasswordReset(PDO $pdo, string $token, string $newPasswordHash): bool {
  storeEnsurePasswordResetTable($pdo);

  $normalizedToken = trim($token);
  if ($normalizedToken === '') return false;
  $tokenHash = hash('sha256', $normalizedToken);

  $selectStmt = $pdo->prepare('
    SELECT id, customer_user_id
    FROM customer_password_resets
    WHERE token_hash = :token_hash
      AND used_at IS NULL
      AND expires_at > NOW()
    LIMIT 1
  ');
  $selectStmt->execute(['token_hash' => $tokenHash]);
  $resetRow = $selectStmt->fetch(PDO::FETCH_ASSOC);
  if (!$resetRow) return false;

  $customerUserId = (int)$resetRow['customer_user_id'];
  $resetId = (int)$resetRow['id'];

  $pdo->beginTransaction();
  try {
    $updatePasswordStmt = $pdo->prepare('
      UPDATE customer_users
      SET password_hash = :password_hash, updated_at = NOW()
      WHERE id = :id
    ');
    $updatePasswordStmt->execute([
      'password_hash' => $newPasswordHash,
      'id' => $customerUserId,
    ]);

    $markUsedStmt = $pdo->prepare('
      UPDATE customer_password_resets
      SET used_at = NOW()
      WHERE id = :id
        AND used_at IS NULL
    ');
    $markUsedStmt->execute(['id' => $resetId]);
    if ($markUsedStmt->rowCount() <= 0) {
      $pdo->rollBack();
      return false;
    }

    $revokeSessionsStmt = $pdo->prepare('
      UPDATE customer_sessions
      SET revoked_at = NOW()
      WHERE customer_user_id = :customer_user_id
        AND revoked_at IS NULL
    ');
    $revokeSessionsStmt->execute(['customer_user_id' => $customerUserId]);

    $pdo->commit();
    return true;
  } catch (Throwable $error) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }
    throw $error;
  }
}
