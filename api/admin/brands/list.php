<?php
/**
 * Endpoint: admin/brands/list.php
 * Obtiene todas las marcas del sistema (de la tabla brands y las existentes en products).
 */
require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['GET', 'OPTIONS']);
adminRequireMethod('GET');

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

    // Obtener desde tabla products
    $stmtProducts = $pdo->query("SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL AND brand != ''");
    $productBrands = $stmtProducts->fetchAll(PDO::FETCH_COLUMN) ?: [];

    // Obtener desde tabla brands
    $stmtBrands = $pdo->query("SELECT name FROM brands");
    $dictBrands = $stmtBrands->fetchAll(PDO::FETCH_COLUMN) ?: [];

    // Unir ambas listas para tener el diccionario completo sin duplicados
    $allBrands = array_values(array_unique(array_merge($productBrands, $dictBrands)));
    sort($allBrands);

    adminJsonResponse(200, [
        'ok' => true,
        'brands' => $allBrands,
    ]);
} catch (PDOException $e) {
    adminJsonResponse(500, ['ok' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
