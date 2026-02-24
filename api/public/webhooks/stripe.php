<?php
/**
 * Webhook de Stripe: marcar órdenes como pagadas al completar el pago.
 * Stripe llama a esta URL (POST). No requiere autenticación Bearer; se verifica con firma.
 */

require_once __DIR__ . '/../../_admin_common.php';
require_once __DIR__ . '/../../core/stripe_loader.php';

header('Content-Type: application/json');

if (!loadStripeSdk()) {
  http_response_code(503);
  echo json_encode(['ok' => false, 'message' => 'Stripe SDK not installed. Upload stripe-php folder to api/ (see prompt/STRIPE_SETUP.md).']);
  exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'message' => 'Method not allowed']);
  exit;
}

$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

$webhookSecret = getStripeWebhookSecret();
if ($webhookSecret === '') {
  error_log('Stripe webhook: STRIPE_WEBHOOK_SECRET not set');
  http_response_code(503);
  echo json_encode(['ok' => false, 'message' => 'Webhook not configured']);
  exit;
}

try {
  $event = \Stripe\Webhook::constructEvent($payload, $signature, $webhookSecret);
} catch (\UnexpectedValueException $e) {
  error_log('Stripe webhook invalid payload: ' . $e->getMessage());
  http_response_code(400);
  echo json_encode(['ok' => false, 'message' => 'Invalid payload']);
  exit;
} catch (\Stripe\Exception\SignatureVerificationException $e) {
  error_log('Stripe webhook signature invalid: ' . $e->getMessage());
  http_response_code(400);
  echo json_encode(['ok' => false, 'message' => 'Invalid signature']);
  exit;
}

if ($event->type !== 'checkout.session.completed') {
  http_response_code(200);
  echo json_encode(['ok' => true, 'handled' => false, 'type' => $event->type]);
  exit;
}

$session = $event->data->object;
$orderId = isset($session->metadata->order_id) ? (int) $session->metadata->order_id : 0;

if ($orderId <= 0) {
  http_response_code(200);
  echo json_encode(['ok' => true, 'handled' => false, 'reason' => 'no order_id in metadata']);
  exit;
}

try {
  $pdo = adminGetPdo();
  if (!adminTableExists($pdo, 'orders')) {
    http_response_code(200);
    echo json_encode(['ok' => true, 'handled' => false, 'reason' => 'orders table missing']);
    exit;
  }

  $stmt = $pdo->prepare('
    UPDATE orders
    SET status = :status, updated_at = NOW()
    WHERE id = :id AND status = :pending
  ');
  $stmt->execute([
    'status' => 'paid',
    'id' => $orderId,
    'pending' => 'pending',
  ]);

  $updated = $stmt->rowCount() > 0;
  if ($updated) {
    error_log('Stripe webhook: order ' . $orderId . ' marked as paid');
  }

  http_response_code(200);
  echo json_encode(['ok' => true, 'handled' => true, 'order_id' => $orderId, 'updated' => $updated]);
} catch (PDOException $e) {
  error_log('Stripe webhook DB error: ' . $e->getMessage());
  http_response_code(500);
  echo json_encode(['ok' => false, 'message' => 'Database error']);
}
