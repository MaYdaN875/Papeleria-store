<?php
/**
 * Endpoint: admin/brands/update.php
 * Reemplaza globalmente un text `oldName` de marca por un `newName` en la tabla de productos.
 */
require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['POST', 'OPTIONS']);
adminRequireMethod('POST');

try {
    $pdo = adminGetPdo();
    adminRequireSession($pdo);

// Obtener carga JSON
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!isset($data['oldName']) || !isset($data['newName'])) {
    adminJsonResponse(400, ['ok' => false, 'message' => 'Faltan campos requeridos (oldName, newName)']);
}

$oldName = trim($data['oldName']);
$newName = trim($data['newName']);

if ($oldName === '' || $newName === '') {
    adminJsonResponse(400, ['ok' => false, 'message' => 'Los nombres de marca no pueden estar vacíos']);
}

    // Checar existencia de la columna brand
    $columns = adminGetTableColumns($pdo, 'products');
    if (!in_array('brand', $columns, true)) {
        adminJsonResponse(400, ['ok' => false, 'message' => 'El campo brand no existe en la tabla products.']);
    }

    $stmtBrands = $pdo->prepare('UPDATE brands SET name = ? WHERE name = ?');
    try {
        $stmtBrands->execute([$newName, $oldName]);
    } catch (PDOException $e) {
        // En caso de que el nuevo nombre ya exista en la tabla, se ignorará
    }

    $stmt = $pdo->prepare('UPDATE products SET brand = ? WHERE brand = ?');
    $stmt->execute([$newName, $oldName]);

    $affected = $stmt->rowCount();

    adminJsonResponse(200, [
        'ok' => true,
        'message' => "Marca actualizada de '$oldName' a '$newName' ($affected productos afectados).",
        'affectedRows' => $affected
    ]);

} catch (PDOException $e) {
    adminJsonResponse(500, ['ok' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
