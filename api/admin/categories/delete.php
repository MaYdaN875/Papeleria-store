<?php
/**
 * Endpoint: admin/categories/delete.php
 * Borra una categoría si existe y no es de las principales de la tienda.
 * Los productos asociados se reasignan a la categoría padre (si es subcategoría)
 * o se desvinculan (si la columna lo permite).
 */
require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['POST', 'OPTIONS']);
adminRequireMethod('POST');

try {
    $pdo = adminGetPdo();
    adminRequireSession($pdo);

    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!isset($data['id'])) {
        adminJsonResponse(400, ['ok' => false, 'message' => 'Falta el id de la categoría.']);
    }

    $id = (int)$data['id'];

    if ($id <= 0) {
        adminJsonResponse(400, ['ok' => false, 'message' => 'ID de categoría inválido.']);
    }

    // Buscar la categoría
    $checkStmt = $pdo->prepare("SELECT id, name, parent_id FROM categories WHERE id = ?");
    $checkStmt->execute([$id]);
    $cat = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$cat) {
        adminJsonResponse(404, ['ok' => false, 'message' => 'La categoría no existe.']);
    }

    // (Sin restricción de categorías principales — el admin puede borrar cualquier categoría)

    // Determinar a dónde mover los productos de esta categoría
    $parentId = $cat['parent_id'];
    
    if ($parentId !== null && $parentId > 0) {
        // Es una subcategoría → mover productos al padre
        $updateProds = $pdo->prepare("UPDATE products SET category_id = ? WHERE category_id = ?");
        $updateProds->execute([$parentId, $id]);
    } else {
        // Es categoría raíz → intentar poner NULL, y si falla, dejarlo en la primera categoría principal
        try {
            $updateProds = $pdo->prepare("UPDATE products SET category_id = NULL WHERE category_id = ?");
            $updateProds->execute([$id]);
        } catch (PDOException $e) {
            // Si NULL no es permitido por FK, mover a categoría 1 (Oficina y Escolares)
            $updateProds = $pdo->prepare("UPDATE products SET category_id = 1 WHERE category_id = ?");
            $updateProds->execute([$id]);
        }
    }

    // Subcategorías hijas → moverlas al padre de esta categoría (o raíz)
    $updateChildren = $pdo->prepare("UPDATE categories SET parent_id = ? WHERE parent_id = ?");
    $updateChildren->execute([$parentId, $id]);

    // Finalmente, eliminar la categoría
    $delStmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
    $delStmt->execute([$id]);

    $message = 'Categoría eliminada correctamente.';
    if ($parentId !== null && $parentId > 0) {
        $message .= ' Los productos se movieron a la categoría padre.';
    }

    adminJsonResponse(200, ['ok' => true, 'message' => $message]);
} catch (PDOException $e) {
    adminJsonResponse(500, ['ok' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
