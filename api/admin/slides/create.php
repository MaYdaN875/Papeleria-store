<?php
/**
 * Endpoint: admin_home_slide_create.php
 *
 * Función:
 * - Crea un slide para el banner principal del home.
 * - Requiere sesión admin válida.
 */

require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['POST']);
adminRequireMethod('POST');

$data = adminReadJsonBody();
$imageUrl = trim((string)($data['image_url'] ?? ''));
$displayOrder = isset($data['display_order']) ? (int)$data['display_order'] : 1;
$isActiveRaw = $data['is_active'] ?? 1;
$isActive = ($isActiveRaw === 1 || $isActiveRaw === '1' || $isActiveRaw === true) ? 1 : 0;

if ($imageUrl === '') {
  adminJsonResponse(400, ['ok' => false, 'message' => 'La URL de la imagen del slide es obligatoria']);
}

if ($displayOrder <= 0) {
  $displayOrder = 1;
}

try {
  $pdo = adminGetPdo();
  adminRequireSession($pdo);

  if (!adminTableExists($pdo, 'home_slides')) {
    adminJsonResponse(400, [
      'ok' => false,
      'message' => 'No existe la tabla home_slides. Ejecuta setup.sql para habilitar slides.',
    ]);
  }

  $insertStmt = $pdo->prepare('
    INSERT INTO home_slides (image_url, is_active, display_order, created_at, updated_at)
    VALUES (:image_url, :is_active, :display_order, NOW(), NOW())
  ');
  $insertStmt->execute([
    'image_url' => $imageUrl,
    'is_active' => $isActive,
    'display_order' => $displayOrder,
  ]);

  $newId = (int)$pdo->lastInsertId();
  $selectStmt = $pdo->prepare('
    SELECT id, image_url, is_active, display_order
    FROM home_slides
    WHERE id = :id
    LIMIT 1
  ');
  $selectStmt->execute(['id' => $newId]);
  $slide = $selectStmt->fetch(PDO::FETCH_ASSOC);

  if (!$slide) {
    adminJsonResponse(500, ['ok' => false, 'message' => 'No se pudo recuperar el slide creado']);
  }

  $slide['id'] = (int)$slide['id'];
  $slide['image_url'] = trim((string)($slide['image_url'] ?? ''));
  $slide['is_active'] = $slide['is_active'] ? 1 : 0;
  $slide['display_order'] = (int)$slide['display_order'];

  adminJsonResponse(200, [
    'ok' => true,
    'message' => 'Slide creado correctamente',
    'slide' => $slide,
  ]);
} catch (PDOException $e) {
  error_log('admin_home_slide_create.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}

