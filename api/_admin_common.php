<?php
/**
 * Helpers compartidos para endpoints del panel admin.
 *
 * Centraliza:
 * - CORS y preflight
 * - conexión PDO
 * - lectura de JSON
 * - validación de sesión con token Bearer
 */

// ⚠️ CONFIGURA ESTOS VALORES CON TUS CREDENCIALES DE HOSTINGER
const ADMIN_DB_HOST = 'localhost';
const ADMIN_DB_NAME = 'u214097926_godart';
const ADMIN_DB_USER = 'TU_USUARIO_DB';
const ADMIN_DB_PASS = 'TU_PASSWORD_DB';

const ADMIN_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://godart-papeleria.com',
  'https://www.godart-papeleria.com',
  'https://godart-papelería.com',
  'https://www.godart-papelería.com',
];

function adminJsonResponse(int $statusCode, array $payload): void {
  http_response_code($statusCode);
  echo json_encode($payload);
  exit;
}

/**
 * Configura CORS y atiende preflight OPTIONS.
 */
function adminHandleCors(array $allowedMethods): void {
  header('Content-Type: application/json');

  $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
  if ($origin !== '') {
    if (!in_array($origin, ADMIN_ALLOWED_ORIGINS, true)) {
      adminJsonResponse(403, ['ok' => false, 'message' => 'Origen no permitido']);
    }

    header("Access-Control-Allow-Origin: $origin");
    header('Vary: Origin');
  }

  header('Access-Control-Allow-Methods: ' . implode(', ', $allowedMethods) . ', OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type, Authorization');

  if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
  }
}

function adminRequireMethod(string $requiredMethod): void {
  $method = $_SERVER['REQUEST_METHOD'] ?? '';
  if ($method !== $requiredMethod) {
    adminJsonResponse(405, ['ok' => false, 'message' => 'Método no permitido']);
  }
}

function adminGetPdo(): PDO {
  return new PDO(
    "mysql:host=" . ADMIN_DB_HOST . ";dbname=" . ADMIN_DB_NAME . ";charset=utf8mb4",
    ADMIN_DB_USER,
    ADMIN_DB_PASS,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
  );
}

/**
 * Devuelve body JSON como array (vacío si viene inválido).
 */
function adminReadJsonBody(): array {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw ?: '{}', true);
  return is_array($data) ? $data : [];
}

function adminGetBearerToken(): ?string {
  $authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

  if ($authorization === '' && function_exists('apache_request_headers')) {
    $headers = apache_request_headers();
    if (is_array($headers)) {
      $authorization = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }
  }

  if ($authorization === '' && function_exists('getallheaders')) {
    $headers = getallheaders();
    if (is_array($headers)) {
      $authorization = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }
  }

  if (!preg_match('/^Bearer\s+(.+)$/i', $authorization, $matches)) {
    return null;
  }

  $token = trim($matches[1] ?? '');
  return $token !== '' ? $token : null;
}

/**
 * Valida token de sesión en tabla admin_sessions.
 */
function adminRequireSession(PDO $pdo): array {
  $token = adminGetBearerToken();
  if (!$token) {
    adminJsonResponse(401, ['ok' => false, 'message' => 'Sesión no autorizada']);
  }

  $tokenHash = hash('sha256', $token);

  $stmt = $pdo->prepare('
    SELECT
      s.id,
      s.admin_user_id,
      s.expires_at,
      u.email
    FROM admin_sessions s
    INNER JOIN admin_users u ON u.id = s.admin_user_id
    WHERE s.token_hash = :token_hash
      AND s.revoked_at IS NULL
      AND s.expires_at > NOW()
    LIMIT 1
  ');
  $stmt->execute(['token_hash' => $tokenHash]);
  $session = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$session) {
    adminJsonResponse(401, ['ok' => false, 'message' => 'Sesión inválida o expirada']);
  }

  $touchStmt = $pdo->prepare('UPDATE admin_sessions SET last_used_at = NOW() WHERE id = :id');
  $touchStmt->execute(['id' => (int)$session['id']]);

  return $session;
}

/**
 * Crea una sesión nueva para admin y devuelve fecha de expiración.
 */
