<?php
/**
 * Helpers de CORS y validación de método HTTP.
 */

function adminHandleCors(array $allowedMethods): void {
  header('Content-Type: application/json');

  $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
  if ($origin !== '') {
    if (!in_array($origin, ADMIN_ALLOWED_ORIGINS, true)) {
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
