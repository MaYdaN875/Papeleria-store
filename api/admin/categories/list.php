<?php
/**
 * Endpoint: admin_categories_list.php
 *
 * Función:
 * - Devuelve categorías para formularios del panel admin.
 * - Requiere sesión admin válida.
 */

require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['GET']);
adminRequireMethod('GET');

const ADMIN_CANONICAL_CATEGORY_NAMES = [
  'Oficina y Escolares',
  'Arte y Manualidades',
  'Mitril y Regalos',
  'Servicios Digitales e Impresiones',
];

/**
 * Convierte nombre de categoría a slug URL-friendly.
 */
function adminCategorySlug(string $text): string {
  $value = mb_strtolower(trim($text), 'UTF-8');
  if (function_exists('iconv')) {
    $converted = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
    if ($converted !== false) {
      $value = $converted;
    }
  }

  $value = preg_replace('/[^a-z0-9]+/', '-', $value);
  $value = trim((string)$value, '-');
  return $value !== '' ? $value : 'categoria';
}

/**
 * Sincroniza categorías visibles del admin con el catálogo oficial.
 * - Activa y ordena las 4 categorías canónicas.
 * - Desactiva categorías antiguas para no mostrarlas en formularios.
 */
function adminSyncCanonicalCategories(PDO $pdo): void {
  if (!adminTableExists($pdo, 'categories')) {
    adminJsonResponse(500, ['ok' => false, 'message' => 'No existe la tabla categories']);
  }

  $columns = adminGetTableColumns($pdo, 'categories');
  $hasName = in_array('name', $columns, true);
  if (!$hasName) {
    adminJsonResponse(500, ['ok' => false, 'message' => 'La tabla categories no tiene columna name']);
  }

  $hasSlug = in_array('slug', $columns, true);
  $hasParentId = in_array('parent_id', $columns, true);
  $hasIsActive = in_array('is_active', $columns, true);
  $hasDisplayOrder = in_array('display_order', $columns, true);
  $hasIcon = in_array('icon', $columns, true);
  $hasColor = in_array('color', $columns, true);

  $selectStmt = $pdo->query('
    SELECT id, name
    FROM categories
    ORDER BY id ASC
  ');
  $existingCategories = $selectStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

  $availableByName = [];
  foreach ($existingCategories as $row) {
    $normalizedName = mb_strtolower(trim((string)($row['name'] ?? '')), 'UTF-8');
    if ($normalizedName === '') {
      continue;
    }
    $availableByName[$normalizedName][] = (int)$row['id'];
  }

  $canonicalIds = [];
  $usedIds = [];

  foreach (ADMIN_CANONICAL_CATEGORY_NAMES as $index => $categoryName) {
    $normalizedCanonical = mb_strtolower($categoryName, 'UTF-8');
    $categoryId = 0;

    if (!empty($availableByName[$normalizedCanonical])) {
      $candidateId = (int)array_shift($availableByName[$normalizedCanonical]);
      if ($candidateId > 0) {
        $categoryId = $candidateId;
      }
    }

    if ($categoryId === 0) {
      foreach ($existingCategories as $existingCategory) {
        $existingId = (int)($existingCategory['id'] ?? 0);
        if ($existingId <= 0 || isset($usedIds[$existingId])) {
          continue;
        }
        $categoryId = $existingId;
        break;
      }
    }

    if ($categoryId === 0) {
      $insertFields = ['name'];
      $insertPlaceholders = [':name'];
      $insertParams = ['name' => $categoryName];

      if ($hasSlug) {
        $insertFields[] = 'slug';
        $insertPlaceholders[] = ':slug';
        $insertParams['slug'] = adminCategorySlug($categoryName);
      }
      if ($hasParentId) {
        $insertFields[] = 'parent_id';
        $insertPlaceholders[] = 'NULL';
      }
      if ($hasIsActive) {
        $insertFields[] = 'is_active';
        $insertPlaceholders[] = ':is_active';
        $insertParams['is_active'] = 1;
      }
      if ($hasDisplayOrder) {
        $insertFields[] = 'display_order';
        $insertPlaceholders[] = ':display_order';
        $insertParams['display_order'] = $index + 1;
      }
      if ($hasIcon) {
        $insertFields[] = 'icon';
        $insertPlaceholders[] = ':icon';
        $insertParams['icon'] = 'fas fa-folder';
      }
      if ($hasColor) {
        $insertFields[] = 'color';
        $insertPlaceholders[] = ':color';
        $insertParams['color'] = '#0f766e';
      }

      $insertSql = '
        INSERT INTO categories (' . implode(', ', $insertFields) . ')
        VALUES (' . implode(', ', $insertPlaceholders) . ')
      ';
      $insertStmt = $pdo->prepare($insertSql);
      $insertStmt->execute($insertParams);
      $categoryId = (int)$pdo->lastInsertId();
    }

    if ($categoryId <= 0) {
      continue;
    }

    $usedIds[$categoryId] = true;
    $canonicalIds[] = $categoryId;

    $updateParts = ['name = :name'];
    $updateParams = [
      'id' => $categoryId,
      'name' => $categoryName,
    ];

    if ($hasSlug) {
      $updateParts[] = 'slug = :slug';
      $updateParams['slug'] = adminCategorySlug($categoryName);
    }
    if ($hasParentId) {
      $updateParts[] = 'parent_id = NULL';
    }
    if ($hasIsActive) {
      $updateParts[] = 'is_active = 1';
    }
    if ($hasDisplayOrder) {
      $updateParts[] = 'display_order = :display_order';
      $updateParams['display_order'] = $index + 1;
    }

    $updateStmt = $pdo->prepare('
      UPDATE categories
      SET ' . implode(', ', $updateParts) . '
      WHERE id = :id
    ');
    $updateStmt->execute($updateParams);
  }

  if ($hasIsActive && !empty($canonicalIds)) {
    $idPlaceholders = implode(', ', array_fill(0, count($canonicalIds), '?'));
    $deactivateStmt = $pdo->prepare("
      UPDATE categories
      SET is_active = 0
      WHERE id NOT IN ($idPlaceholders)
    ");
    $deactivateStmt->execute($canonicalIds);
  }
}

try {
  $pdo = adminGetPdo();
  adminRequireSession($pdo);

  $pdo->beginTransaction();
  adminSyncCanonicalCategories($pdo);
  $pdo->commit();

  $columns = adminGetTableColumns($pdo, 'categories');
  $hasParentId = in_array('parent_id', $columns, true);
  $hasIsActive = in_array('is_active', $columns, true);
  $hasDisplayOrder = in_array('display_order', $columns, true);

  $selectParts = ['id', 'name'];
  if ($hasParentId) {
    $selectParts[] = 'parent_id';
  } else {
    $selectParts[] = 'NULL AS parent_id';
  }
  if ($hasIsActive) {
    $selectParts[] = 'is_active';
  } else {
    $selectParts[] = '1 AS is_active';
  }

  $orderBy = $hasDisplayOrder ? 'display_order ASC, name ASC' : 'name ASC';
  $categoryNamesQuoted = array_map(static fn(string $name): string => $pdo->quote($name), ADMIN_CANONICAL_CATEGORY_NAMES);
  $filterByCanonical = implode(', ', $categoryNamesQuoted);

  $stmt = $pdo->query("
    SELECT " . implode(', ', $selectParts) . "
    FROM categories
    WHERE name IN ($filterByCanonical)
    ORDER BY $orderBy
  ");

  $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

  foreach ($categories as &$category) {
    $category['id'] = (int)$category['id'];
    $category['parent_id'] = $category['parent_id'] === null ? null : (int)$category['parent_id'];
    $category['is_active'] = $category['is_active'] ? 1 : 0;
  }

  adminJsonResponse(200, [
    'ok' => true,
    'categories' => $categories,
  ]);
} catch (PDOException $e) {
  if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
    $pdo->rollBack();
  }
  error_log('admin_categories_list.php DB error: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor']);
}

