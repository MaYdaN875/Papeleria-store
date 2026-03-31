<?php
/**
 * Endpoint: admin/categories/update.php
 * Actualiza el nombre de una categoría o subcategoría dado su ID.
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

if (!isset($data['id']) || !isset($data['name'])) {
    adminJsonResponse(400, ['ok' => false, 'message' => 'Faltan campos requeridos (id, name)']);
}

$id = (int)$data['id'];
$name = trim($data['name']);

if ($name === '') {
    adminJsonResponse(400, ['ok' => false, 'message' => 'El nombre no puede estar vacío']);
}

    // Generación de slug
    $value = mb_strtolower($name, 'UTF-8');
    if (function_exists('iconv')) {
        $converted = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
        if ($converted !== false) $value = $converted;
    }
    $slug = trim(preg_replace('/[^a-z0-9]+/', '-', $value), '-');
    if ($slug === '') $slug = 'categoria';

    // Checar existencia de la columna slug 
    $columns = adminGetTableColumns($pdo, 'categories');
    $hasSlug = in_array('slug', $columns, true);

    if ($hasSlug) {
        $stmt = $pdo->prepare('UPDATE categories SET name = ?, slug = ? WHERE id = ?');
        $stmt->execute([$name, $slug, $id]);
    } else {
        $stmt = $pdo->prepare('UPDATE categories SET name = ? WHERE id = ?');
        $stmt->execute([$name, $id]);
    }

    if ($stmt->rowCount() === 0) {
        // Verificar existencia de la categoría
        $stmtCheck = $pdo->prepare('SELECT id FROM categories WHERE id = ?');
        $stmtCheck->execute([$id]);
        if (!$stmtCheck->fetchColumn()) {
            adminJsonResponse(404, ['ok' => false, 'message' => 'La categoría no existe.']);
        }
    }

    adminJsonResponse(200, [
        'ok' => true,
        'message' => 'Nombre de la categoría actualizado correctamente'
    ]);

} catch (PDOException $e) {
    adminJsonResponse(500, ['ok' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
