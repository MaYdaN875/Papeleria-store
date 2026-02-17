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

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'message' => 'Método no permitido']);
  exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

if (!$email || !$password) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'message' => 'Faltan email o contraseña']);
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

  $stmt = $pdo->prepare('SELECT id, password_hash FROM admin_users WHERE email = :email');
  $stmt->execute(['email' => $email]);
  $user = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$user || !password_verify($password, $user['password_hash'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'message' => 'Credenciales incorrectas']);
    exit;
  }

  // Generar token simple (más adelante puedes usar JWT)
  $token = bin2hex(random_bytes(32));

  echo json_encode([
    'ok' => true,
    'token' => $token,
    'adminId' => (int)$user['id'],
  ]);
} catch (PDOException $e) {
  error_log('admin_login.php DB error: ' . $e->getMessage());
  http_response_code(500);
  echo json_encode(['ok' => false, 'message' => 'Error interno del servidor']);
}
?>
