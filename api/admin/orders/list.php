<?php
/**
 * Endpoint: admin/orders/list.php
 *
 * Función:
 * - Obtiene la lista completa de órdenes de compras con los datos del cliente.
 * - Cruza o anida el detalle de cada artículo (items).
 */

require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['GET']);
adminRequireMethod('GET');

try {
  $pdo = adminGetPdo();
  adminRequireSession($pdo);

  // Verificamos existencia de tablas críticas
  if (!adminTableExists($pdo, 'orders') || !adminTableExists($pdo, 'order_items')) {
    adminJsonResponse(200, [
      'ok' => true,
      'orders' => []
    ]);
  }

  // 1. Obtener órdenes con datos del cliente mediante LEFT JOIN
  // Usamos COALESCE para manejar el caso de que el cliente haya sido borrado
  $sql = "
    SELECT 
      o.id,
      o.customer_user_id,
      COALESCE(cu.name, 'Usuario No Registrado/Invitado') AS customer_name,
      COALESCE(cu.email, 'Sin correo') AS customer_email,
      o.total,
      o.currency,
      o.status,
      o.delivery_method,
      o.delivery_address,
      o.created_at
    FROM orders o
    LEFT JOIN customer_users cu ON cu.id = o.customer_user_id
    ORDER BY o.created_at DESC
    LIMIT 300
  ";
  $stmt = $pdo->query($sql);
  $ordersRaw = $stmt->fetchAll(PDO::FETCH_ASSOC);

  if (empty($ordersRaw)) {
    adminJsonResponse(200, [
      'ok' => true, 
      'orders' => []
    ]);
  }

  // Obtenemos los IDs de las órdenes para pedir sus items de una vez
  $orderIds = array_column($ordersRaw, 'id');
  $inClause = implode(',', array_fill(0, count($orderIds), '?'));

  // 2. Obtener items de todas las órdenes en el reporte
  // Cruzamos con products para tener el nombre actual, por si cambió o se borró
  $sqlItems = "
    SELECT 
      oi.id,
      oi.order_id,
      oi.product_id,
      COALESCE(p.name, CONCAT('Producto ID: ', oi.product_id, ' (No disponible)')) AS product_name,
      oi.quantity,
      oi.price
    FROM order_items oi
    LEFT JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id IN ($inClause)
    ORDER BY oi.id ASC
  ";
  $stmtItems = $pdo->prepare($sqlItems);
  $stmtItems->execute($orderIds);
  $itemsRaw = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

  // Agrupamos items por order_id
  $itemsByOrder = [];
  foreach ($itemsRaw as $item) {
    $oid = (int)$item['order_id'];
    if (!isset($itemsByOrder[$oid])) {
      $itemsByOrder[$oid] = [];
    }
    $itemsByOrder[$oid][] = [
      'id' => (int)$item['id'],
      'productId' => (int)$item['product_id'],
      'productName' => $item['product_name'],
      'quantity' => (int)$item['quantity'],
      'price' => (float)$item['price'],
    ];
  }

  // 3. Montar el array final de respuesta
  $orders = [];
  foreach ($ordersRaw as $row) {
    $oid = (int)$row['id'];
    $orders[] = [
      'id' => $oid,
      'customerUserId' => $row['customer_user_id'] ? (int)$row['customer_user_id'] : null,
      'customerName' => $row['customer_name'],
      'customerEmail' => $row['customer_email'],
      'total' => (float)$row['total'],
      'currency' => $row['currency'],
      'status' => $row['status'], // 'paid', 'pending', 'cancelled'
      'deliveryMethod' => isset($row['delivery_method']) ? $row['delivery_method'] : null,
      'deliveryAddress' => isset($row['delivery_address']) ? $row['delivery_address'] : null,
      'createdAt' => $row['created_at'],
      'items' => isset($itemsByOrder[$oid]) ? $itemsByOrder[$oid] : [],
    ];
  }

  // Respuesta exitosa
  adminJsonResponse(200, [
    'ok' => true,
    'orders' => $orders
  ]);

} catch (PDOException $e) {
  // Error de base de datos
  error_log('Error en admin/orders/list.php (DB): ' . $e->getMessage());
  adminJsonResponse(500, [
    'ok' => false, 
    'message' => 'Error en la base de datos al obtener las órdenes.'
  ]);
} catch (Exception $e) {
  // Error general
  error_log('Error en admin/orders/list.php: ' . $e->getMessage());
  adminJsonResponse(500, [
    'ok' => false, 
    'message' => 'Ocurrió un error inesperado.'
  ]);
}
