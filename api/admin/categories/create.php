<?php
/**
 * Endpoint: admin/categories/create.php
 * Permite agregar una nueva categoría o subcategoría al sistema desde el dashboard.
 */
require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['POST', 'OPTIONS']);
adminRequireMethod('POST');

try {
    $pdo = adminGetPdo();
    adminRequireSession($pdo);

    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!isset($data['name'])) {
        adminJsonResponse(400, ['ok' => false, 'message' => 'Falta campo name']);
    }

    $name = trim($data['name']);
    $parentId = isset($data['parent_id']) ? (int)$data['parent_id'] : null;
    
    // Si parent_id es <= 0, es NULL
    if ($parentId !== null && $parentId <= 0) {
        $parentId = null;
    }

    if ($name === '') {
        adminJsonResponse(400, ['ok' => false, 'message' => 'El nombre no puede estar vacío']);
    }

    $columns = adminGetTableColumns($pdo, 'categories');
    $hasSlug = in_array('slug', $columns, true);
    $hasParent = in_array('parent_id', $columns, true);
    $hasActive = in_array('is_active', $columns, true);

    // Slug builder
    $value = mb_strtolower($name, 'UTF-8');
    if (function_exists('iconv')) {
        $converted = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
        if ($converted !== false) $value = $converted;
    }
    $slug = trim(preg_replace('/[^a-z0-9]+/', '-', $value), '-');
    if ($slug === '') $slug = 'categoria';

    // Insert logic
    $insertFields = ['name'];
    $insertPlaceholders = ['?'];
    $insertParams = [$name];

    if ($hasSlug) {
        $insertFields[] = 'slug';
        $insertPlaceholders[] = '?';
        $insertParams[] = $slug;
    }
    if ($hasParent) {
        $insertFields[] = 'parent_id';
        $insertPlaceholders[] = '?';
        $insertParams[] = $parentId;
    }
    if ($hasActive) {
        $insertFields[] = 'is_active';
        $insertPlaceholders[] = '?';
        $insertParams[] = 1;
    }

    $sql = 'INSERT INTO categories (' . implode(', ', $insertFields) . ') VALUES (' . implode(', ', $insertPlaceholders) . ')';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($insertParams);

    $id = (int)$pdo->lastInsertId();

    adminJsonResponse(200, [
        'ok' => true,
        'message' => 'Categoría creada con éxito.',
        'categoryId' => $id,
        'name' => $name,
        'parent_id' => $parentId
    ]);

} catch (PDOException $e) {
    adminJsonResponse(500, ['ok' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
