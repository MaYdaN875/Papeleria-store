<?php
/**
 * Endpoint: admin_home_slides_list.php
 *
 * Función:
 * - Lista los slides configurados para el banner principal del home.
 * - Requiere sesión admin válida.
 */

require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['GET']);
adminRequireMethod('GET');

try {
  $pdo = adminGetPdo();
  adminRequireSession($pdo);

  if (!adminTableExists($pdo, 'home_slides')) {
    adminJsonResponse(200, [
      'ok' => true,
      'slides' => [],
      'message' => 'Aún no existe configuración de slides. Ejecuta setup.sql para habilitarla.',
    ]);
  }

  $stmt = $pdo->query('
    SELECT id, image_url, is_active, display_order
    FROM home_slides
    ORDER BY is_active DESC, display_order ASC, id ASC
  ');
  $slides = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

  foreach ($slides as &$slide) {
    $slide['id'] = (int)$slide['id'];
    $slide['image_url'] = trim((string)($slide['image_url'] ?? ''));
    $slide['is_active'] = $slide['is_active'] ? 1 : 0;
    $slide['display_order'] = (int)$slide['display_order'];
  }

  adminJsonResponse(200, [
    'ok' => true,
    'slides' => $slides,
  ]);
} catch (PDOException $e) {
  error_log('admin_home_slides_list.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}

