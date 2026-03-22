<?php
/**
 * Helpers de respuesta JSON.
 */

function adminJsonResponse(int $statusCode, array $payload): void {
  http_response_code($statusCode);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
  header('Cache-Control: post-check=0, pre-check=0', false);
  header('Pragma: no-cache');
  echo json_encode($payload);
  exit;
}
