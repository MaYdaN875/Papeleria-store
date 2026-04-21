<?php
/**
 * Endpoint: admin/sales/daily_close.php
 *
 * Función:
 * - Ejecuta un corte de caja: guarda un snapshot de las ventas desde el último corte.
 * - Permite múltiples cortes al día (ej. uno a medio día y otro al cerrar).
 * - Guarda detalle de productos vendidos en JSON para consulta futura.
 */

require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['POST', 'OPTIONS']);
adminRequireMethod('POST');

try {
  $pdo = adminGetPdo();
  $adminSession = adminRequireSession($pdo);
  $adminUserId = isset($adminSession['admin_user_id']) ? (int)$adminSession['admin_user_id'] : null;

  // Verificar que existan las tablas necesarias.
  if (!adminTableExists($pdo, 'orders') || !adminTableExists($pdo, 'order_items')) {
    adminJsonResponse(400, [
      'ok' => false,
      'message' => 'No hay tablas de ventas configuradas. Ejecuta la migración de órdenes primero.',
    ]);
  }

  // Crear tabla de cortes si no existe (auto-migración).
  $pdo->exec("
    CREATE TABLE IF NOT EXISTS daily_sales_closings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      closing_date DATE NOT NULL,
      period_start DATETIME NOT NULL,
      period_end DATETIME NOT NULL,
      total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
      total_units INT NOT NULL DEFAULT 0,
      total_orders INT NOT NULL DEFAULT 0,
      products_detail JSON NULL,
      notes VARCHAR(255) NULL,
      closed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      closed_by INT NULL,
      INDEX idx_closing_date (closing_date DESC),
      INDEX idx_period (period_start, period_end)
    )
  ");

  // Determinar inicio del periodo: desde el último corte o desde la primera orden.
  $lastClosing = null;
  if (adminTableExists($pdo, 'daily_sales_closings')) {
    $stmtLast = $pdo->query("SELECT period_end FROM daily_sales_closings ORDER BY period_end DESC LIMIT 1");
    $lastClosing = $stmtLast->fetch(PDO::FETCH_ASSOC);
  }

  if ($lastClosing) {
    $periodStart = $lastClosing['period_end'];
  } else {
    // Si es el primer corte, tomar desde el principio de los tiempos para que ">" capture todo.
    $periodStart = '2000-01-01 00:00:00';
  }

  $periodEnd = date('Y-m-d H:i:s');

  // Resolver expresión del total por línea.
  $orderItemsColumns = adminGetTableColumns($pdo, 'order_items');
  $lineTotalExpr = adminResolveLineTotalExpr($orderItemsColumns);

  // Obtener resumen de ventas en el periodo.
  $summarySql = "
    SELECT
      COALESCE(SUM($lineTotalExpr), 0) AS total_revenue,
      COALESCE(SUM(oi.quantity), 0) AS total_units,
      COUNT(DISTINCT oi.order_id) AS total_orders
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    WHERE o.created_at > :period_start
      AND o.created_at <= :period_end
      AND o.status = 'paid'
  ";

  $summaryStmt = $pdo->prepare($summarySql);
  $summaryStmt->execute([
    'period_start' => $periodStart,
    'period_end' => $periodEnd,
  ]);
  $summary = $summaryStmt->fetch(PDO::FETCH_ASSOC);

  $totalRevenue = (float)($summary['total_revenue'] ?? 0);
  $totalUnits = (int)($summary['total_units'] ?? 0);
  $totalOrders = (int)($summary['total_orders'] ?? 0);

  // Obtener detalle de productos vendidos en el periodo.
  $productsSql = "
    SELECT
      oi.product_id,
      COALESCE(p.name, CONCAT('Producto #', oi.product_id)) AS product_name,
      COALESCE(SUM(oi.quantity), 0) AS total_units,
      COALESCE(SUM($lineTotalExpr), 0) AS total_revenue,
      COUNT(DISTINCT oi.order_id) AS total_orders
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    LEFT JOIN products p ON p.id = oi.product_id
    WHERE o.created_at > :period_start
      AND o.created_at <= :period_end
      AND o.status = 'paid'
    GROUP BY oi.product_id, product_name
    ORDER BY total_revenue DESC
  ";

  $productsStmt = $pdo->prepare($productsSql);
  $productsStmt->execute([
    'period_start' => $periodStart,
    'period_end' => $periodEnd,
  ]);
  $productsDetail = $productsStmt->fetchAll(PDO::FETCH_ASSOC);

  // Normalizar tipos para JSON.
  foreach ($productsDetail as &$row) {
    $row['product_id'] = (int)$row['product_id'];
    $row['total_units'] = (int)$row['total_units'];
    $row['total_revenue'] = (float)$row['total_revenue'];
    $row['total_orders'] = (int)$row['total_orders'];
  }
  unset($row);

  // Leer notas opcionales del body.
  $body = adminReadJsonBody();
  $notes = isset($body['notes']) ? mb_substr(trim($body['notes']), 0, 255) : null;

  // Insertar el corte de caja.
  $insertSql = "
    INSERT INTO daily_sales_closings
      (closing_date, period_start, period_end, total_revenue, total_units, total_orders, products_detail, notes, closed_by)
    VALUES
      (:closing_date, :period_start, :period_end, :total_revenue, :total_units, :total_orders, :products_detail, :notes, :closed_by)
  ";

  $insertStmt = $pdo->prepare($insertSql);
  $insertStmt->execute([
    'closing_date' => date('Y-m-d'),
    'period_start' => $periodStart,
    'period_end' => $periodEnd,
    'total_revenue' => $totalRevenue,
    'total_units' => $totalUnits,
    'total_orders' => $totalOrders,
    'products_detail' => json_encode($productsDetail, JSON_UNESCAPED_UNICODE),
    'notes' => $notes,
    'closed_by' => $adminUserId,
  ]);

  $closingId = (int)$pdo->lastInsertId();

  adminJsonResponse(200, [
    'ok' => true,
    'message' => 'Corte de caja realizado exitosamente.',
    'closing' => [
      'id' => $closingId,
      'closing_date' => date('Y-m-d'),
      'period_start' => $periodStart,
      'period_end' => $periodEnd,
      'total_revenue' => $totalRevenue,
      'total_units' => $totalUnits,
      'total_orders' => $totalOrders,
      'products_detail' => $productsDetail,
      'notes' => $notes,
      'closed_at' => $periodEnd,
    ],
  ]);
} catch (PDOException $e) {
  error_log('admin/sales/daily_close.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor al realizar el corte.']);
}

/**
 * Determina expresión SQL para total por renglón según columnas disponibles.
 * (Duplicada de today.php para independencia — se podría refactorizar a un helper compartido.)
 */
function adminResolveLineTotalExpr(array $orderItemsColumns): string {
  if (in_array('total_price', $orderItemsColumns, true)) {
    return 'oi.total_price';
  }
  if (in_array('subtotal', $orderItemsColumns, true)) {
    return 'oi.subtotal';
  }
  if (in_array('unit_price', $orderItemsColumns, true) && in_array('quantity', $orderItemsColumns, true)) {
    return '(oi.unit_price * oi.quantity)';
  }
  if (in_array('price', $orderItemsColumns, true) && in_array('quantity', $orderItemsColumns, true)) {
    return '(oi.price * oi.quantity)';
  }

  return '0';
}
