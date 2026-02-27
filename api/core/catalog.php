<?php
/**
 * Helpers de catálogo (productos, imágenes, ofertas, carrusel home).
 */

/**
 * Arma SQL de JOIN + SELECT para oferta activa por producto.
 *
 * @return array{select:string, join:string}
 */
function adminOfferSqlParts(PDO $pdo, string $productAlias = 'p', string $offerAlias = 'po'): array
{
  if (!adminTableExists($pdo, 'product_offers')) {
    return [
      'select' => '0 AS is_offer, NULL AS offer_price',
      'join' => '',
    ];
  }

  return [
    'select' => "CASE WHEN $offerAlias.product_id IS NULL THEN 0 ELSE 1 END AS is_offer, $offerAlias.offer_price",
    'join' => "LEFT JOIN product_offers $offerAlias ON $offerAlias.product_id = $productAlias.id AND $offerAlias.is_active = 1",
  ];
}

/**
 * Arma SQL de JOIN + SELECT para imagen principal de producto.
 *
 * @return array{select:string, join:string}
 */
function adminImageSqlParts(PDO $pdo, string $productAlias = 'p', string $imageAlias = 'pimg'): array
{
  if (!adminTableExists($pdo, 'product_images')) {
    return [
      'select' => "'/images/boligrafos.jpg' AS image",
      'join' => '',
    ];
  }

  return [
    'select' => "COALESCE(NULLIF($imageAlias.image_url, ''), '/images/boligrafos.jpg') AS image",
    'join' => "LEFT JOIN (
      SELECT
        product_id,
        COALESCE(
          MAX(CASE WHEN is_primary = 1 THEN image_url END),
          MAX(image_url)
        ) AS image_url
      FROM product_images
      GROUP BY product_id
    ) $imageAlias ON $imageAlias.product_id = $productAlias.id",
  ];
}

/**
 * Arma SQL de JOIN + SELECT para asignación de carrusel home por producto.
 *
 * @return array{select:string, join:string}
 */
function adminHomeCarouselSqlParts(PDO $pdo, string $productAlias = 'p', string $assignmentAlias = 'hca'): array
{
  if (!adminTableExists($pdo, 'home_carousel_assignments')) {
    return [
      'select' => '0 AS home_carousel_slot',
      'join' => '',
    ];
  }

  return [
    'select' => "COALESCE($assignmentAlias.carousel_slot, 0) AS home_carousel_slot",
    'join' => "LEFT JOIN home_carousel_assignments $assignmentAlias ON $assignmentAlias.product_id = $productAlias.id",
  ];
}

/**
 * Convierte campos de producto a tipos consistentes para respuestas JSON.
 */
function adminNormalizeProductRow(array $product): array
{
  if (isset($product['id']))
    $product['id'] = (int) $product['id'];
  if (isset($product['category_id']))
    $product['category_id'] = (int) $product['category_id'];
  if (isset($product['stock']))
    $product['stock'] = (int) $product['stock'];
  if (isset($product['price']))
    $product['price'] = (float) $product['price'];

  if (array_key_exists('mayoreo', $product))
    $product['mayoreo'] = $product['mayoreo'] ? 1 : 0;
  if (array_key_exists('menudeo', $product))
    $product['menudeo'] = $product['menudeo'] ? 1 : 0;
  if (array_key_exists('mayoreo_price', $product)) {
    $product['mayoreo_price'] = isset($product['mayoreo_price']) ? (float) $product['mayoreo_price'] : null;
  }
  if (array_key_exists('mayoreo_stock', $product)) {
    $product['mayoreo_stock'] = (int) ($product['mayoreo_stock'] ?? 0);
  }
  if (array_key_exists('mayoreo_min_qty', $product)) {
    $product['mayoreo_min_qty'] = (int) ($product['mayoreo_min_qty'] ?? 10);
  }
  if (array_key_exists('menudeo_price', $product)) {
    $product['menudeo_price'] = isset($product['menudeo_price']) ? (float) $product['menudeo_price'] : null;
  }
  if (array_key_exists('menudeo_stock', $product)) {
    $product['menudeo_stock'] = (int) ($product['menudeo_stock'] ?? 0);
  }
  if (array_key_exists('menudeo_min_qty', $product)) {
    $product['menudeo_min_qty'] = (int) ($product['menudeo_min_qty'] ?? 1);
  }
  if (array_key_exists('is_offer', $product))
    $product['is_offer'] = $product['is_offer'] ? 1 : 0;
  if (array_key_exists('home_carousel_slot', $product)) {
    $slot = (int) $product['home_carousel_slot'];
    $product['home_carousel_slot'] = ($slot >= 1 && $slot <= 3) ? $slot : 0;
  }
  if (array_key_exists('offer_price', $product)) {
    $product['offer_price'] = isset($product['offer_price']) ? (float) $product['offer_price'] : null;
  }

  $product['category'] = $product['category'] ?? 'General';
  $product['description'] = $product['description'] ?? 'Producto disponible en tienda';
  $product['image'] = $product['image'] ?? '/images/boligrafos.jpg';
  if (!array_key_exists('home_carousel_slot', $product)) {
    $product['home_carousel_slot'] = 0;
  }

  return $product;
}

