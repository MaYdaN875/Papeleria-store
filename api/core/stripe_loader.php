<?php
/**
 * Carga la librería Stripe: primero Composer (vendor/autoload.php), luego carpeta manual (stripe-php/init.php).
 * Útil cuando en el servidor (ej. Hostinger) no se puede usar Composer.
 *
 * Carpeta manual: descarga el ZIP de https://github.com/stripe/stripe-php/releases
 * y extrae el contenido en api/stripe-php/ de forma que exista api/stripe-php/init.php
 */
function loadStripeSdk(): bool {
  $apiRoot = dirname(__DIR__);

  $composerAutoload = $apiRoot . '/vendor/autoload.php';
  if (is_file($composerAutoload)) {
    require_once $composerAutoload;
    return true;
  }

  $stripeInit = $apiRoot . '/stripe-php/init.php';
  if (is_file($stripeInit)) {
    require_once $stripeInit;
    return true;
  }

  return false;
}
