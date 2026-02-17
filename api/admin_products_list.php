<?php
header('Content-Type: application/json');

$allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://godart-papeleria.com',
  'https://www.godart-papeleria.com',
  'https://godart-papelería.com',
  'https://www.godart-papelería.com',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
  if (!in_array($origin, $allowedOrigins, true)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'message' => 'Origen no permitido']);
    exit;
  }

  header("Access-Control-Allow-Origin: $origin");
  header('Vary: Origin');
}

header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'message' => 'Método no permitido']);
  exit;
}

// ⚠️ CONFIGURA ESTOS VALORES CON TUS CREDENCIALES DE HOSTINGER
// Los encuentras en: Panel Hostinger → Bases de datos → Detalles de la BD
$db_host = 'localhost';
$db_name = 'u214097926_godart';
$db_user = 'TU_USUARIO_DB';  // ← Cambia esto (ejemplo: u214097926_admin)
$db_pass = 'TU_PASSWORD_DB'; // ← Cambia esto

try {
  $pdo = new PDO(
    "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4",
    $db_user,
    $db_pass,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
  );

  // Obtener productos con su categoría
  $stmt = $pdo->query("
    SELECT 
      p.id,
      p.name,
      p.price,
      p.stock,
      p.mayoreo,
      p.menudeo,
      c.name AS category
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    ORDER BY p.id DESC
  ");

  $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

  // Convertir booleanos a 0/1 para compatibilidad con el frontend
  foreach ($products as &$product) {
    $product['mayoreo'] = $product['mayoreo'] ? 1 : 0;
    $product['menudeo'] = $product['menudeo'] ? 1 : 0;
  }

  echo json_encode([
    'ok' => true,
    'products' => $products,
  ]);
} catch (PDOException $e) {
  error_log('admin_products_list.php DB error: ' . $e->getMessage());
  http_response_code(500);
  echo json_encode([
    'ok' => false,
    'message' => 'Error interno del servidor',
  ]);
}
?>
