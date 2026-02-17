# Setup del Login Admin - Instrucciones paso a paso

## Paso 1: Crear tabla `admin_users` en phpMyAdmin

Ve a phpMyAdmin → Selecciona tu base de datos `u214097926_godart` → Pestaña **SQL** → Pega esto y ejecuta:

```sql
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Paso 2: Crear usuario admin de prueba

En la misma pestaña SQL, ejecuta esto (cambia `'tu_password_seguro_123'` por la contraseña que quieras):

```sql
INSERT INTO admin_users (email, password_hash) 
VALUES (
  'admin@godart.com',
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
);
```

**Nota:** El hash de arriba corresponde a la contraseña `password`. Si quieres otra contraseña, usa este PHP temporal para generar el hash:

```php
<?php
echo password_hash('TU_CONTRASEÑA_AQUI', PASSWORD_BCRYPT);
?>
```

Guarda ese archivo como `generar_hash.php`, súbelo a Hostinger, ejecútalo en el navegador, copia el hash y luego bórralo por seguridad.

## Paso 3: Crear archivos PHP en Hostinger

En tu panel de Hostinger, ve a **Administrador de archivos** → `public_html` → Crea una carpeta `api` (si no existe).

Dentro de `api`, crea estos dos archivos:

### `admin_login.php`

```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

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

// CONFIGURA ESTOS VALORES CON TUS CREDENCIALES DE HOSTINGER
$db_host = 'localhost';
$db_name = 'u214097926_godart';
$db_user = 'TU_USUARIO_DB';  // ← Cambia esto
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
  http_response_code(500);
  echo json_encode(['ok' => false, 'message' => 'Error de conexión a la base de datos']);
}
?>
```

### `admin_products_list.php`

```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// CONFIGURA ESTOS VALORES CON TUS CREDENCIALES DE HOSTINGER
$db_host = 'localhost';
$db_name = 'u214097926_godart';
$db_user = 'TU_USUARIO_DB';  // ← Cambia esto
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

  // Convertir booleanos a 0/1 para compatibilidad
  foreach ($products as &$product) {
    $product['mayoreo'] = $product['mayoreo'] ? 1 : 0;
    $product['menudeo'] = $product['menudeo'] ? 1 : 0;
  }

  echo json_encode([
    'ok' => true,
    'products' => $products,
  ]);
} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode([
    'ok' => false,
    'message' => 'Error al cargar productos: ' . $e->getMessage(),
  ]);
}
?>
```

## Paso 4: Configurar variables en el proyecto React

En la raíz de tu proyecto React, crea o edita el archivo `.env`:

```env
VITE_API_URL=https://tu-dominio.com/api
```

**Ejemplo:** Si tu dominio es `godart.hostinger.com`, sería:
```env
VITE_API_URL=https://godart.hostinger.com/api
```

## Paso 5: Probar

1. Reinicia el servidor de desarrollo: `npm run dev`
2. Ve a `http://localhost:5173/admin/login`
3. Email: `admin@godart.com`
4. Contraseña: `password` (o la que hayas configurado)

Si todo está bien, deberías entrar al panel y ver la tabla con tus productos.

---

## Troubleshooting

### Error: "Falta configurar VITE_API_URL"
- Verifica que el archivo `.env` existe y tiene `VITE_API_URL=...`
- Reinicia `npm run dev` después de crear/editar `.env`

### Error: "No se pudo iniciar sesión en el servidor"
- Verifica que `admin_login.php` está en `public_html/api/`
- Verifica que las credenciales de BD (`$db_user`, `$db_pass`) son correctas
- Verifica que la tabla `admin_users` existe y tiene datos

### Error: "No se pudieron cargar los productos"
- Verifica que `admin_products_list.php` está en `public_html/api/`
- Verifica que la tabla `products` tiene datos
- Verifica que la columna `category_id` existe en `products` y coincide con `categories.id`
