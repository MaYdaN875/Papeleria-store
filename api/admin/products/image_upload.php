<?php
/**
 * Endpoint: admin_product_image_upload.php
 *
 * Función:
 * - Recibe una imagen por multipart/form-data.
 * - La guarda en /api/uploads/products y devuelve URL pública.
 * - Requiere sesión admin válida.
 */

require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['POST']);
adminRequireMethod('POST');

const ADMIN_UPLOAD_MAX_BYTES = 5242880; // 5MB

/**
 * Devuelve URL absoluta basada en host actual.
 */
function adminBuildAbsoluteUrl(string $path): string {
  $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['SERVER_PORT'] ?? '') === '443');
  $scheme = $isHttps ? 'https' : 'http';
  $host = $_SERVER['HTTP_HOST'] ?? '';
  if ($host === '') return $path;
  return $scheme . '://' . $host . $path;
}

try {
  $pdo = adminGetPdo();
  adminRequireSession($pdo);

  if (!isset($_FILES['image']) || !is_array($_FILES['image'])) {
    adminJsonResponse(400, ['ok' => false, 'message' => 'No se recibió archivo de imagen']);
  }

  $file = $_FILES['image'];
  $errorCode = (int)($file['error'] ?? UPLOAD_ERR_NO_FILE);
  if ($errorCode !== UPLOAD_ERR_OK) {
    adminJsonResponse(400, ['ok' => false, 'message' => 'Error al cargar el archivo']);
  }

  $tmpPath = (string)($file['tmp_name'] ?? '');
  $originalName = (string)($file['name'] ?? 'imagen');
  $fileSize = (int)($file['size'] ?? 0);

  if ($tmpPath === '' || !is_uploaded_file($tmpPath)) {
    adminJsonResponse(400, ['ok' => false, 'message' => 'Archivo inválido']);
  }

  if ($fileSize <= 0 || $fileSize > ADMIN_UPLOAD_MAX_BYTES) {
    adminJsonResponse(400, ['ok' => false, 'message' => 'La imagen debe pesar máximo 5MB']);
  }

  $finfo = finfo_open(FILEINFO_MIME_TYPE);
  $mimeType = $finfo ? (string)finfo_file($finfo, $tmpPath) : '';
  if ($finfo) finfo_close($finfo);

  $allowedMimeMap = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'image/gif' => 'gif',
  ];

  if (!isset($allowedMimeMap[$mimeType])) {
    adminJsonResponse(400, ['ok' => false, 'message' => 'Formato no permitido. Usa JPG, PNG, WEBP o GIF']);
  }

  $extension = $allowedMimeMap[$mimeType];
  $safeBaseName = preg_replace('/[^a-zA-Z0-9_-]+/', '-', pathinfo($originalName, PATHINFO_FILENAME) ?: 'producto');
  $safeBaseName = trim((string)$safeBaseName, '-');
  if ($safeBaseName === '') $safeBaseName = 'producto';

  $randomSuffix = bin2hex(random_bytes(6));
  $fileName = $safeBaseName . '-' . date('YmdHis') . '-' . $randomSuffix . '.' . $extension;

  $uploadDir = dirname(__DIR__, 2) . '/uploads/products';
  if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
      adminJsonResponse(500, ['ok' => false, 'message' => 'No se pudo crear la carpeta de imágenes']);
    }
  }

  $destinationPath = $uploadDir . '/' . $fileName;
  if (!move_uploaded_file($tmpPath, $destinationPath)) {
    adminJsonResponse(500, ['ok' => false, 'message' => 'No se pudo guardar la imagen']);
  }

  $publicPath = '/api/uploads/products/' . $fileName;
  $publicUrl = adminBuildAbsoluteUrl($publicPath);

  adminJsonResponse(200, [
    'ok' => true,
    'message' => 'Imagen subida correctamente',
    'imageUrl' => $publicUrl,
  ]);
} catch (Throwable $e) {
  error_log('admin_product_image_upload.php error: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}
