<?php
/**
 * Helpers de acceso a base de datos y metadata de esquema.
 */

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
