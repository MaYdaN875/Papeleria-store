<?php
/**
 * Endpoint: admin_offer_upsert.php
 *
 * Función:
 * - Crea o actualiza una oferta para un producto.
 * - Mantiene el producto original, solo cambia su estado de oferta.
 */

require_once __DIR__ . '/_admin_common.php';

adminHandleCors(['POST']);
adminRequireMethod('POST');

$data = adminReadJsonBody();
$productId = isset($data['product_id']) ? (int)$data['product_id'] : 0;
$offerPrice = isset($data['offer_price']) ? (float)$data['offer_price'] : -1;

if ($productId <= 0 || $offerPrice < 0) {
  adminJsonResponse(400, ['ok' => false, 'message' => 'Datos inválidos para guardar oferta']);
}

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
    adminJsonResponse(400, ['ok' => false, 'message' => 'La tabla product_offers no existe. Ejecuta setup.sql.']);
  }

  $productStmt = $pdo->prepare("
    SELECT
      p.id AS product_id,
      p.name AS product_name,
      p.price AS original_price,
      p.stock,
      c.name AS category
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.id = :product_id
      AND p.is_active = 1
    LIMIT 1
  ");
  $productStmt->execute(['product_id' => $productId]);
  $product = $productStmt->fetch(PDO::FETCH_ASSOC);

  if (!$product) {
    adminJsonResponse(404, ['ok' => false, 'message' => 'Producto no encontrado o inactivo']);
  }

  $originalPrice = (float)$product['original_price'];
  if ($offerPrice >= $originalPrice) {
    adminJsonResponse(400, [
      'ok' => false,
      'message' => 'El precio de oferta debe ser menor al precio actual del producto',
    ]);
  }

  $upsertStmt = $pdo->prepare("
    INSERT INTO product_offers (product_id, offer_price, is_active, created_at, updated_at)
    VALUES (:product_id, :offer_price, 1, NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      offer_price = VALUES(offer_price),
      is_active = 1,
      updated_at = NOW()
  ");
  $upsertStmt->execute([
    'product_id' => $productId,
    'offer_price' => $offerPrice,
  ]);

  adminJsonResponse(200, [
    'ok' => true,
    'message' => 'Oferta guardada correctamente',
    'offer' => [
      'product_id' => (int)$product['product_id'],
      'product_name' => (string)$product['product_name'],
      'category' => (string)($product['category'] ?? ''),
      'original_price' => $originalPrice,
      'offer_price' => (float)$offerPrice,
      'stock' => (int)$product['stock'],
    ],
  ]);
} catch (PDOException $e) {
  error_log('admin_offer_upsert.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}
