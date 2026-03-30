<?php
/**
 * Script para reactivar productos que fueron desactivados incorrectamente
 * por el cleanup_brands.php (eran productos diferentes de diferentes marcas,
 * no duplicados reales).
 */

require_once __DIR__ . '/_admin_common.php';

header('Content-Type: text/plain; charset=utf-8');

try {
    $pdo = adminGetPdo();
    echo "✓ Conexión a base de datos exitosa.\n\n";

    // IDs que fueron desactivados incorrectamente
    // (son productos reales de marcas diferentes, NO duplicados)
    $reactivateIds = [
        412,  // Cuaderno 100 Hojas - NORMA
        411,  // Cuaderno 100 Hojas - JEANBOOK
        468,  // Cuaderno Francés cocido - C14
        486,  // Cuaderno Francés - C7
        470,  // Cuaderno Italiano - C7
        475,  // Cuaderno Italiano Cocido - C5
        474,  // Cuaderno Italiano Cocido - C14
        491,  // Cuaderno Profesional - C5
        497,  // Cuaderno Profesional Cocido - C7
        74,   // Lápiz adhesivo 21g - BACO
        73,   // Lápiz adhesivo 22g - PRITT
        513,  // Lápiz adhesivo Pegamento 22g - PRITT
        362,  // Marcador Pizarron Blanco Azul - MAGISTRAL
        364,  // Marcador Permanente Color Rojo - BAZIC
        374,  // Marcador Permanente Fino Negro - A-INK
        375,  // Marcador Permanente Fino Negro - SHARPIE
        449,  // Sujetadores - BACO
        448,  // Sujetadores - BARRILITO
        447,  // Sujetadores - BINDER CLIP
        61,   // Silicon frío 30 ml - MAE
    ];

    echo "=== REACTIVANDO PRODUCTOS ===\n";
    $reactivated = 0;
    foreach ($reactivateIds as $id) {
        $stmt = $pdo->prepare("SELECT id, name, brand, is_active FROM products WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$product) {
            echo "  - [ID: {$id}] No encontrado\n";
            continue;
        }

        if ($product['is_active']) {
            echo "  - [ID: {$id}] \"{$product['name']}\" (marca: {$product['brand']}) — ya está activo\n";
            continue;
        }

        $updateStmt = $pdo->prepare("UPDATE products SET is_active = 1 WHERE id = :id");
        $updateStmt->execute(['id' => $id]);
        echo "  ✓ [ID: {$id}] \"{$product['name']}\" (marca: {$product['brand']}) — REACTIVADO\n";
        $reactivated++;
    }

    echo "\nTotal reactivados: {$reactivated}\n\n";

    // Resumen final
    $totalStmt = $pdo->query("SELECT COUNT(*) FROM products WHERE is_active = 1");
    $totalActive = $totalStmt->fetchColumn();
    $brandsStmt = $pdo->query("SELECT COUNT(DISTINCT brand) FROM products WHERE is_active = 1 AND brand IS NOT NULL AND TRIM(brand) != ''");
    $totalBrands = $brandsStmt->fetchColumn();
    echo "============================================\n";
    echo "Productos activos: {$totalActive}\n";
    echo "Marcas únicas: {$totalBrands}\n";
    echo "\n✓ Reactivación completada.\n";

} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
