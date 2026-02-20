<?php
/**
 * Configuración central de API admin.
 */

// ⚠️ CONFIGURA ESTOS VALORES CON TUS CREDENCIALES DE HOSTINGER
const ADMIN_DB_HOST = 'localhost';
const ADMIN_DB_NAME = 'u214097926_godart';
const ADMIN_DB_USER = 'TU_USUARIO_DB';
const ADMIN_DB_PASS = 'TU_PASSWORD_DB';

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
