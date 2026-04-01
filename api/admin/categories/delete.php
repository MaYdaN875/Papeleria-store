<?php
/**
 * Endpoint: admin/categories/delete.php
 * Borra una categoría si existe y no es de las principales de la tienda (oficina, arte, etc.)
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

    // Proteger las categorías principales para no romper el front page si el usuario intenta borrarlas
    $canonicalQuoted = array_map(static fn($n) => $pdo->quote($n), ADMIN_CANONICAL_CATEGORY_NAMES);
    $canonicalList = implode(',', $canonicalQuoted);

    $checkStmt = $pdo->prepare("SELECT id, name, parent_id FROM categories WHERE id = ?");
    $checkStmt->execute([$id]);
    $cat = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$cat) {
        adminJsonResponse(404, ['ok' => false, 'message' => 'La categoría no existe.']);
    }

    if (in_array($cat['name'], ADMIN_CANONICAL_CATEGORY_NAMES, true) && $cat['parent_id'] === null) {
        adminJsonResponse(403, ['ok' => false, 'message' => 'No puedes eliminar una de las categorías principales (Oficina, Arte, Miscelánea, Servicios).']);
    }

    // Actualizar productos ligados para no romper base de datos (desvincular la categoría)
    $updateProds = $pdo->prepare("UPDATE products SET category_id = NULL WHERE category_id = ?");
    $updateProds->execute([$id]);

    // Opcionalmente: si esta es padre de algunas, pasarlas al nivel raíz
    $updateChildren = $pdo->prepare("UPDATE categories SET parent_id = NULL WHERE parent_id = ?");
    $updateChildren->execute([$id]);

    $delStmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
    $delStmt->execute([$id]);

    adminJsonResponse(200, ['ok' => true, 'message' => 'Eliminada correctamente.']);
} catch (PDOException $e) {
    adminJsonResponse(500, ['ok' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
