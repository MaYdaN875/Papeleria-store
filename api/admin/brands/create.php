<?php
/**
 * Endpoint: admin/brands/create.php
 * Agrega una nueva marca vacía a la base de datos de referencias.
 * Auto-crea la tabla brands si no existe.
 */
require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['POST', 'OPTIONS']);
adminRequireMethod('POST');

try {
    $pdo = adminGetPdo();
    adminRequireSession($pdo);

    // Auto-crear la tabla brands si no existe
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS brands (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!isset($data['name'])) {
        adminJsonResponse(400, ['ok' => false, 'message' => 'Falta el nombre de la marca']);
    }

    $name = trim($data['name']);
    if ($name === '') {
        adminJsonResponse(400, ['ok' => false, 'message' => 'El nombre no puede estar vacío']);
    }

    // Verificar si la marca ya existe (case-insensitive)
    $checkStmt = $pdo->prepare('SELECT COUNT(*) FROM brands WHERE LOWER(name) = LOWER(?)');
    $checkStmt->execute([$name]);
    $exists = (int)$checkStmt->fetchColumn() > 0;

    if ($exists) {
        adminJsonResponse(409, ['ok' => false, 'message' => 'La marca "' . $name . '" ya existe en el catálogo.']);
    }

    $stmt = $pdo->prepare('INSERT INTO brands (name) VALUES (?)');
    $stmt->execute([$name]);

    adminJsonResponse(200, [
        'ok' => true,
        'message' => 'Marca "' . $name . '" registrada exitosamente.'
    ]);

} catch (PDOException $e) {
    adminJsonResponse(500, ['ok' => false, 'message' => 'Error de base de datos: ' . $e->getMessage()]);
}
