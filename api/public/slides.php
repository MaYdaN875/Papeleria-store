<?php
/**
 * Endpoint público: home_slides_public.php
 *
 * Función:
 * - Devuelve slides activos para el banner principal del home.
 * - No requiere autenticación admin.
 */

require_once __DIR__ . '/../_admin_common.php';

adminHandleCors(['GET']);
adminRequireMethod('GET');

// Cache público: 2 minutos para slides
header('Cache-Control: public, max-age=120, stale-while-revalidate=300');

try {
  $pdo = adminGetPdo();

  try {
    $stmt = $pdo->query("
      SELECT id, image_url, display_order
      FROM home_slides
      WHERE is_active = 1
        AND image_url IS NOT NULL
        AND TRIM(image_url) <> ''
      ORDER BY display_order ASC, id ASC
    ");
    $slides = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
  } catch (PDOException $tableError) {
    // Tabla no existe aún
    $slides = [];
  }

  foreach ($slides as &$slide) {
    $slide['id'] = (int) $slide['id'];
    $slide['image_url'] = trim((string) ($slide['image_url'] ?? ''));
    $slide['display_order'] = (int) $slide['display_order'];
  }

  adminJsonResponse(200, [
    'ok' => true,
    'slides' => $slides,
  ]);
} catch (PDOException $e) {
  error_log('home_slides_public.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}

