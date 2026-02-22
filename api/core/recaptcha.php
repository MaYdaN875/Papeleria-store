<?php
/**
 * Verifica un token de reCAPTCHA v2 con Google.
 *
 * Uso en register.php / login.php:
 *   require_once __DIR__ . '/../../core/recaptcha.php';
 *   if (!verifyRecaptcha($data['recaptcha_token'] ?? '')) { ... }
 */

define('RECAPTCHA_SECRET_KEY', '6LcpenQsAAAAAPLWTlXuKps4TnXShGA9woRGJRya');

/**
 * @param string $token  Token recibido del frontend (recaptcha_token).
 * @return bool          true si la verificación pasa.
 */
function verifyRecaptcha(string $token): bool
{
    if (empty($token))
        return false;

    $url = 'https://www.google.com/recaptcha/api/siteverify';
    $postData = [
        'secret' => RECAPTCHA_SECRET_KEY,
        'response' => $token,
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($postData),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 5,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response)
        return false;

    $result = json_decode($response, true);
    if (!$result || !isset($result['success']))
        return false;

    return $result['success'] === true;
}
