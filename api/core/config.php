<?php
/**
 * Configuración central de API admin.
 */

// ⚠️ CONFIGURA ESTOS VALORES CON TUS CREDENCIALES DE HOSTINGER

const ADMIN_DB_HOST = 'localhost';
const ADMIN_DB_NAME = getenv('VITE_ADMIN_DB_NAME');
const ADMIN_DB_USER = getenv('VITE_ADMIN_DB_USER');
const ADMIN_DB_PASS = getenv('VITE_ADMIN_DB_PASS');

const STRIPE_SECRET_KEY = getenv('VITE_STRIPE_SECRET_KEY');
const STRIPE_PUBLISHABLE_KEY = getenv('VITE_STRIPE_PUBLISHABLE_KEY');
const STRIPE_WEBHOOK_SECRET = getenv('VITE_STRIPE_WEBHOOK_SECRET');

// Firebase — clave de API para verificar tokens vía REST.
const FIREBASE_API_KEY = getenv('VITE_FIREBASE_API_KEY');


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