function adminCreateSession(PDO $pdo, int $adminUserId, string $token, int $hoursValid = 24): string {
  $tokenHash = hash('sha256', $token);
  $expiresAt = date('Y-m-d H:i:s', time() + ($hoursValid * 3600));

  // Limpieza de sesiones viejas/revocadas para no crecer indefinidamente.
  $cleanupStmt = $pdo->prepare('
    DELETE FROM admin_sessions
    WHERE admin_user_id = :admin_user_id
      AND (expires_at <= NOW() OR revoked_at IS NOT NULL)
  ');
  $cleanupStmt->execute(['admin_user_id' => $adminUserId]);

  $insertStmt = $pdo->prepare('
    INSERT INTO admin_sessions (admin_user_id, token_hash, expires_at, created_at, last_used_at)
    VALUES (:admin_user_id, :token_hash, :expires_at, NOW(), NOW())
  ');
  $insertStmt->execute([
    'admin_user_id' => $adminUserId,
    'token_hash' => $tokenHash,
    'expires_at' => $expiresAt,
  ]);

  return $expiresAt;
}

/**
 * Revoca sesión actual.
 */
function adminRevokeSession(PDO $pdo): bool {
  $token = adminGetBearerToken();
  if (!$token) return false;

  $tokenHash = hash('sha256', $token);
  $stmt = $pdo->prepare('
    UPDATE admin_sessions
    SET revoked_at = NOW()
    WHERE token_hash = :token_hash
      AND revoked_at IS NULL
  ');
  $stmt->execute(['token_hash' => $tokenHash]);
  return $stmt->rowCount() > 0;
}

/**
 * Verifica si una tabla existe en el esquema actual.
 */
function adminTableExists(PDO $pdo, string $tableName): bool {
  $stmt = $pdo->prepare('
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = :table_name
  ');
  $stmt->execute(['table_name' => $tableName]);
  return ((int)$stmt->fetchColumn()) > 0;
}

/**
 * Devuelve el listado de columnas de una tabla.
 *
 * @return string[]
 */
function adminGetTableColumns(PDO $pdo, string $tableName): array {
  $stmt = $pdo->prepare('
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = :table_name
  ');
  $stmt->execute(['table_name' => $tableName]);
  return $stmt->fetchAll(PDO::FETCH_COLUMN) ?: [];
}

/**
 * Arma SQL de JOIN + SELECT para oferta activa por producto.
 *
 * @return array{select:string, join:string}
 */
function adminOfferSqlParts(PDO $pdo, string $productAlias = 'p', string $offerAlias = 'po'): array {
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
function adminImageSqlParts(PDO $pdo, string $productAlias = 'p', string $imageAlias = 'pimg'): array {
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
 * Convierte campos de producto a tipos consistentes para respuestas JSON.
 */
function adminNormalizeProductRow(array $product): array {
  if (isset($product['id'])) $product['id'] = (int)$product['id'];
  if (isset($product['category_id'])) $product['category_id'] = (int)$product['category_id'];
  if (isset($product['stock'])) $product['stock'] = (int)$product['stock'];
  if (isset($product['price'])) $product['price'] = (float)$product['price'];

  if (array_key_exists('mayoreo', $product)) $product['mayoreo'] = $product['mayoreo'] ? 1 : 0;
  if (array_key_exists('menudeo', $product)) $product['menudeo'] = $product['menudeo'] ? 1 : 0;
  if (array_key_exists('is_offer', $product)) $product['is_offer'] = $product['is_offer'] ? 1 : 0;
  if (array_key_exists('offer_price', $product)) {
    $product['offer_price'] = isset($product['offer_price']) ? (float)$product['offer_price'] : null;
  }

  $product['category'] = $product['category'] ?? 'General';
  $product['description'] = $product['description'] ?? 'Producto disponible en tienda';
  $product['image'] = $product['image'] ?? '/images/boligrafos.jpg';

  return $product;
}

/**
 * Crea o actualiza la imagen principal de un producto.
 * Si la tabla no existe o no hay URL, omite la operación silenciosamente.
 */
function adminUpsertPrimaryProductImage(PDO $pdo, int $productId, string $imageUrl, string $altText): void {
  $cleanUrl = trim($imageUrl);
  if ($cleanUrl === '') return;
  if (!adminTableExists($pdo, 'product_images')) return;

  $columns = adminGetTableColumns($pdo, 'product_images');
  $hasProductId = in_array('product_id', $columns, true);
  $hasImageUrl = in_array('image_url', $columns, true);
  if (!$hasProductId || !$hasImageUrl) return;

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
  $existingId = (int)($existingStmt->fetchColumn() ?: 0);

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

