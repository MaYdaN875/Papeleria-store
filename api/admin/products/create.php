<?php
/**
 * Endpoint: admin_product_create.php
 *
 * Función:
 * - Crea producto nuevo.
 * - Requiere sesión admin válida.
 */

require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['POST']);
adminRequireMethod('POST');

/**
 * Convierte texto a slug URL-friendly.
 */
function slugify(string $text): string
{
  $value = mb_strtolower($text, 'UTF-8');
  if (function_exists('iconv')) {
    $converted = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
    if ($converted !== false) {
      $value = $converted;
    }
  }

  $value = preg_replace('/[^a-z0-9]+/', '-', $value);
  $value = trim((string) $value, '-');
  return $value !== '' ? $value : 'producto';
}

$data = adminReadJsonBody();
$categoryId = isset($data['category_id']) ? (int) $data['category_id'] : 0;
$name = trim((string) ($data['name'] ?? ''));
$price = isset($data['price']) ? (float) $data['price'] : -1;
$stock = isset($data['stock']) ? (int) $data['stock'] : -1;
$imageUrl = trim((string) ($data['image_url'] ?? ''));
$homeCarouselSlot = isset($data['home_carousel_slot']) ? (int) $data['home_carousel_slot'] : 0;
$mayoreoRaw = $data['mayoreo'] ?? 0;
$menudeoRaw = $data['menudeo'] ?? 0;
$mayoreo = ($mayoreoRaw === 1 || $mayoreoRaw === '1' || $mayoreoRaw === true) ? 1 : 0;
$menudeo = ($menudeoRaw === 1 || $menudeoRaw === '1' || $menudeoRaw === true) ? 1 : 0;
$mayoreoPrice = isset($data['mayoreo_price']) && $data['mayoreo_price'] !== null ? (float) $data['mayoreo_price'] : null;
$mayoreoStock = isset($data['mayoreo_stock']) ? (int) $data['mayoreo_stock'] : 0;
$mayoreoMinQty = isset($data['mayoreo_min_qty']) ? (int) $data['mayoreo_min_qty'] : 10;
$menudeoPrice = isset($data['menudeo_price']) && $data['menudeo_price'] !== null ? (float) $data['menudeo_price'] : null;
$menudeoStock = isset($data['menudeo_stock']) ? (int) $data['menudeo_stock'] : 0;
$menudeoMinQty = isset($data['menudeo_min_qty']) ? (int) $data['menudeo_min_qty'] : 1;

if ($categoryId <= 0 || $name === '' || $price < 0 || $stock < 0) {
  adminJsonResponse(400, ['ok' => false, 'message' => 'Datos inválidos para crear producto']);
}

if (mb_strlen($name) > 150) {
  adminJsonResponse(400, ['ok' => false, 'message' => 'El nombre excede el límite permitido']);
}

