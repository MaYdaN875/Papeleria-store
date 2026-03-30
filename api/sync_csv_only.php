<?php
/**
 * Script que desactiva TODOS los productos que NO están en el CSV.
 * Solo quedarán activos los productos que coincidan con el CSV.
 * 
 * Ejecutar UNA sola vez:
 *   https://tu-dominio.com/api/sync_csv_only.php
 */

require_once __DIR__ . '/_admin_common.php';

header('Content-Type: text/plain; charset=utf-8');

try {
    $pdo = adminGetPdo();
    echo "✓ Conexión a base de datos exitosa.\n\n";

    // ============================================================
    // PASO 1: Leer el CSV y construir lista de productos válidos
    // ============================================================
    $csvPath = __DIR__ . '/../Inventario_con_Subclases_MEJORADO1.csv';
    if (!file_exists($csvPath)) {
        echo "ERROR: No se encontró el archivo CSV en: {$csvPath}\n";
        exit;
    }

    $csvLines = file($csvPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if (empty($csvLines)) {
        echo "ERROR: El archivo CSV está vacío.\n";
        exit;
    }

    // Detectar separador
    $firstDataLine = $csvLines[1] ?? '';
    $separator = (substr_count($firstDataLine, ';') > substr_count($firstDataLine, ',')) ? ';' : ',';

    // Construir set de identidades del CSV (nombre + marca en minúsculas)
    $csvIdentities = [];
    $csvCount = 0;
    for ($i = 1; $i < count($csvLines); $i++) {
        $line = $csvLines[$i];
        
        // Parsear CSV respetando comillas
        $fields = str_getcsv($line, $separator);
        if (count($fields) < 3) continue;

        $name = trim($fields[1]);
        $brand = trim($fields[2]);
        
        if ($name === '') continue;

        // Clave de identidad: nombre + marca en minúsculas
        $key = mb_strtolower($name, 'UTF-8') . '|' . mb_strtolower($brand, 'UTF-8');
        $csvIdentities[$key] = true;
        $csvCount++;
    }

    echo "Productos en CSV: {$csvCount}\n";
    echo "Identidades únicas: " . count($csvIdentities) . "\n\n";

    // ============================================================
    // PASO 2: Comparar con la base de datos
    // ============================================================
    $stmt = $pdo->query("SELECT id, name, COALESCE(brand, '') AS brand, is_active FROM products ORDER BY id");
    $allProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $toDeactivate = [];
    $alreadyInactive = 0;
    $csvMatches = 0;

    foreach ($allProducts as $product) {
        $key = mb_strtolower(trim($product['name']), 'UTF-8') . '|' . mb_strtolower(trim($product['brand']), 'UTF-8');
        
        if (isset($csvIdentities[$key])) {
            // Está en el CSV → debe estar activo
            $csvMatches++;
            if (!$product['is_active']) {
                // Reactivar si estaba inactivo
                $pdo->prepare("UPDATE products SET is_active = 1 WHERE id = :id")->execute(['id' => $product['id']]);
            }
        } else {
            // NO está en el CSV
            if ($product['is_active']) {
                $toDeactivate[] = $product;
            } else {
                $alreadyInactive++;
            }
        }
    }

    echo "Productos que coinciden con CSV: {$csvMatches}\n";
    echo "Ya estaban inactivos: {$alreadyInactive}\n\n";

    // ============================================================
    // PASO 3: Desactivar productos que NO están en el CSV
    // ============================================================
    if (empty($toDeactivate)) {
        echo "No hay productos activos que estén fuera del CSV.\n\n";
    } else {
        echo "=== DESACTIVANDO " . count($toDeactivate) . " PRODUCTOS QUE NO ESTÁN EN EL CSV ===\n";
        foreach ($toDeactivate as $product) {
            $pdo->prepare("UPDATE products SET is_active = 0 WHERE id = :id")->execute(['id' => $product['id']]);
            $brandLabel = $product['brand'] ?: 'SIN MARCA';
            echo "  ✗ [ID: {$product['id']}] \"{$product['name']}\" (marca: {$brandLabel}) — DESACTIVADO\n";
        }
        echo "\n";
    }

    // ============================================================
    // RESUMEN FINAL
    // ============================================================
    $totalStmt = $pdo->query("SELECT COUNT(*) FROM products WHERE is_active = 1");
    $totalActive = $totalStmt->fetchColumn();
    echo "============================================\n";
    echo "       RESUMEN DE SINCRONIZACIÓN\n";
    echo "============================================\n";
    echo "Productos en CSV:        {$csvCount}\n";
    echo "Productos activos ahora: {$totalActive}\n";
    echo "Productos desactivados:  " . count($toDeactivate) . "\n";
    echo "\n✓ Sincronización completada.\n";

} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
