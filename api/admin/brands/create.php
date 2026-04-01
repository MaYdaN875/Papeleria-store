<?php
/**
 * Endpoint: admin/brands/create.php
 * Agrega una nueva marca vacía a la base de datos de referencias.
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
        adminJsonResponse(400, ['ok' => false, 'message' => 'Falta el nombre de la marca']);
    }

    $name = trim($data['name']);
    if ($name === '') {
        adminJsonResponse(400, ['ok' => false, 'message' => 'El nombre no puede estar vacío']);
    }

    $stmt = $pdo->prepare('INSERT INTO brands (name) VALUES (?)');
    try {
        $stmt->execute([$name]);
    } catch (PDOException $e) {
        adminJsonResponse(400, ['ok' => false, 'message' => 'La marca ya existe o hubo un problema al guardarla.']);
    }

    adminJsonResponse(200, [
        'ok' => true,
        'message' => 'Marca registrada exitosamente.'
    ]);

} catch (PDOException $e) {
    adminJsonResponse(500, ['ok' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