try {
  $pdo = adminGetPdo();
  adminRequireSession($pdo);

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

  // Validación de categoría existente.
  $categoryStmt = $pdo->prepare('SELECT id FROM categories WHERE id = :id LIMIT 1');
  $categoryStmt->execute(['id' => $categoryId]);
  $categoryExists = $categoryStmt->fetch(PDO::FETCH_ASSOC);

  if (!$categoryExists) {
    adminJsonResponse(400, ['ok' => false, 'message' => 'La categoría seleccionada no existe']);
  }

  // Genera slug único (evita colisión con índice unique de products.slug).
  $baseSlug = slugify($name);
  $slug = $baseSlug;
  $slugSuffix = 1;
  $slugExistsStmt = $pdo->prepare('SELECT COUNT(*) FROM products WHERE slug = :slug');

  while (true) {
    $slugExistsStmt->execute(['slug' => $slug]);
    $existsCount = (int) $slugExistsStmt->fetchColumn();
    if ($existsCount === 0)
      break;

    $slugSuffix += 1;
    $slug = $baseSlug . '-' . $slugSuffix;
  }

  $insertColumns = [
    'category_id',
    'name',
    'slug',
    'description',
    'brand',
    'price',
    'stock',
    'sku',
    'mayoreo',
    'menudeo',
    'mayoreo_price',
    'mayoreo_stock',
  ];

  $insertValues = [
    ':category_id',
    ':name',
    ':slug',
    'NULL',
    'NULL',
    ':price',
    ':stock',
    'NULL',
    ':mayoreo',
    ':menudeo',
    ':mayoreo_price',
    ':mayoreo_stock',
  ];

  $insertParams = [
    'category_id' => $categoryId,
    'name' => $name,
    'slug' => $slug,
    'price' => $price,
    'stock' => $stock,
    'mayoreo' => $mayoreo,
    'menudeo' => $menudeo,
    'mayoreo_price' => $mayoreoPrice,
    'mayoreo_stock' => $mayoreoStock,
  ];

  if ($hasMayoreoMinQty) {
    $insertColumns[] = 'mayoreo_min_qty';
    $insertValues[] = ':mayoreo_min_qty';
    $insertParams['mayoreo_min_qty'] = $mayoreoMinQty;
  }

  $insertColumns[] = 'menudeo_price';
  $insertValues[] = ':menudeo_price';
  $insertParams['menudeo_price'] = $menudeoPrice;

  $insertColumns[] = 'menudeo_stock';
  $insertValues[] = ':menudeo_stock';
  $insertParams['menudeo_stock'] = $menudeoStock;

  if ($hasMenudeoMinQty) {
    $insertColumns[] = 'menudeo_min_qty';
    $insertValues[] = ':menudeo_min_qty';
    $insertParams['menudeo_min_qty'] = $menudeoMinQty;
  }

  $insertColumns[] = 'is_active';
  $insertValues[] = '1';

  $insertStmt = $pdo->prepare('
    INSERT INTO products (' . implode(', ', $insertColumns) . ')
    VALUES (' . implode(', ', $insertValues) . ')
  ');

  $insertStmt->execute($insertParams);

  $newId = (int) $pdo->lastInsertId();
  adminUpsertPrimaryProductImage($pdo, $newId, $imageUrl, $name);
  adminUpsertHomeCarouselAssignment($pdo, $newId, $homeCarouselSlot);

  $homeCarouselSql = adminHomeCarouselSqlParts($pdo, 'p', 'hca');
  $offerSql = adminOfferSqlParts($pdo, 'p', 'po');
  $imageSql = adminImageSqlParts($pdo, 'p', 'pimg');
  $selectStmt = $pdo->prepare("
    SELECT
      p.id,
      p.name,
      p.category_id,
      p.price,
      p.stock,
      p.mayoreo,
      p.menudeo,
      p.mayoreo_price,
      p.mayoreo_stock,
      " . ($hasMayoreoMinQty ? "COALESCE(p.mayoreo_min_qty, 10)" : "10") . " AS mayoreo_min_qty,
      p.menudeo_price,
      p.menudeo_stock,
      " . ($hasMenudeoMinQty ? "COALESCE(p.menudeo_min_qty, 1)" : "1") . " AS menudeo_min_qty,
      {$homeCarouselSql['select']},
      {$offerSql['select']},
      {$imageSql['select']},
      c.name AS category
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    {$homeCarouselSql['join']}
    {$offerSql['join']}
    {$imageSql['join']}
    WHERE p.id = :id
    LIMIT 1
  ");
  $selectStmt->execute(['id' => $newId]);
  $product = $selectStmt->fetch(PDO::FETCH_ASSOC);

  if (!$product) {
    adminJsonResponse(500, ['ok' => false, 'message' => 'No se pudo recuperar el producto creado']);
  }

  $product = adminNormalizeProductRow($product);

  adminJsonResponse(200, [
    'ok' => true,
    'message' => 'Producto creado correctamente',
    'product' => $product,
  ]);
} catch (PDOException $e) {
  error_log('admin_product_create.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}

