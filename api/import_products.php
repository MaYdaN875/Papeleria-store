<?php
/**
 * Script de importación masiva de productos desde CSV.
 *
 * Uso:
 *   1. Subir este archivo + Inventario.csv al servidor (misma carpeta que api/)
 *   2. Ejecutar desde navegador: https://tu-dominio.com/api/import_products.php
 *      o desde terminal:          php import_products.php
 *
 * El CSV puede usar ";" o "," como separador y tener estos headers:
 *   Stock, Producto y Descripción, Marca, Categorias, Precio, Precio Mayoreo, Stock mayoreo, Subclase(opcional)
 */

require_once __DIR__ . '/core/config.php';
require_once __DIR__ . '/core/db.php';

// ========== CONFIGURACIÓN ==========

$csvCandidates = [
    __DIR__ . '/../Inventario_con_Subclases_MEJORADO1.csv',
    __DIR__ . '/../Inventario.csv',
];

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
    if ($raw === '' || $raw === '$') {
        return null;
    }

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

function normalizeHeaderName(string $value): string
{
    $value = mb_strtolower(trim($value), 'UTF-8');
    $value = str_replace(['á', 'é', 'í', 'ó', 'ú'], ['a', 'e', 'i', 'o', 'u'], $value);
    return preg_replace('/\s+/', ' ', $value) ?? '';
}

function productIdentityKey(string $name, string $brand): string
{
    $normalizedName = mb_strtolower(trim($name), 'UTF-8');
    $normalizedBrand = mb_strtolower(trim($brand), 'UTF-8');
    return $normalizedName . '|' . $normalizedBrand;
}

// ========== INICIO ==========

// Output como texto plano
header('Content-Type: text/plain; charset=utf-8');

$csvFile = null;
foreach ($csvCandidates as $candidatePath) {
    if (file_exists($candidatePath)) {
        $csvFile = $candidatePath;
        break;
    }
}

