<?php
/**
 * Endpoint: admin_sales_today.php
 *
 * Función:
 * - Resume ingresos actuales (desde el último corte de caja) para panel admin.
 * - Si no hay corte previo hoy, muestra todas las ventas del día.
 * - Incluye detalle individual de cada orden con hora.
 */

require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['GET']);
adminRequireMethod('GET');

/**
 * Determina expresión SQL para total por renglón según columnas disponibles.
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

try {
  $pdo = adminGetPdo();
  adminRequireSession($pdo);

  if (!adminTableExists($pdo, 'orders') || !adminTableExists($pdo, 'order_items')) {
    adminJsonResponse(200, [
      'ok' => true,
      'message' => 'El módulo de ingresos está listo, pero aún no hay tablas de ventas configuradas.',
      'summary' => [
        'total_revenue' => 0,
        'total_units' => 0,
        'total_orders' => 0,
      ],
      'products' => [],
      'order_details' => [],
      'period_start' => null,
      'last_closing_id' => null,
    ]);
  }

  $ordersColumns = adminGetTableColumns($pdo, 'orders');
  $orderItemsColumns = adminGetTableColumns($pdo, 'order_items');

  $requiredOrderColumns = ['id', 'created_at'];
  $requiredOrderItemColumns = ['order_id', 'product_id', 'quantity'];

  foreach ($requiredOrderColumns as $column) {
    if (!in_array($column, $ordersColumns, true)) {
      adminJsonResponse(200, [
        'ok' => true,
        'message' => 'Faltan columnas en orders para calcular ingresos del día.',
        'summary' => [
          'total_revenue' => 0,
          'total_units' => 0,
          'total_orders' => 0,
        ],
        'products' => [],
        'order_details' => [],
        'period_start' => null,
        'last_closing_id' => null,
      ]);
    }
  }

  foreach ($requiredOrderItemColumns as $column) {
    if (!in_array($column, $orderItemsColumns, true)) {
      adminJsonResponse(200, [
        'ok' => true,
        'message' => 'Faltan columnas en order_items para calcular ingresos del día.',
        'summary' => [
          'total_revenue' => 0,
          'total_units' => 0,
          'total_orders' => 0,
        ],
        'products' => [],
        'order_details' => [],
        'period_start' => null,
        'last_closing_id' => null,
      ]);
    }
  }

  // Determinar el inicio del periodo: desde el último corte o desde el principio de los tiempos.
  $dbPeriodStart = '2000-01-01 00:00:00';
  $uiPeriodStart = null;
  $lastClosingId = null;

  if (adminTableExists($pdo, 'daily_sales_closings')) {
    $stmtLast = $pdo->query("SELECT id, period_end FROM daily_sales_closings ORDER BY period_end DESC LIMIT 1");
    $lastClosing = $stmtLast->fetch(PDO::FETCH_ASSOC);
    if ($lastClosing) {
      $dbPeriodStart = $lastClosing['period_end'];
      $uiPeriodStart = $lastClosing['period_end'];
      $lastClosingId = (int)$lastClosing['id'];
    }
  }

  $lineTotalExpr = adminResolveLineTotalExpr($orderItemsColumns);

  // Resumen general desde el último corte.
  $summarySql = "
    SELECT
      COALESCE(SUM($lineTotalExpr), 0) AS total_revenue,
      COALESCE(SUM(oi.quantity), 0) AS total_units,
      COUNT(DISTINCT oi.order_id) AS total_orders
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    WHERE o.created_at > :period_start
      AND o.status = 'paid'
  ";

  $summaryStmt = $pdo->prepare($summarySql);
  $summaryStmt->execute(['period_start' => $dbPeriodStart]);
  $summary = $summaryStmt->fetch(PDO::FETCH_ASSOC) ?: [
    'total_revenue' => 0,
    'total_units' => 0,
    'total_orders' => 0,
  ];

  // Resumen por producto.
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
      AND o.status = 'paid'
    GROUP BY oi.product_id, product_name
    ORDER BY total_revenue DESC
  ";

  $productsStmt = $pdo->prepare($productsSql);
  $productsStmt->execute(['period_start' => $dbPeriodStart]);
  $products = $productsStmt->fetchAll(PDO::FETCH_ASSOC);

  foreach ($products as &$row) {
    $row['product_id'] = (int)$row['product_id'];
    $row['total_units'] = (int)$row['total_units'];
    $row['total_revenue'] = (float)$row['total_revenue'];
    $row['total_orders'] = (int)$row['total_orders'];
  }
  unset($row);

  // Detalle individual de cada orden con hora (para la tabla detallada).
  $orderDetailsSql = "
    SELECT
      o.id AS order_id,
      o.created_at AS order_time,
      oi.product_id,
      COALESCE(p.name, CONCAT('Producto #', oi.product_id)) AS product_name,
      oi.quantity,
      COALESCE(oi.price, 0) AS unit_price,
      COALESCE($lineTotalExpr, 0) AS line_total
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    LEFT JOIN products p ON p.id = oi.product_id
    WHERE o.created_at > :period_start
      AND o.status = 'paid'
    ORDER BY o.created_at DESC, oi.id ASC
  ";

  $orderDetailsStmt = $pdo->prepare($orderDetailsSql);
  $orderDetailsStmt->execute(['period_start' => $dbPeriodStart]);
  $orderDetails = $orderDetailsStmt->fetchAll(PDO::FETCH_ASSOC);

  foreach ($orderDetails as &$detail) {
    $detail['order_id'] = (int)$detail['order_id'];
    $detail['product_id'] = (int)$detail['product_id'];
    $detail['quantity'] = (int)$detail['quantity'];
    $detail['unit_price'] = (float)$detail['unit_price'];
    $detail['line_total'] = (float)$detail['line_total'];
  }
  unset($detail);

  adminJsonResponse(200, [
    'ok' => true,
    'summary' => [
      'total_revenue' => (float)$summary['total_revenue'],
      'total_units' => (int)$summary['total_units'],
      'total_orders' => (int)$summary['total_orders'],
    ],
    'products' => $products,
    'order_details' => $orderDetails,
    'period_start' => $uiPeriodStart,
    'last_closing_id' => $lastClosingId,
  ]);
} catch (PDOException $e) {
  error_log('admin_sales_today.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}
