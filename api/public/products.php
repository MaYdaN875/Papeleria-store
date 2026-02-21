<?php
/**
 * Endpoint público: products.php
 *
 * Devuelve productos activos para la tienda (sin autenticación admin).
 * Incluye categoría, imagen principal y precio de oferta activo (si existe).
 *
 * Optimizado: usa JOINs directos sin queries a information_schema.
 * Si una tabla opcional no existe, reintenta con query simplificada.
 */

require_once __DIR__ . '/../_admin_common.php';

adminHandleCors(['GET']);
adminRequireMethod('GET');

// Cache público: 60 segundos (el navegador no re-descarga en ese periodo)
header('Cache-Control: public, max-age=60, stale-while-revalidate=120');

try {
  $pdo = adminGetPdo();

  // Intentar query completa con todos los JOINs (caso normal)
  try {
    $sql = "
      SELECT
        p.id,
        p.name,
        c.name AS category,
        COALESCE(NULLIF(p.description, ''), 'Producto disponible en tienda') AS description,
        COALESCE(NULLIF(pimg.image_url, ''), '/images/boligrafos.jpg') AS image,
        p.stock,
        p.mayoreo,
        p.menudeo,
        COALESCE(hca.carousel_slot, 0) AS home_carousel_slot,
        p.price AS original_price,
        CASE WHEN po.product_id IS NULL THEN 0 ELSE 1 END AS is_offer,
        po.offer_price,
        CASE
          WHEN po.offer_price IS NOT NULL AND po.offer_price >= 0
            THEN po.offer_price
          ELSE p.price
        END AS final_price,
        CASE
          WHEN po.offer_price IS NOT NULL AND po.offer_price >= 0 AND p.price > 0
            THEN ROUND(((p.price - po.offer_price) / p.price) * 100)
          ELSE 0
        END AS discount_percentage
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN product_offers po ON po.product_id = p.id AND po.is_active = 1
      LEFT JOIN home_carousel_assignments hca ON hca.product_id = p.id
      LEFT JOIN (
        SELECT
          product_id,
          COALESCE(
            MAX(CASE WHEN is_primary = 1 THEN image_url END),
            MAX(image_url)
          ) AS image_url
        FROM product_images
        GROUP BY product_id
      ) pimg ON pimg.product_id = p.id
      WHERE p.is_active = 1
      ORDER BY p.id DESC
    ";

    $stmt = $pdo->query($sql);
  } catch (PDOException $joinError) {
    // Fallback: query mínima sin tablas opcionales (primer deploy, tablas no creadas aún)
    $sql = "
      SELECT
        p.id,
        p.name,
        c.name AS category,
        COALESCE(NULLIF(p.description, ''), 'Producto disponible en tienda') AS description,
        '/images/boligrafos.jpg' AS image,
        p.stock,
        p.mayoreo,
        p.menudeo,
        0 AS home_carousel_slot,
        p.price AS original_price,
        0 AS is_offer,
        NULL AS offer_price,
        p.price AS final_price,
        0 AS discount_percentage
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.is_active = 1
      ORDER BY p.id DESC
    ";

    $stmt = $pdo->query($sql);
  }

  $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

  foreach ($products as &$product) {
    $product['id'] = (int)$product['id'];
    $product['stock'] = (int)$product['stock'];
    $product['mayoreo'] = $product['mayoreo'] ? 1 : 0;
    $product['menudeo'] = $product['menudeo'] ? 1 : 0;
    $slot = isset($product['home_carousel_slot']) ? (int)$product['home_carousel_slot'] : 0;
    $product['home_carousel_slot'] = ($slot >= 1 && $slot <= 3) ? $slot : 0;
    $product['is_offer'] = $product['is_offer'] ? 1 : 0;
    $product['original_price'] = (float)$product['original_price'];
    $product['offer_price'] = isset($product['offer_price']) ? (float)$product['offer_price'] : null;
    $product['final_price'] = (float)$product['final_price'];
    $product['discount_percentage'] = (int)$product['discount_percentage'];
    $product['category'] = $product['category'] ?? 'General';
    $product['description'] = $product['description'] ?? 'Producto disponible en tienda';
    $product['image'] = $product['image'] ?? '/images/boligrafos.jpg';
  }

  adminJsonResponse(200, [
    'ok' => true,
    'products' => $products,
  ]);
} catch (PDOException $e) {
  error_log('products.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, [
    'ok' => false,
    'message' => 'Error interno del servidor',
  ]);
} catch (Throwable $e) {
  error_log('products.php fatal error: ' . $e->getMessage());
  adminJsonResponse(500, [
    'ok' => false,
    'message' => 'Error interno del servidor',
  ]);
}