if ($csvFile === null) {
    echo "ERROR: No se encontró ningún CSV candidato.\n";
    foreach ($csvCandidates as $candidatePath) {
        echo "  - $candidatePath\n";
    }
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
$catStmt = $pdo->query('SELECT id, name, parent_id FROM categories');
$existingCategories = [];
while ($row = $catStmt->fetch(PDO::FETCH_ASSOC)) {
    $normalizedName = mb_strtolower(trim((string) $row['name']), 'UTF-8');
    $categoryId = (int) $row['id'];
    $parentId = $row['parent_id'] === null ? null : (int) $row['parent_id'];
    $existingCategories[$normalizedName] = $categoryId;
    if ($parentId !== null) {
        $existingCategories[$normalizedName . '|parent:' . $parentId] = $categoryId;
    }
}
echo "Categorías existentes: " . count($existingCategories) . "\n";
foreach ($existingCategories as $name => $id) {
    echo "  - [$id] $name\n";
}
echo "\n";

// --- 2. Preparar statements ---
$insertCatStmt = $pdo->prepare('INSERT INTO categories (name, parent_id, slug, is_active) VALUES (:name, :parent_id, :slug, 1)');

$slugExistsStmt = $pdo->prepare('SELECT COUNT(*) FROM products WHERE slug = :slug');
$updateProductStmt = $pdo->prepare('
    UPDATE products
    SET
        category_id = :category_id,
        name = :name,
        description = :description,
        brand = :brand,
        price = :price,
        stock = :stock,
        mayoreo = :mayoreo,
        menudeo = :menudeo,
        mayoreo_price = :mayoreo_price,
        mayoreo_stock = :mayoreo_stock,
        menudeo_price = :menudeo_price,
        menudeo_stock = :menudeo_stock,
        is_active = 1
    WHERE id = :id
');

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
$delimiter = str_contains((string) $headerLine, ';') ? ';' : ',';
$headers = str_getcsv(trim((string) $headerLine), $delimiter);
echo "Headers detectados: " . implode(' | ', $headers) . "\n\n";
echo "Separador detectado: '$delimiter'\n\n";

$headerIndex = [];
foreach ($headers as $headerPosition => $headerName) {
    $headerIndex[normalizeHeaderName((string) $headerName)] = $headerPosition;
}

$subcategoryHeaderKeys = [
    'subclase',
    'subclases',
    'sub categoria',
    'subcategoria',
    'subcategorias',
    'subcategoría',
    'subcategorías',
];
$subcategoryColumnIndex = null;
foreach ($subcategoryHeaderKeys as $candidateKey) {
    if (!array_key_exists($candidateKey, $headerIndex)) {
        continue;
    }
    $subcategoryColumnIndex = (int) $headerIndex[$candidateKey];
    break;
}

$inserted = 0;
$updated = 0;
$skipped = 0;
$errors = [];
$lineNum = 1;

$existingProductsStmt = $pdo->query('SELECT id, name, COALESCE(brand, "") AS brand FROM products');
$existingProductsByIdentity = [];
while ($existingProduct = $existingProductsStmt->fetch(PDO::FETCH_ASSOC)) {
    $identityKey = productIdentityKey(
        (string) ($existingProduct['name'] ?? ''),
        (string) ($existingProduct['brand'] ?? '')
    );
    $existingProductsByIdentity[$identityKey] = (int) ($existingProduct['id'] ?? 0);
}

while (($line = fgets($handle)) !== false) {
    $lineNum++;
    $line = trim($line);
    if ($line === '') {
        continue;
    }

    $fields = str_getcsv($line, $delimiter);

    // Asegurar que haya suficientes campos
    while (count($fields) < 8) {
        $fields[] = '';
    }

    $rawStock       = trim($fields[0]);
    $rawName        = trim($fields[1]);
    $rawBrand       = trim($fields[2]);
    $rawCategory    = trim($fields[3]);
    $rawPrice       = trim($fields[4]);
    $rawMayoreoP    = trim($fields[5]);
    $rawMayoreoS    = trim($fields[6]);
    $rawSubcategory = $subcategoryColumnIndex === null ? '' : trim((string) ($fields[$subcategoryColumnIndex] ?? ''));

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
    $parentCategoryId = null;
    if ($rawCategory !== '') {
        $catKey = mb_strtolower($rawCategory, 'UTF-8');
        if (isset($existingCategories[$catKey])) {
            $parentCategoryId = $existingCategories[$catKey];
        } else {
            // Crear categoría nueva
            $catSlug = slugify($rawCategory) . '-' . rand(1000, 9999);
            $insertCatStmt->execute(['name' => $rawCategory, 'parent_id' => null, 'slug' => $catSlug]);
            $parentCategoryId = (int) $pdo->lastInsertId();
            $existingCategories[$catKey] = $parentCategoryId;
            echo "  → Nueva categoría creada: '$rawCategory' [ID: $parentCategoryId]\n";
        }
    }

    // Si no tiene categoría, asignar "Sin categoría"
    if ($parentCategoryId === null) {
        $defaultCatKey = 'sin categoría';
        if (isset($existingCategories[$defaultCatKey])) {
            $parentCategoryId = $existingCategories[$defaultCatKey];
        } else {
            $catSlug = slugify('Sin categoría') . '-' . rand(1000, 9999);
            $insertCatStmt->execute(['name' => 'Sin categoría', 'parent_id' => null, 'slug' => $catSlug]);
            $parentCategoryId = (int) $pdo->lastInsertId();
            $existingCategories[$defaultCatKey] = $parentCategoryId;
            echo "  → Nueva categoría creada: 'Sin categoría' [ID: $parentCategoryId]\n";
        }
    }

    $categoryId = $parentCategoryId;
    if ($rawSubcategory !== '') {
        $subKey = mb_strtolower($rawSubcategory, 'UTF-8') . '|parent:' . (int) $parentCategoryId;
        if (isset($existingCategories[$subKey])) {
            $categoryId = $existingCategories[$subKey];
        } else {
            $catSlug = slugify($rawSubcategory) . '-' . rand(1000, 9999);
            $insertCatStmt->execute(['name' => $rawSubcategory, 'parent_id' => $parentCategoryId, 'slug' => $catSlug]);
            $categoryId = (int) $pdo->lastInsertId();
            $existingCategories[$subKey] = $categoryId;
            echo "  → Nueva subcategoría creada: '$rawSubcategory' [ID: $categoryId] (Padre: $parentCategoryId)\n";
        }
    }

    // Generar slug único
    $baseSlug = slugify($rawName);
    $slug = $baseSlug;
    $slugSuffix = 1;
    while (true) {
        $slugExistsStmt->execute(['slug' => $slug]);
        if ((int) $slugExistsStmt->fetchColumn() === 0) {
            break;
        }
        $slugSuffix++;
        $slug = $baseSlug . '-' . $slugSuffix;
    }

    // Determinar flags mayoreo/menudeo
    $hasMayoreo = ($mayoreoPrice !== null && $mayoreoPrice > 0);
    $menudeo = 1;  // Siempre activo (el precio base ES menudeo)

    // Descripción = marca si existe
    $description = $rawBrand !== '' ? $rawBrand : null;

    $identityKey = productIdentityKey($rawName, $rawBrand);
    $existingProductId = $existingProductsByIdentity[$identityKey] ?? 0;

    try {
        if ($existingProductId > 0) {
            $updateProductStmt->execute([
                'id'           => $existingProductId,
                'category_id'  => $categoryId,
                'name'         => $rawName,
                'description'  => $description,
                'brand'        => $rawBrand !== '' ? $rawBrand : null,
                'price'        => $finalPrice,
                'stock'        => $stock,
                'mayoreo'      => $hasMayoreo ? 1 : 0,
                'menudeo'      => $menudeo,
                'mayoreo_price'=> $mayoreoPrice,
                'mayoreo_stock'=> $hasMayoreo ? $mayoreoStock : 0,
                'menudeo_price'=> $finalPrice > 0 ? $finalPrice : null,
                'menudeo_stock'=> $stock,
            ]);
            $updated++;
        } else {
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
            $newProductId = (int) $pdo->lastInsertId();
            $existingProductsByIdentity[$identityKey] = $newProductId;
            $inserted++;
        }

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
echo "Productos actualizados:  $updated\n";
echo "Productos saltados:      $skipped\n";
echo "========================================\n\n";

if (!empty($errors)) {
    echo "AVISOS / ERRORES:\n";
    foreach ($errors as $err) {
        echo "  ⚠ $err\n";
    }
}

echo "\n✓ Importación completada.\n";
