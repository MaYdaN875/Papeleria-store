<?php
/**
 * Helpers de CORS y validación de método HTTP.
 */

function adminCanonicalOrigin(string $origin): string {
  $origin = trim($origin);
  if ($origin === '') return '';

  $parts = parse_url($origin);
  if (!is_array($parts)) return '';

  $scheme = strtolower((string)($parts['scheme'] ?? ''));
  $host = strtolower((string)($parts['host'] ?? ''));
  if ($scheme === '' || $host === '') return '';

  // Normaliza dominios IDN (acentos) al formato ASCII cuando sea posible.
  if (function_exists('idn_to_ascii')) {
    $asciiHost = @idn_to_ascii($host);
    if (is_string($asciiHost) && $asciiHost !== '') {
      $host = strtolower($asciiHost);
    }
  }

  $port = (int)($parts['port'] ?? 0);
  $isDefaultPort = ($scheme === 'https' && $port === 443) || ($scheme === 'http' && $port === 80);
  $portSegment = ($port > 0 && !$isDefaultPort) ? ':' . $port : '';

  return $scheme . '://' . $host . $portSegment;
}

function adminIsAllowedOrigin(string $origin, array $allowedOrigins): bool {
  $canonicalOrigin = adminCanonicalOrigin($origin);
  if ($canonicalOrigin === '') return false;

  foreach ($allowedOrigins as $allowedOrigin) {
    if ($canonicalOrigin === adminCanonicalOrigin((string)$allowedOrigin)) {
      return true;
    }
  }

  return false;
}

function adminIsSameHostOrigin(string $origin): bool {
  $originCanonical = adminCanonicalOrigin($origin);
  if ($originCanonical === '') return false;

  $requestHost = trim((string)($_SERVER['HTTP_HOST'] ?? ''));
  if ($requestHost === '') return false;

  $requestScheme = 'http';
  $httpsFlag = strtolower((string)($_SERVER['HTTPS'] ?? ''));
  if ($httpsFlag === 'on' || $httpsFlag === '1') {
    $requestScheme = 'https';
  }

  $requestCanonical = adminCanonicalOrigin($requestScheme . '://' . $requestHost);
  if ($requestCanonical === '') return false;

  return $originCanonical === $requestCanonical;
}

function adminHandleCors(array $allowedMethods): void {
  header('Content-Type: application/json');

  $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
  if ($origin !== '') {
    if (!adminIsAllowedOrigin($origin, ADMIN_ALLOWED_ORIGINS) && !adminIsSameHostOrigin($origin)) {
      adminJsonResponse(403, ['ok' => false, 'message' => 'Origen no permitido']);
    }

    header("Access-Control-Allow-Origin: $origin");
    header('Vary: Origin');
  }

  header('Access-Control-Allow-Methods: ' . implode(', ', $allowedMethods) . ', OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type, Authorization');

  if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
  }
}

function adminRequireMethod(string $requiredMethod): void {
  $method = $_SERVER['REQUEST_METHOD'] ?? '';
  if ($method !== $requiredMethod) {
    adminJsonResponse(405, ['ok' => false, 'message' => 'Método no permitido']);
  }
}
