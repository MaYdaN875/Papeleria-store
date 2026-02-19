<?php
/**
 * Punto de entrada de helpers compartidos del panel admin.
 *
 * Mantiene compatibilidad con endpoints existentes (`require_once _admin_common.php`)
 * y delega implementación real a módulos en `api/core/`.
 */

require_once __DIR__ . '/core/config.php';
require_once __DIR__ . '/core/response.php';
require_once __DIR__ . '/core/cors.php';
require_once __DIR__ . '/core/db.php';
require_once __DIR__ . '/core/auth.php';
require_once __DIR__ . '/core/catalog.php';
