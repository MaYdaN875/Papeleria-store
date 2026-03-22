<?php
/**
 * Endpoint publico: categories_public.php
 *
 * Funcion:
 * - Devuelve las categorias visibles para navbar (padres + subcategorias).
 * - Si no hay jerarquia parent_id, responde solo categorias raiz activas.
 */

require_once __DIR__ . '/../_admin_common.php';

adminHandleCors(['GET']);
adminRequireMethod('GET');

const PUBLIC_CANONICAL_CATEGORY_NAMES = [
  'Oficina y Escolares',
  'Arte y Manualidades',
  'Miselanea y Regalos',
  'Servicios Digitales e Impresiones',
];

function publicNormalizeCategoryName(string $value): string {
  return mb_strtolower(trim($value), 'UTF-8');
}

try {
  $pdo = adminGetPdo();

  if (!adminTableExists($pdo, 'categories')) {
    adminJsonResponse(200, ['ok' => true, 'categories' => []]);
  }

  $columns = adminGetTableColumns($pdo, 'categories');
  $hasParentId = in_array('parent_id', $columns, true);
  $hasIsActive = in_array('is_active', $columns, true);
  $hasDisplayOrder = in_array('display_order', $columns, true);

  $selectColumns = ['id', 'name'];
  $selectColumns[] = $hasParentId ? 'parent_id' : 'NULL AS parent_id';
  $selectColumns[] = $hasIsActive ? 'is_active' : '1 AS is_active';
  $selectColumns[] = $hasDisplayOrder ? 'display_order' : '0 AS display_order';

  $whereSql = $hasIsActive ? 'WHERE is_active = 1' : '';
  $orderSql = $hasDisplayOrder ? 'ORDER BY display_order ASC, name ASC' : 'ORDER BY name ASC';

  $stmt = $pdo->query("
    SELECT " . implode(', ', $selectColumns) . "
    FROM categories
    $whereSql
    $orderSql
  ");

  $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
  if (count($rows) === 0) {
    adminJsonResponse(200, ['ok' => true, 'categories' => []]);
  }

  $rowsById = [];
  foreach ($rows as $row) {
    $id = (int)($row['id'] ?? 0);
    if ($id <= 0) {
      continue;
    }
    $rowsById[$id] = [
      'id' => $id,
      'name' => (string)($row['name'] ?? ''),
      'parent_id' => $row['parent_id'] === null ? null : (int)$row['parent_id'],
      'display_order' => (int)($row['display_order'] ?? 0),
    ];
  }

  $canonicalIndex = [];
  foreach (PUBLIC_CANONICAL_CATEGORY_NAMES as $order => $canonicalName) {
    $canonicalIndex[publicNormalizeCategoryName($canonicalName)] = $order;
  }

  $result = [];
  foreach ($rowsById as $row) {
    if ($row['parent_id'] !== null) {
      continue;
    }

    $nameKey = publicNormalizeCategoryName($row['name']);
    if (!isset($canonicalIndex[$nameKey])) {
      continue;
    }

    $children = [];
    foreach ($rowsById as $candidate) {
      if ((int)$candidate['parent_id'] !== (int)$row['id']) {
        continue;
      }
      $children[] = [
        'id' => (int)$candidate['id'],
        'name' => (string)$candidate['name'],
      ];
    }

    usort($children, static function (array $left, array $right): int {
      return strcasecmp($left['name'], $right['name']);
    });

    $result[] = [
      'id' => (int)$row['id'],
      'name' => (string)$row['name'],
      'children' => $children,
      'canonical_order' => $canonicalIndex[$nameKey],
    ];
  }

  usort($result, static function (array $left, array $right): int {
    return ((int)$left['canonical_order']) <=> ((int)$right['canonical_order']);
  });

  $responseCategories = array_map(static function (array $row): array {
    return [
      'id' => (int)$row['id'],
      'name' => (string)$row['name'],
      'children' => $row['children'],
    ];
  }, $result);

  adminJsonResponse(200, [
    'ok' => true,
    'categories' => $responseCategories,
  ]);
} catch (PDOException $e) {
  error_log('categories_public.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, [
    'ok' => false,
    'message' => 'Error interno del servidor',
  ]);
}
