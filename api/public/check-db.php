<?php
/**
 * Diagnóstico de conexión a la base de datos.
 * Abre en el navegador: https://tu-dominio.com/api/public/check-db.php
 * para ver el error exacto. BORRA o protege este archivo en producción.
 */
header('Content-Type: application/json; charset=utf-8');

$out = [
  'ok' => false,
  'step' => '',
  'message' => '',
  'db_host' => '(oculto)',
  'db_name' => '(oculto)',
];

try {
  $out['step'] = 'loading_config';
  require_once __DIR__ . '/../core/config.php';
  $out['db_host'] = ADMIN_DB_HOST;
  $out['db_name'] = ADMIN_DB_NAME;

  $out['step'] = 'connecting';
  $pdo = new PDO(
    'mysql:host=' . ADMIN_DB_HOST . ';dbname=' . ADMIN_DB_NAME . ';charset=utf8mb4',
    ADMIN_DB_USER,
    ADMIN_DB_PASS,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
  );

  $out['step'] = 'query_test';
  $pdo->query('SELECT 1');
  $out['ok'] = true;
  $out['message'] = 'Conexión correcta. La base de datos responde.';
} catch (PDOException $e) {
  $out['step'] = 'error';
  $out['message'] = $e->getMessage();
  $out['code'] = $e->getCode();
  // No exponer contraseña
  if (strpos($out['message'], ADMIN_DB_PASS) !== false) {
    $out['message'] = str_replace(ADMIN_DB_PASS, '***', $out['message']);
  }
} catch (Throwable $e) {
  $out['step'] = 'error';
  $out['message'] = $e->getMessage();
  $out['file'] = basename($e->getFile());
  $out['line'] = $e->getLine();
}

echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
