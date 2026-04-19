<?php
/**
 * Endpoint: admin/orders/update-status.php
 *
 * Función:
 * - Actualiza manualmente el estado de una orden.
 * - Estados posibles: 'pending', 'paid', 'shipped', 'delivered', 'cancelled'.
 */

require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['POST']);
adminRequireMethod('POST');

try {
  $pdo = adminGetPdo();
  adminRequireSession($pdo);

  $bodyArr = adminJsonBody();
  $orderId = isset($bodyArr['orderId']) ? (int) $bodyArr['orderId'] : 0;
  $newStatus = isset($bodyArr['status']) ? trim((string) $bodyArr['status']) : '';

  if ($orderId <= 0) {
    adminJsonResponse(400, ['ok' => false, 'message' => 'Falta o es inválido el orderId.']);
  }

  $allowedStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
  if (!in_array($newStatus, $allowedStatuses, true)) {
    adminJsonResponse(400, ['ok' => false, 'message' => 'Estado inválido.']);
  }

  // Comprobar que la tabla y registro existan
  if (!adminTableExists($pdo, 'orders')) {
    adminJsonResponse(500, ['ok' => false, 'message' => 'Tabla orders no encontrada.']);
  }

  $stmt = $pdo->prepare('UPDATE orders SET status = :status, updated_at = NOW() WHERE id = :id');
  $stmt->execute([
    'status' => $newStatus,
    'id' => $orderId
  ]);

  if ($stmt->rowCount() === 0) {
    // Si rowCount es 0, puede ser que el ID no exista o que el estado sea el mismo
    $check = $pdo->prepare('SELECT id FROM orders WHERE id = :id');
    $check->execute(['id' => $orderId]);
    if (!$check->fetch()) {
      adminJsonResponse(404, ['ok' => false, 'message' => 'Orden no encontrada.']);
    }
  }

  adminJsonResponse(200, [
    'ok' => true,
    'message' => 'Estado actualizado correctamente.'
  ]);

} catch (PDOException $e) {
  error_log('Error en admin/orders/update-status.php (DB): ' . $e->getMessage());
  adminJsonResponse(500, [
    'ok' => false, 
    'message' => 'Error en la base de datos al actualizar la orden.'
  ]);
} catch (Exception $e) {
  error_log('Error en admin/orders/update-status.php: ' . $e->getMessage());
  adminJsonResponse(500, [
    'ok' => false, 
    'message' => 'Ocurrió un error inesperado al actualizar la orden.'
  ]);
}
