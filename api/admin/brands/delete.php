<?php
/**
 * Endpoint: admin/brands/delete.php
 * Borra una marca de la tabla de marcas y remueve el valor de todos los productos.
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
        adminJsonResponse(400, ['ok' => false, 'message' => 'Falta el nombre de la marca a eliminar']);
    }

    $name = trim($data['name']);

    if ($name === '') {
        adminJsonResponse(400, ['ok' => false, 'message' => 'El nombre de marca inválido.']);
    }

    // Remover la marca de los productos (Setear a NULL)
    $stmtProducts = $pdo->prepare("UPDATE products SET brand = NULL WHERE brand = ?");
    $stmtProducts->execute([$name]);

    // Eliminar del diccionario de marcas (si existe)
    $stmtBrands = $pdo->prepare("DELETE FROM brands WHERE name = ?");
    $stmtBrands->execute([$name]);

    adminJsonResponse(200, ['ok' => true, 'message' => 'Marca eliminada de todo el sistema de forma exitosa.']);
} catch (PDOException $e) {
    adminJsonResponse(500, ['ok' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
