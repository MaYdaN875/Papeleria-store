<?php
/**
 * Endpoint: admin_offers_list.php
 *
 * Función:
 * - Devuelve las ofertas activas del catálogo admin.
 * - No elimina productos originales; solo expone productos en oferta.
 */

require_once __DIR__ . '/_admin_common.php';

adminHandleCors(['GET']);
adminRequireMethod('GET');

try {
  $pdo = adminGetPdo();
  adminRequireSession($pdo);

  $offersTableStmt = $pdo->query("
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'product_offers'
  ");
  $offersTableExists = ((int)$offersTableStmt->fetchColumn()) > 0;
  if (!$offersTableExists) {
    adminJsonResponse(200, [
      'ok' => true,
      'message' => 'La tabla de ofertas aún no existe. Ejecuta setup.sql.',
      'offers' => [],
    ]);
  }

  $stmt = $pdo->query("
    SELECT
      p.id AS product_id,
      p.name AS product_name,
      p.price AS original_price,
      p.stock,
      po.offer_price,
      c.name AS category
    FROM product_offers po
    INNER JOIN products p ON p.id = po.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE po.is_active = 1
      AND p.is_active = 1
    ORDER BY po.updated_at DESC
  ");

  $offers = $stmt->fetchAll(PDO::FETCH_ASSOC);

  foreach ($offers as &$offer) {
    $offer['product_id'] = (int)$offer['product_id'];
    $offer['original_price'] = (float)$offer['original_price'];
    $offer['offer_price'] = (float)$offer['offer_price'];
    $offer['stock'] = (int)$offer['stock'];
    $offer['category'] = $offer['category'] ?? '';
  }

  adminJsonResponse(200, [
    'ok' => true,
    'offers' => $offers,
  ]);
} catch (PDOException $e) {
  error_log('admin_offers_list.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, [
    'ok' => false,
    'message' => 'Error interno del servidor',
  ]);
}
