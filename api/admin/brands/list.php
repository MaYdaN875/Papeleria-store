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
