<?php
/**
 * Endpoint: admin_categories_list.php
 *
 * Función:
 * - Devuelve categorías para formularios del panel admin.
 * - Requiere sesión admin válida.
 */

require_once __DIR__ . '/_admin_common.php';

adminHandleCors(['GET']);
adminRequireMethod('GET');

try {
  $pdo = adminGetPdo();
  adminRequireSession($pdo);

  $stmt = $pdo->query("
    SELECT id, parent_id, name, is_active
    FROM categories
    ORDER BY is_active DESC, display_order ASC, name ASC
  ");

  $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

  foreach ($categories as &$category) {
    $category['id'] = (int)$category['id'];
    $category['parent_id'] = $category['parent_id'] === null ? null : (int)$category['parent_id'];
    $category['is_active'] = $category['is_active'] ? 1 : 0;
  }

  adminJsonResponse(200, [
    'ok' => true,
    'categories' => $categories,
  ]);
} catch (PDOException $e) {
  error_log('admin_categories_list.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}

