<?php
/**
 * Script de importación masiva de productos desde CSV.
 *
 * Uso:
 *   1. Subir este archivo + Inventario.csv al servidor (misma carpeta que api/)
 *   2. Ejecutar desde navegador: https://tu-dominio.com/api/import_products.php
 *      o desde terminal:          php import_products.php
 *
 * El CSV debe usar ; como separador y tener estos headers:
 *   Stock ; Producto y Descripción ; Marca ; Categorias ; Precio ; Precio Mayoreo ; Stock mayoreo
 */

require_once __DIR__ . '/core/config.php';
require_once __DIR__ . '/core/db.php';

// ========== CONFIGURACIÓN ==========

$csvFile = __DIR__ . '/../Inventario.csv';  // Ruta al CSV

// ========== FUNCIONES AUXILIARES ==========

function slugify(string $text): string
{
    $value = mb_strtolower($text, 'UTF-8');
    if (function_exists('iconv')) {
        $converted = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
        if ($converted !== false) {
            $value = $converted;
        }
    }
    $value = preg_replace('/[^a-z0-9]+/', '-', $value);
    $value = trim((string) $value, '-');
    return $value !== '' ? $value : 'producto';
}

/**
 * Limpia un valor de precio: quita "$", espacios, texto extra.
 * Devuelve float o null si no es un número válido.
 */
function cleanPrice(string $raw): ?float
{
    $raw = trim($raw);
    if ($raw === '' || $raw === '$') return null;

    // Quitar $ y espacios
    $clean = str_replace(['$', ' '], '', $raw);

    // Si contiene texto como "$10 x Mtr." o "$4pz", extraer solo el número
    if (preg_match('/^(\d+(?:\.\d+)?)/', $clean, $matches)) {
        $val = (float) $matches[1];
        return $val > 0 ? $val : null;
    }

    return null;
}

/**
 * Limpia un valor de stock: quita "." final, espacios.
 * Devuelve int.
 */
function cleanStock(string $raw): int
{
    $raw = trim($raw);
    $raw = rtrim($raw, '.');  // Quitar punto final (ej: "19.")
    $val = (int) $raw;
    return $val > 0 ? $val : 0;
}

// ========== INICIO ==========

// Output como texto plano
header('Content-Type: text/plain; charset=utf-8');

if (!file_exists($csvFile)) {
    echo "ERROR: No se encontró el archivo CSV en: $csvFile\n";
    exit(1);
}

try {
    $pdo = adminGetPdo();
    echo "✓ Conexión a base de datos exitosa.\n\n";
} catch (Exception $e) {
    echo "ERROR: No se pudo conectar a la base de datos: " . $e->getMessage() . "\n";
    exit(1);
}

// --- 1. Leer categorías existentes ---
$catStmt = $pdo->query('SELECT id, name FROM categories');
$existingCategories = [];
while ($row = $catStmt->fetch(PDO::FETCH_ASSOC)) {
    $existingCategories[mb_strtolower(trim($row['name']), 'UTF-8')] = (int) $row['id'];
}
echo "Categorías existentes: " . count($existingCategories) . "\n";
foreach ($existingCategories as $name => $id) {
    echo "  - [$id] $name\n";
}
echo "\n";

// --- 2. Preparar statements ---
$insertCatStmt = $pdo->prepare('INSERT INTO categories (name) VALUES (:name)');

$slugExistsStmt = $pdo->prepare('SELECT COUNT(*) FROM products WHERE slug = :slug');

