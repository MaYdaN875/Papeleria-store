<?php
/**
 * Endpoint: admin_products_list.php
 *
 * Función:
 * - Devuelve listado de productos activos para dashboard admin.
 * - Requiere sesión admin válida (token Bearer).
 */

require_once __DIR__ . '/_admin_common.php';

adminHandleCors(['GET']);
adminRequireMethod('GET');

try {
  $pdo = adminGetPdo();
  adminRequireSession($pdo);

  $stmt = $pdo->query("
    SELECT 
      p.id,
      p.name,
      p.category_id,
      p.price,
      p.stock,
      p.mayoreo,
      p.menudeo,
      c.name AS category
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.is_active = 1
    ORDER BY p.id DESC
  ");

  $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

  foreach ($products as &$product) {
    $product['category_id'] = (int)$product['category_id'];
    $product['mayoreo'] = $product['mayoreo'] ? 1 : 0;
    $product['menudeo'] = $product['menudeo'] ? 1 : 0;
  }

  adminJsonResponse(200, [
    'ok' => true,
    'products' => $products,
  ]);
} catch (PDOException $e) {
  error_log('admin_products_list.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, [
    'ok' => false,
    'message' => 'Error interno del servidor',
  ]);
}

