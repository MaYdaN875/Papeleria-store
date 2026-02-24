<?php
/**
 * Configuración central de API admin.
 */

// ⚠️ CONFIGURA ESTOS VALORES CON TUS CREDENCIALES DE HOSTINGER

const ADMIN_DB_HOST = 'localhost';
const ADMIN_DB_NAME = 'u214097926_godart';
const ADMIN_DB_USER = 'u214097926_godartAdmin';
const ADMIN_DB_PASS = 'I8t&WN0&#t0';

const STRIPE_SECRET_KEY = 'sk_test_51T2jKMR4GGOTGGzOoyIx4LlSIc5dGlI91bcUCjn92fKQUQncoTW6LwdU9UrzIexQTmHomJctHIJDrzhakYzO4Pfy006LUVmqXW';
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51T2jKMR4GGOTGGzOfCNEcTd6LdEQKkXs9p5o4CAq6qT43u3yrmf78XPU0FK4ui4SIKe0freaNFDSsFaA58poEa70005GxQzT1H';
const STRIPE_WEBHOOK_SECRET = 'whsec_PBIP6wsq1TqSBkEjyNgaB1JU5oOMmECx';


const ADMIN_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://godart-papeleria.com',
  'https://www.godart-papeleria.com',
  'https://godart-papelería.com',
  'https://www.godart-papelería.com',
  'https://xn--godart-papelera-xkb.com',
  'https://www.xn--godart-papelera-xkb.com',
];

// URL publica de la tienda para enlaces de recuperacion.
const STORE_PUBLIC_APP_URL = 'https://godart-papelería.com';

// Remitentes para correos del flujo de autenticacion cliente.
const STORE_MAIL_FROM = 'no-reply@godart-papeleria.com';
const STORE_MAIL_REPLY_TO = 'soporte@godart-papeleria.com';

// Stripe (pasarela de pagos). Configurar en config o via variables de entorno.
// Ver prompt/STRIPE_SETUP.md
function getStripeSecretKey(): string
{
  $v = getenv('STRIPE_SECRET_KEY');
  return $v !== false && $v !== '' ? $v : (defined('STRIPE_SECRET_KEY') ? STRIPE_SECRET_KEY : '');
}
function getStripeWebhookSecret(): string
{
  $v = getenv('STRIPE_WEBHOOK_SECRET');
  return $v !== false && $v !== '' ? $v : (defined('STRIPE_WEBHOOK_SECRET') ? STRIPE_WEBHOOK_SECRET : '');
}
function getStripePublishableKey(): string
{
  $v = getenv('STRIPE_PUBLISHABLE_KEY');
  return $v !== false && $v !== '' ? $v : (defined('STRIPE_PUBLISHABLE_KEY') ? STRIPE_PUBLISHABLE_KEY : '');
}
