<?php
/**
 * Endpoint público: login de clientes con token de Firebase (Google).
 *
 * Verifica el token de Firebase via la REST API de Google, busca o crea
 * el usuario en customer_users, crea sesión en customer_sessions y
 * devuelve un token de API normal (Bearer) para pagar con Stripe.
 */

require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['POST', 'OPTIONS']);
adminRequireMethod('POST');

$data = adminReadJsonBody();
$firebaseToken = trim((string) ($data['firebase_token'] ?? ''));

if ($firebaseToken === '') {
    adminJsonResponse(400, ['ok' => false, 'message' => 'Se requiere firebase_token.']);
}

try {
    $pdo = adminGetPdo();

    if (!adminTableExists($pdo, 'customer_users') || !adminTableExists($pdo, 'customer_sessions')) {
        adminJsonResponse(500, [
            'ok' => false,
            'message' => 'Faltan tablas de clientes. Ejecuta setup.sql en la base de datos.',
        ]);
    }

    storeEnsureFirebaseUidColumn($pdo);

    // -- Rate limit por IP --
    $rateLimitEntries = [
        storeBuildRateLimitEntry('ip', storeGetClientIp(), 30, 15 * 60, 15 * 60),
    ];
    storeEnforceRateLimit($pdo, 'firebase_login', $rateLimitEntries);

    // -- Verificar token de Firebase via REST API de Google --
    $apiKey = defined('FIREBASE_API_KEY') ? FIREBASE_API_KEY : '';
    if ($apiKey === '' || $apiKey === false) {
        adminJsonResponse(503, ['ok' => false, 'message' => 'Firebase API key no configurada en el servidor.']);
    }

    $verifyUrl = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' . urlencode($apiKey);

    $ch = curl_init($verifyUrl);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode(['idToken' => $firebaseToken]),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
    ]);
    $curlResponse = curl_exec($ch);
    $curlHttpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlResponse === false || $curlHttpCode !== 200) {
        error_log('firebase_login.php: Google API error HTTP ' . $curlHttpCode . ' — ' . $curlError);
        storeRegisterRateLimitFailure($pdo, 'firebase_login', $rateLimitEntries);
        adminJsonResponse(401, ['ok' => false, 'message' => 'Token de Firebase inválido o expirado.']);
    }

    $decoded = json_decode($curlResponse, true);
    $users = $decoded['users'] ?? [];
    if (!is_array($users) || count($users) === 0) {
        storeRegisterRateLimitFailure($pdo, 'firebase_login', $rateLimitEntries);
        adminJsonResponse(401, ['ok' => false, 'message' => 'No se pudo verificar la cuenta de Google.']);
    }

    $firebaseUser = $users[0];
    $firebaseUid = trim((string) ($firebaseUser['localId'] ?? ''));
    $firebaseEmail = strtolower(trim((string) ($firebaseUser['email'] ?? '')));
    $firebaseName = trim((string) ($firebaseUser['displayName'] ?? ''));

    if ($firebaseUid === '' || $firebaseEmail === '') {
        storeRegisterRateLimitFailure($pdo, 'firebase_login', $rateLimitEntries);
        adminJsonResponse(401, ['ok' => false, 'message' => 'La cuenta de Google no tiene correo asociado.']);
    }

    if ($firebaseName === '') {
        $firebaseName = explode('@', $firebaseEmail)[0];
    }

    // -- Buscar usuario existente por firebase_uid o email --
    $existingUser = null;

    $stmtByUid = $pdo->prepare('SELECT id, name, email, firebase_uid FROM customer_users WHERE firebase_uid = :uid LIMIT 1');
    $stmtByUid->execute(['uid' => $firebaseUid]);
    $existingUser = $stmtByUid->fetch(PDO::FETCH_ASSOC);

    if (!$existingUser) {
        $stmtByEmail = $pdo->prepare('SELECT id, name, email, firebase_uid FROM customer_users WHERE email = :email LIMIT 1');
        $stmtByEmail->execute(['email' => $firebaseEmail]);
        $existingUser = $stmtByEmail->fetch(PDO::FETCH_ASSOC);
    }

    $customerUserId = 0;

    if ($existingUser) {
        $customerUserId = (int) $existingUser['id'];

        // Vincular firebase_uid si faltaba.
        if (empty($existingUser['firebase_uid'])) {
            $linkStmt = $pdo->prepare('UPDATE customer_users SET firebase_uid = :uid, updated_at = NOW() WHERE id = :id');
            $linkStmt->execute(['uid' => $firebaseUid, 'id' => $customerUserId]);
        }
    } else {
        // Crear nuevo usuario (sin contraseña).
        $insertStmt = $pdo->prepare('
      INSERT INTO customer_users (name, email, firebase_uid, password_hash, email_verified_at, email_verification_required, created_at, updated_at)
      VALUES (:name, :email, :uid, :password_hash, NOW(), 0, NOW(), NOW())
    ');
        $insertStmt->execute([
            'name' => $firebaseName,
            'email' => $firebaseEmail,
            'uid' => $firebaseUid,
            'password_hash' => '', // Sin contraseña, autenticado via Google.
        ]);
        $customerUserId = (int) $pdo->lastInsertId();
    }

    if ($customerUserId <= 0) {
        adminJsonResponse(500, ['ok' => false, 'message' => 'Error al procesar la cuenta.']);
    }

    // -- Crear sesión de API --
    $token = bin2hex(random_bytes(32));
    $expiresAt = storeCreateSession($pdo, $customerUserId, $token, 168);

    storeClearRateLimit($pdo, 'firebase_login', $rateLimitEntries);

    adminJsonResponse(200, [
        'ok' => true,
        'token' => $token,
        'expiresAt' => $expiresAt,
        'user' => [
            'id' => $customerUserId,
            'name' => $firebaseName,
            'email' => $firebaseEmail,
        ],
    ]);
} catch (PDOException $e) {
    error_log('firebase_login.php DB error: ' . $e->getMessage());
    adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}
