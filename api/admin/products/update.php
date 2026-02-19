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
$id = isset($data['id']) ? (int)$data['id'] : 0;
$name = trim((string)($data['name'] ?? ''));
$price = isset($data['price']) ? (float)$data['price'] : -1;
$stock = isset($data['stock']) ? (int)$data['stock'] : -1;
$imageUrl = trim((string)($data['image_url'] ?? ''));
$homeCarouselSlot = isset($data['home_carousel_slot']) ? (int)$data['home_carousel_slot'] : 0;
$mayoreoRaw = $data['mayoreo'] ?? 0;
$menudeoRaw = $data['menudeo'] ?? 0;
$mayoreo = ($mayoreoRaw === 1 || $mayoreoRaw === '1' || $mayoreoRaw === true) ? 1 : 0;
$menudeo = ($menudeoRaw === 1 || $menudeoRaw === '1' || $menudeoRaw === true) ? 1 : 0;

if ($id <= 0 || $name === '' || $price < 0 || $stock < 0) {
  adminJsonResponse(400, ['ok' => false, 'message' => 'Datos inválidos para actualizar producto']);
}

if (mb_strlen($name) > 150) {
  adminJsonResponse(400, ['ok' => false, 'message' => 'El nombre excede el límite permitido']);
}

try {
  $pdo = adminGetPdo();
  adminRequireSession($pdo);

  $updateStmt = $pdo->prepare('
    UPDATE products
    SET name = :name,
        price = :price,
        stock = :stock,
        mayoreo = :mayoreo,
        menudeo = :menudeo
    WHERE id = :id
  ');

  $updateStmt->execute([
    'id' => $id,
    'name' => $name,
    'price' => $price,
    'stock' => $stock,
    'mayoreo' => $mayoreo,
    'menudeo' => $menudeo,
  ]);

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

