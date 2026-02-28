<?php
/**
 * Endpoint público: products_list_public.php
 *
 * Función:
 * - Devuelve productos activos para la tienda (sin autenticación admin).
 * - Incluye categoría y precio de oferta activo (si existe).
 */

require_once __DIR__ . '/../_admin_common.php';

adminHandleCors(['GET']);
adminRequireMethod('GET');

try {
  $pdo = adminGetPdo();

  $minQtyColumnsStmt = $pdo->query("
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'products'
      AND column_name IN ('mayoreo_min_qty', 'menudeo_min_qty')
  ");
  $minQtyColumns = $minQtyColumnsStmt->fetchAll(PDO::FETCH_COLUMN);
  $hasMayoreoMinQty = in_array('mayoreo_min_qty', $minQtyColumns, true);
  $hasMenudeoMinQty = in_array('menudeo_min_qty', $minQtyColumns, true);

  $offersTableStmt = $pdo->query("
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'product_offers'
  ");
  $offersTableExists = ((int)$offersTableStmt->fetchColumn()) > 0;

  $imagesTableStmt = $pdo->query("
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'product_images'
  ");
  $imagesTableExists = ((int)$imagesTableStmt->fetchColumn()) > 0;

  $homeCarouselTableStmt = $pdo->query("
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'home_carousel_assignments'
  ");
  $homeCarouselTableExists = ((int)$homeCarouselTableStmt->fetchColumn()) > 0;

  $imageHasIsPrimary = false;
  if ($imagesTableExists) {
    $isPrimaryColumnStmt = $pdo->query("
      SELECT COUNT(*)
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'product_images'
        AND column_name = 'is_primary'
    ");
    $imageHasIsPrimary = ((int)$isPrimaryColumnStmt->fetchColumn()) > 0;
  }

  $offersJoin = $offersTableExists
    ? "LEFT JOIN product_offers po ON po.product_id = p.id AND po.is_active = 1"
    : "";

  $homeCarouselJoin = $homeCarouselTableExists
    ? "LEFT JOIN home_carousel_assignments hca ON hca.product_id = p.id"
    : "";

  $offersSelect = $offersTableExists
    ? "CASE WHEN po.product_id IS NULL THEN 0 ELSE 1 END AS is_offer, po.offer_price,"
    : "0 AS is_offer, NULL AS offer_price,";

  $homeCarouselSelect = $homeCarouselTableExists
    ? "COALESCE(hca.carousel_slot, 0) AS home_carousel_slot,"
    : "0 AS home_carousel_slot,";

  $mayoreoMinQtySelect = $hasMayoreoMinQty
    ? "COALESCE(p.mayoreo_min_qty, 10) AS mayoreo_min_qty,"
    : "10 AS mayoreo_min_qty,";

  $menudeoMinQtySelect = $hasMenudeoMinQty
    ? "COALESCE(p.menudeo_min_qty, 1) AS menudeo_min_qty,"
    : "1 AS menudeo_min_qty,";

  if ($imagesTableExists) {
    $imagesJoin = $imageHasIsPrimary
      ? "LEFT JOIN (
          SELECT
            product_id,
            COALESCE(
              MAX(CASE WHEN is_primary = 1 THEN image_url END),
              MAX(image_url)
            ) AS image_url
          FROM product_images
          GROUP BY product_id
        ) pimg ON pimg.product_id = p.id"
      : "LEFT JOIN (
          SELECT
            product_id,
            MAX(image_url) AS image_url
          FROM product_images
          GROUP BY product_id
        ) pimg ON pimg.product_id = p.id";

    $imagesSelect = "COALESCE(NULLIF(pimg.image_url, ''), '/images/boligrafos.jpg') AS image,";
  } else {
    $imagesJoin = "";
    $imagesSelect = "'/images/boligrafos.jpg' AS image,";
  }

  $sql = "
    SELECT
      p.id,
      p.name,
      c.name AS category,
      COALESCE(NULLIF(p.description, ''), 'Producto disponible en tienda') AS description,
      $imagesSelect
      p.stock,
      p.mayoreo,
      p.menudeo,
      p.mayoreo_price,
      p.mayoreo_stock,
      $mayoreoMinQtySelect
      p.menudeo_price,
      p.menudeo_stock,
      $menudeoMinQtySelect
      $homeCarouselSelect
      p.price AS original_price,
      $offersSelect
      CASE
        WHEN " . ($offersTableExists ? "po.offer_price IS NOT NULL AND po.offer_price >= 0" : "0 = 1") . "
          THEN po.offer_price
        ELSE p.price
      END AS final_price
      ,
      CASE
        WHEN " . ($offersTableExists ? "po.offer_price IS NOT NULL AND po.offer_price >= 0 AND p.price > 0" : "0 = 1") . "
          THEN ROUND(((p.price - po.offer_price) / p.price) * 100)
        ELSE 0
      END AS discount_percentage
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    $offersJoin
    $homeCarouselJoin
    $imagesJoin
    WHERE p.is_active = 1
    ORDER BY p.id DESC
  ";

  $stmt = $pdo->query($sql);
  $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

  foreach ($products as &$product) {
    $product['id'] = (int)$product['id'];
    $product['stock'] = (int)$product['stock'];
    $product['mayoreo'] = $product['mayoreo'] ? 1 : 0;
    $product['menudeo'] = $product['menudeo'] ? 1 : 0;
    $product['mayoreo_price'] = isset($product['mayoreo_price']) ? (float)$product['mayoreo_price'] : null;
    $product['mayoreo_stock'] = isset($product['mayoreo_stock']) ? (int)$product['mayoreo_stock'] : 0;
    $product['menudeo_price'] = isset($product['menudeo_price']) ? (float)$product['menudeo_price'] : null;
    $product['menudeo_stock'] = isset($product['menudeo_stock']) ? (int)$product['menudeo_stock'] : 0;
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
  error_log('products_list_public.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, [
    'ok' => false,
    'message' => 'Error interno del servidor',
  ]);
} catch (Throwable $e) {
  error_log('products_list_public.php fatal error: ' . $e->getMessage());
  adminJsonResponse(500, [
    'ok' => false,
    'message' => 'Error interno del servidor',
  ]);
}
