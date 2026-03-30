<?php
/**
 * Script de limpieza de marcas en la base de datos.
 * 
 * 1. Quita puntos al inicio de las marcas (ej. ".MAPITA" → "MAPITA")
 * 2. Si ya existe un producto con la marca correcta (sin punto), desactiva el duplicado viejo
 * 3. Muestra un reporte de todo lo que hizo
 * 
 * Ejecutar UNA sola vez desde el navegador:
 *   https://tu-dominio.com/api/cleanup_brands.php
 */

require_once __DIR__ . '/_admin_common.php';

header('Content-Type: text/plain; charset=utf-8');

try {
    $pdo = adminGetPdo();
    echo "✓ Conexión a base de datos exitosa.\n\n";

    // ============================================================
    // PASO 1: Encontrar marcas con punto al inicio
    // ============================================================
    echo "=== MARCAS CON PUNTO AL INICIO ===\n";
    $stmt = $pdo->query("SELECT id, name, brand FROM products WHERE brand LIKE '.%'");
    $dotBrands = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($dotBrands)) {
        echo "No se encontraron marcas con punto al inicio.\n\n";
    } else {
        echo "Encontrados " . count($dotBrands) . " productos con punto en la marca:\n";
        foreach ($dotBrands as $product) {
            $oldBrand = $product['brand'];
            $newBrand = ltrim($oldBrand, '.');
            echo "  - [ID: {$product['id']}] \"{$product['name']}\" — marca: \"{$oldBrand}\" → \"{$newBrand}\"\n";

            // Verificar si ya existe un producto con la marca corregida (sin punto)
            $checkStmt = $pdo->prepare("SELECT id FROM products WHERE name = :name AND brand = :brand AND id != :id LIMIT 1");
            $checkStmt->execute([
                'name' => $product['name'],
                'brand' => $newBrand,
                'id' => $product['id'],
            ]);
            $duplicate = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if ($duplicate) {
                // Ya existe el producto correcto → desactivar el viejo (con punto)
                $deactivateStmt = $pdo->prepare("UPDATE products SET is_active = 0 WHERE id = :id");
                $deactivateStmt->execute(['id' => $product['id']]);
                echo "    → DESACTIVADO (duplicado del producto ID: {$duplicate['id']} que ya tiene la marca correcta)\n";
            } else {
                // No hay duplicado → corregir la marca quitando el punto
                $fixStmt = $pdo->prepare("UPDATE products SET brand = :brand WHERE id = :id");
                $fixStmt->execute([
                    'brand' => $newBrand,
                    'id' => $product['id'],
                ]);
                echo "    → CORREGIDO a \"{$newBrand}\"\n";
            }
        }
        echo "\n";
    }

    // ============================================================
    // PASO 2: Encontrar marcas vacías o nulas
    // ============================================================
    echo "=== PRODUCTOS SIN MARCA ===\n";
    $stmt = $pdo->query("SELECT id, name, brand, is_active FROM products WHERE (brand IS NULL OR TRIM(brand) = '') AND is_active = 1");
    $noBrandProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($noBrandProducts)) {
        echo "Todos los productos activos tienen marca.\n\n";
    } else {
        echo "Encontrados " . count($noBrandProducts) . " productos activos sin marca:\n";
        foreach ($noBrandProducts as $product) {
            echo "  - [ID: {$product['id']}] \"{$product['name']}\"\n";
        }
        echo "\n(Estos productos aparecerán sin 'Marca:' en la tienda. Si quieres asignarles marca, hazlo desde el panel admin.)\n\n";
    }

    // ============================================================
    // PASO 3: Detectar marcas con espacios extra o caracteres raros
    // ============================================================
    echo "=== MARCAS CON ESPACIOS EXTRA O CARACTERES RAROS ===\n";
    $stmt = $pdo->query("SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL AND (brand LIKE ' %' OR brand LIKE '% ' OR brand LIKE '%.%' OR brand != TRIM(brand)) AND is_active = 1");
    $weirdBrands = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (empty($weirdBrands)) {
        echo "No se encontraron marcas con espacios extra.\n\n";
    } else {
        echo "Marcas con posibles problemas:\n";
        foreach ($weirdBrands as $brand) {
            echo "  - \"{$brand}\"\n";
        }
        // Limpiar espacios extra
        $pdo->exec("UPDATE products SET brand = TRIM(brand) WHERE brand != TRIM(brand)");
        echo "→ Espacios extra limpiados.\n\n";
    }

    // ============================================================
    // PASO 4: Detectar productos duplicados (mismo nombre, diferente marca)
    // Estos son productos viejos que quedaron cuando se importó el CSV nuevo
    // ============================================================
    echo "=== PRODUCTOS DUPLICADOS (MISMO NOMBRE, DIFERENTE MARCA) ===\n";
    $stmt = $pdo->query("
        SELECT name, COUNT(*) as cnt, GROUP_CONCAT(CONCAT(id, ':', COALESCE(brand, 'SIN MARCA'), ':', stock) SEPARATOR ' | ') as variants
        FROM products 
        WHERE is_active = 1
        GROUP BY name 
        HAVING COUNT(*) > 1
        ORDER BY name
    ");
    $duplicates = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($duplicates)) {
        echo "No se encontraron productos duplicados.\n\n";
    } else {
        $totalDeactivated = 0;
        echo "Encontrados " . count($duplicates) . " nombres de productos con duplicados:\n\n";
        foreach ($duplicates as $dup) {
            echo "  \"{$dup['name']}\" ({$dup['cnt']} versiones):\n";
            echo "    Variantes: {$dup['variants']}\n";

            // Obtener todos los productos con este nombre
            $prodStmt = $pdo->prepare("SELECT id, brand, stock, price FROM products WHERE name = :name AND is_active = 1 ORDER BY id DESC");
            $prodStmt->execute(['name' => $dup['name']]);
            $products = $prodStmt->fetchAll(PDO::FETCH_ASSOC);

            if (count($products) <= 1) continue;

            // Quedarse con el más nuevo (ID más alto = importado más recientemente)
            $keep = $products[0]; // El de ID más alto
            echo "    → Conservando ID: {$keep['id']} (marca: " . ($keep['brand'] ?: 'SIN MARCA') . ")\n";

            for ($i = 1; $i < count($products); $i++) {
                $old = $products[$i];
                $deactivateStmt = $pdo->prepare("UPDATE products SET is_active = 0 WHERE id = :id");
                $deactivateStmt->execute(['id' => $old['id']]);
                echo "    → Desactivando ID: {$old['id']} (marca: " . ($old['brand'] ?: 'SIN MARCA') . ") — DUPLICADO VIEJO\n";
                $totalDeactivated++;
            }
            echo "\n";
        }
        echo "Total duplicados desactivados: {$totalDeactivated}\n\n";
    }

    // ============================================================
    // RESUMEN FINAL
    // ============================================================
    echo "============================================\n";
    echo "           RESUMEN DE LIMPIEZA\n";
    echo "============================================\n";
    $totalStmt = $pdo->query("SELECT COUNT(*) FROM products WHERE is_active = 1");
    $totalActive = $totalStmt->fetchColumn();
    $brandsStmt = $pdo->query("SELECT COUNT(DISTINCT brand) FROM products WHERE is_active = 1 AND brand IS NOT NULL AND TRIM(brand) != ''");
    $totalBrands = $brandsStmt->fetchColumn();
    echo "Productos activos: {$totalActive}\n";
    echo "Marcas únicas: {$totalBrands}\n";
    echo "\n✓ Limpieza completada.\n";

} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
