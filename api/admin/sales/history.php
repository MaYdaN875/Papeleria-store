<?php
/**
 * Endpoint: admin/sales/history.php
 *
 * Función:
 * - Lista todos los cortes de caja realizados, con detalle de productos.
 * - Parámetros opcionales: ?days=90 (últimos N días, default 90)
 */

require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['GET']);
adminRequireMethod('GET');

try {
  $pdo = adminGetPdo();
  adminRequireSession($pdo);

  // Si la tabla no existe, devolver lista vacía.
  if (!adminTableExists($pdo, 'daily_sales_closings')) {
    adminJsonResponse(200, [
      'ok' => true,
      'closings' => [],
      'message' => 'Aún no se han realizado cortes de caja.',
    ]);
  }

  $days = isset($_GET['days']) ? max(1, (int)$_GET['days']) : 90;
  $minDate = date('Y-m-d', strtotime("-{$days} days"));

  $sql = "
    SELECT
      id,
      closing_date,
      period_start,
      period_end,
      total_revenue,
      total_units,
      total_orders,
      products_detail,
      notes,
      closed_at,
      closed_by
    FROM daily_sales_closings
    WHERE closing_date >= :min_date
    ORDER BY closed_at DESC
  ";

  $stmt = $pdo->prepare($sql);
  $stmt->execute(['min_date' => $minDate]);
  $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

  $closings = [];
  foreach ($rows as $row) {
    $productsDetail = [];
    if (!empty($row['products_detail'])) {
      $decoded = json_decode($row['products_detail'], true);
      if (is_array($decoded)) {
        $productsDetail = $decoded;
      }
    }

    $closings[] = [
      'id' => (int)$row['id'],
      'closing_date' => $row['closing_date'],
      'period_start' => $row['period_start'],
      'period_end' => $row['period_end'],
      'total_revenue' => (float)$row['total_revenue'],
      'total_units' => (int)$row['total_units'],
      'total_orders' => (int)$row['total_orders'],
      'products_detail' => $productsDetail,
      'notes' => $row['notes'],
      'closed_at' => $row['closed_at'],
    ];
  }

  adminJsonResponse(200, [
    'ok' => true,
    'closings' => $closings,
  ]);
} catch (PDOException $e) {
  error_log('admin/sales/history.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor al cargar historial.']);
}
