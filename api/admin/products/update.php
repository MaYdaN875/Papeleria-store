<?php
/**
 * Endpoint: admin_product_update.php
 *
 * Función:
 * - Actualiza un producto existente en tabla products.
 * - Campos permitidos: name, price, stock, mayoreo, menudeo.
 * - Devuelve el producto actualizado para refrescar UI en el frontend.
 *
 * Seguridad aplicada:
 * - Requiere sesión admin válida.
 * - Validación de método y payload.
 */
require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['POST']);
adminRequireMethod('POST');

// Payload esperado:
// {
//   id: number,
//   name: string,
//   price: number,
//   stock: number,
//   mayoreo: 0|1|boolean,
//   menudeo: 0|1|boolean
// }
$data = adminReadJsonBody();
$id = isset($data['id']) ? (int) $data['id'] : 0;
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

if ($id <= 0 || $name === '' || $price < 0 || $stock < 0) {
  adminJsonResponse(400, ['ok' => false, 'message' => 'Datos inválidos para actualizar producto']);
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

  $setParts = [
    'name = :name',
    'price = :price',
    'stock = :stock',
    'mayoreo = :mayoreo',
    'menudeo = :menudeo',
    'mayoreo_price = :mayoreo_price',
    'mayoreo_stock = :mayoreo_stock',
    'menudeo_price = :menudeo_price',
    'menudeo_stock = :menudeo_stock',
  ];

  if ($hasMayoreoMinQty)
    $setParts[] = 'mayoreo_min_qty = :mayoreo_min_qty';
  if ($hasMenudeoMinQty)
    $setParts[] = 'menudeo_min_qty = :menudeo_min_qty';

  $updateSql = 'UPDATE products SET ' . implode(",\n        ", $setParts) . ' WHERE id = :id';
  $updateStmt = $pdo->prepare($updateSql);

  $updateParams = [
    'id' => $id,
    'name' => $name,
    'price' => $price,
    'stock' => $stock,
    'mayoreo' => $mayoreo,
    'menudeo' => $menudeo,
    'mayoreo_price' => $mayoreoPrice,
    'mayoreo_stock' => $mayoreoStock,
    'menudeo_price' => $menudeoPrice,
    'menudeo_stock' => $menudeoStock,
  ];

  if ($hasMayoreoMinQty)
    $updateParams['mayoreo_min_qty'] = $mayoreoMinQty;
  if ($hasMenudeoMinQty)
    $updateParams['menudeo_min_qty'] = $menudeoMinQty;

  $updateStmt->execute($updateParams);

  adminUpsertPrimaryProductImage($pdo, $id, $imageUrl, $name);
  adminUpsertHomeCarouselAssignment($pdo, $id, $homeCarouselSlot);

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
  $selectStmt->execute(['id' => $id]);
  $product = $selectStmt->fetch(PDO::FETCH_ASSOC);

  if (!$product) {
    adminJsonResponse(404, ['ok' => false, 'message' => 'Producto no encontrado']);
  }

  $product = adminNormalizeProductRow($product);

  adminJsonResponse(200, [
    'ok' => true,
    'message' => 'Producto actualizado correctamente',
    'product' => $product,
  ]);
} catch (PDOException $e) {
  error_log('admin_product_update.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}

