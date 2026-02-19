<?php
/**
 * Helpers de respuesta JSON.
 */

function adminJsonResponse(int $statusCode, array $payload): void {
  http_response_code($statusCode);
  echo json_encode($payload);
  exit;
}