/**
 * Crea, actualiza o elimina asignación de carrusel (slots 1, 2, 3) por producto.
 */
function adminUpsertHomeCarouselAssignment(PDO $pdo, int $productId, int $homeCarouselSlot): void
{
  if (!adminTableExists($pdo, 'home_carousel_assignments')) {
    return;
  }

  $slot = ($homeCarouselSlot >= 1 && $homeCarouselSlot <= 3) ? $homeCarouselSlot : 0;
  if ($slot === 0) {
    $deleteStmt = $pdo->prepare('
      DELETE FROM home_carousel_assignments
      WHERE product_id = :product_id
    ');
    $deleteStmt->execute(['product_id' => $productId]);
    return;
  }

  $upsertStmt = $pdo->prepare('
    INSERT INTO home_carousel_assignments (product_id, carousel_slot, updated_at)
    VALUES (:product_id, :carousel_slot, NOW())
    ON DUPLICATE KEY UPDATE
      carousel_slot = VALUES(carousel_slot),
      updated_at = NOW()
  ');
  $upsertStmt->execute([
    'product_id' => $productId,
    'carousel_slot' => $slot,
  ]);
}

/**
 * Crea o actualiza la imagen principal de un producto.
 */
function adminUpsertPrimaryProductImage(PDO $pdo, int $productId, string $imageUrl, string $altText): void
{
  $cleanUrl = trim($imageUrl);
  if ($cleanUrl === '')
    return;
  if (!adminTableExists($pdo, 'product_images'))
    return;

  $columns = adminGetTableColumns($pdo, 'product_images');
  $hasProductId = in_array('product_id', $columns, true);
  $hasImageUrl = in_array('image_url', $columns, true);
  if (!$hasProductId || !$hasImageUrl)
    return;

  $hasAltText = in_array('alt_text', $columns, true);
  $hasIsPrimary = in_array('is_primary', $columns, true);
  $hasDisplayOrder = in_array('display_order', $columns, true);

  if ($hasIsPrimary) {
    $clearStmt = $pdo->prepare('UPDATE product_images SET is_primary = 0 WHERE product_id = :product_id');
    $clearStmt->execute(['product_id' => $productId]);
  }

  $existingSql = $hasIsPrimary
    ? 'SELECT id FROM product_images WHERE product_id = :product_id AND is_primary = 1 ORDER BY id ASC LIMIT 1'
    : 'SELECT id FROM product_images WHERE product_id = :product_id ORDER BY id ASC LIMIT 1';
  $existingStmt = $pdo->prepare($existingSql);
  $existingStmt->execute(['product_id' => $productId]);
  $existingId = (int) ($existingStmt->fetchColumn() ?: 0);

  if ($existingId > 0) {
    $setParts = ['image_url = :image_url'];
    $params = [
      'id' => $existingId,
      'image_url' => $cleanUrl,
    ];

    if ($hasAltText) {
      $setParts[] = 'alt_text = :alt_text';
      $params['alt_text'] = $altText;
    }
    if ($hasIsPrimary) {
      $setParts[] = 'is_primary = 1';
    }

    $updateStmt = $pdo->prepare('
      UPDATE product_images
      SET ' . implode(', ', $setParts) . '
      WHERE id = :id
    ');
    $updateStmt->execute($params);
    return;
  }

  $fields = ['product_id', 'image_url'];
  $placeholders = [':product_id', ':image_url'];
  $params = [
    'product_id' => $productId,
    'image_url' => $cleanUrl,
  ];

  if ($hasAltText) {
    $fields[] = 'alt_text';
    $placeholders[] = ':alt_text';
    $params['alt_text'] = $altText;
  }
  if ($hasIsPrimary) {
    $fields[] = 'is_primary';
    $placeholders[] = ':is_primary';
    $params['is_primary'] = 1;
  }
  if ($hasDisplayOrder) {
    $fields[] = 'display_order';
    $placeholders[] = ':display_order';
    $params['display_order'] = 1;
  }

  $insertStmt = $pdo->prepare('
    INSERT INTO product_images (' . implode(', ', $fields) . ')
    VALUES (' . implode(', ', $placeholders) . ')
  ');
  $insertStmt->execute($params);
}
