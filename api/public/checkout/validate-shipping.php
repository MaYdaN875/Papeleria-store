<?php
/**
 * Endpoint público: Validar ubicación de envío.
 * Recibe lat y lng y calcula la distancia con el origen.
 */

require_once __DIR__ . '/../../_admin_common.php';

adminHandleCors(['POST', 'OPTIONS']);
adminRequireMethod('POST');

try {
  $body = adminReadJsonBody();
  
  if (!isset($body['lat']) || !isset($body['lng'])) {
    adminJsonResponse(400, ['ok' => false, 'message' => 'Faltan coordenadas (lat, lng).']);
  }

  $lat1 = (float) $body['lat'];
  $lon1 = (float) $body['lng'];

  // Coordenadas de la tienda
  $storeLat = 20.672342107479544;
  $storeLng = -103.27608574661102;
  $maxDistanceKm = 1.0; // 1 kilómetro

  $earth_radius = 6371; // radio de la tierra en km
  $dLat = deg2rad($storeLat - $lat1);
  $dLon = deg2rad($storeLng - $lon1);

  $a = sin($dLat/2) * sin($dLat/2) + cos(deg2rad($lat1)) * cos(deg2rad($storeLat)) * sin($dLon/2) * sin($dLon/2);
  $c = 2 * asin(sqrt($a));
  $distance = $earth_radius * $c;

  if ($distance <= $maxDistanceKm) {
    adminJsonResponse(200, [
      'ok' => true,
      'allowed' => true,
      'distance' => round($distance, 2),
      'message' => 'Estás dentro de la zona de cobertura.'
    ]);
  } else {
    adminJsonResponse(200, [
      'ok' => true,
      'allowed' => false,
      'distance' => round($distance, 2),
      'message' => 'Estás fuera de nuestra zona de envío (' . round($distance, 2) . ' km). El máximo es 1 km.'
    ]);
  }

} catch (Throwable $e) {
  error_log('checkout/validate-shipping.php: ' . $e->getMessage());
  adminJsonResponse(500, ['ok' => false, 'message' => 'Error interno del servidor.']);
}