$insertProductStmt = $pdo->prepare('
    INSERT INTO products (
        category_id, name, slug, description, brand, price, stock, sku,
        mayoreo, menudeo,
        mayoreo_price, mayoreo_stock, menudeo_price, menudeo_stock,
        is_active
    ) VALUES (
        :category_id, :name, :slug, :description, :brand, :price, :stock, NULL,
        :mayoreo, :menudeo,
        :mayoreo_price, :mayoreo_stock, :menudeo_price, :menudeo_stock,
        1
    )
');

// --- 3. Leer CSV ---
$handle = fopen($csvFile, 'r');
if (!$handle) {
    echo "ERROR: No se pudo abrir el archivo CSV.\n";
    exit(1);
}

// Detectar BOM UTF-8 y saltarlo
$bom = fread($handle, 3);
if ($bom !== "\xEF\xBB\xBF") {
    rewind($handle);
}

// Leer header
$headerLine = fgets($handle);
$headers = str_getcsv(trim($headerLine), ';');
echo "Headers detectados: " . implode(' | ', $headers) . "\n\n";

$inserted = 0;
$skipped = 0;
$errors = [];
$lineNum = 1;

while (($line = fgets($handle)) !== false) {
    $lineNum++;
    $line = trim($line);
    if ($line === '') continue;

    $fields = str_getcsv($line, ';');

    // Asegurar que haya suficientes campos
    while (count($fields) < 7) {
        $fields[] = '';
    }

    $rawStock       = trim($fields[0]);
    $rawName        = trim($fields[1]);
    $rawBrand       = trim($fields[2]);
    $rawCategory    = trim($fields[3]);
    $rawPrice       = trim($fields[4]);
    $rawMayoreoP    = trim($fields[5]);
    $rawMayoreoS    = trim($fields[6]);

    // Validaciones básicas
    if ($rawName === '') {
        $errors[] = "Línea $lineNum: nombre vacío, se salta.";
        $skipped++;
        continue;
    }

    $stock = cleanStock($rawStock);
    $price = cleanPrice($rawPrice);
    $mayoreoPrice = cleanPrice($rawMayoreoP);
    $mayoreoStock = cleanStock($rawMayoreoS);

    // Si no tiene precio normal, usar 0 (se marcará para revisión)
    $finalPrice = $price ?? 0;

    // Categoría: buscar o crear
    $categoryId = null;
    if ($rawCategory !== '') {
        $catKey = mb_strtolower($rawCategory, 'UTF-8');
        if (isset($existingCategories[$catKey])) {
            $categoryId = $existingCategories[$catKey];
        } else {
            // Crear categoría nueva
            $insertCatStmt->execute(['name' => $rawCategory]);
            $categoryId = (int) $pdo->lastInsertId();
            $existingCategories[$catKey] = $categoryId;
            echo "  → Nueva categoría creada: '$rawCategory' [ID: $categoryId]\n";
        }
    }

    // Si no tiene categoría, asignar "Sin categoría"
    if ($categoryId === null) {
        $defaultCatKey = 'sin categoría';
        if (isset($existingCategories[$defaultCatKey])) {
            $categoryId = $existingCategories[$defaultCatKey];
        } else {
            $insertCatStmt->execute(['name' => 'Sin categoría']);
            $categoryId = (int) $pdo->lastInsertId();
            $existingCategories[$defaultCatKey] = $categoryId;
            echo "  → Nueva categoría creada: 'Sin categoría' [ID: $categoryId]\n";
        }
    }

    // Generar slug único
    $baseSlug = slugify($rawName);
    $slug = $baseSlug;
    $slugSuffix = 1;
    while (true) {
        $slugExistsStmt->execute(['slug' => $slug]);
        if ((int) $slugExistsStmt->fetchColumn() === 0) break;
        $slugSuffix++;
        $slug = $baseSlug . '-' . $slugSuffix;
    }

    // Determinar flags mayoreo/menudeo
    $hasMayoreo = ($mayoreoPrice !== null && $mayoreoPrice > 0);
    $menudeo = 1;  // Siempre activo (el precio base ES menudeo)

    // Descripción = marca si existe
    $description = $rawBrand !== '' ? $rawBrand : null;

    try {
        $insertProductStmt->execute([
            'category_id'   => $categoryId,
            'name'          => $rawName,
            'slug'          => $slug,
            'description'   => $description,
            'brand'         => $rawBrand !== '' ? $rawBrand : null,
            'price'         => $finalPrice,
            'stock'         => $stock,
            'mayoreo'       => $hasMayoreo ? 1 : 0,
            'menudeo'       => $menudeo,
            'mayoreo_price' => $mayoreoPrice,
            'mayoreo_stock' => $hasMayoreo ? $mayoreoStock : 0,
            'menudeo_price' => $finalPrice > 0 ? $finalPrice : null,
            'menudeo_stock' => $stock,
        ]);
        $inserted++;

        if ($finalPrice === 0) {
            $errors[] = "Línea $lineNum: '$rawName' — precio = 0 (revisar manualmente).";
        }
    } catch (PDOException $e) {
        $errors[] = "Línea $lineNum: '$rawName' — Error DB: " . $e->getMessage();
        $skipped++;
    }
}

fclose($handle);

// --- 4. Resumen ---
echo "\n========================================\n";
echo "        RESUMEN DE IMPORTACIÓN\n";
echo "========================================\n";
echo "Total líneas procesadas: " . ($lineNum - 1) . "\n";
echo "Productos insertados:    $inserted\n";
echo "Productos saltados:      $skipped\n";
echo "========================================\n\n";

if (count($errors) > 0) {
    echo "AVISOS / ERRORES:\n";
    foreach ($errors as $err) {
        echo "  ⚠ $err\n";
    }
}

echo "\n✓ Importación completada.\n";
