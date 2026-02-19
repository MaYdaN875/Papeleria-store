<?php
/**
 * Endpoint: admin_sales_today.php
 *
 * Función:
 * - Resume ingresos del día para panel admin.
 * - Si la BD no tiene tablas/columnas de ventas, responde vacío con mensaje.
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
      ]);
    }
  }

  $lineTotalExpr = adminResolveLineTotalExpr($orderItemsColumns);

  $summarySql = "
    SELECT
      COALESCE(SUM($lineTotalExpr), 0) AS total_revenue,
      COALESCE(SUM(oi.quantity), 0) AS total_units,
      COUNT(DISTINCT oi.order_id) AS total_orders
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    WHERE DATE(o.created_at) = CURDATE()
  ";

  $summaryStmt = $pdo->query($summarySql);
  $summary = $summaryStmt->fetch(PDO::FETCH_ASSOC) ?: [
    'total_revenue' => 0,
    'total_units' => 0,
    'total_orders' => 0,
  ];

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
    WHERE DATE(o.created_at) = CURDATE()
    GROUP BY oi.product_id, product_name
    ORDER BY total_revenue DESC
  ";

  $productsStmt = $pdo->query($productsSql);
  $products = $productsStmt->fetchAll(PDO::FETCH_ASSOC);

  foreach ($products as &$row) {
    $row['product_id'] = (int)$row['product_id'];
    $row['total_units'] = (int)$row['total_units'];
    $row['total_revenue'] = (float)$row['total_revenue'];
    $row['total_orders'] = (int)$row['total_orders'];
  }

  adminJsonResponse(200, [
    'ok' => true,
    'summary' => [
      'total_revenue' => (float)$summary['total_revenue'],
      'total_units' => (int)$summary['total_units'],
      'total_orders' => (int)$summary['total_orders'],
    ],
    'products' => $products,
  ]);
} catch (PDOException $e) {
  error_log('admin_sales_today.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}
