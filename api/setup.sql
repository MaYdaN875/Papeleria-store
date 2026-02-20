-- =============================================================================
-- Script SQL para crear tabla admin_users y usuario de prueba
-- Ejecuta esto en phpMyAdmin → SQL
-- =============================================================================

-- Crear tabla admin_users
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de sesiones admin para validar token en backend
CREATE TABLE IF NOT EXISTS admin_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME NULL,
  revoked_at DATETIME NULL,
  INDEX idx_admin_sessions_user (admin_user_id),
  INDEX idx_admin_sessions_expires (expires_at),
  CONSTRAINT fk_admin_sessions_user
    FOREIGN KEY (admin_user_id) REFERENCES admin_users(id)
    ON DELETE CASCADE
);

-- Tabla de ofertas por producto (no elimina producto original)
CREATE TABLE IF NOT EXISTS product_offers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL UNIQUE,
  offer_price DECIMAL(10,2) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_product_offers_active (is_active),
  CONSTRAINT fk_product_offers_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE
);

-- Tabla para asignar productos a carruseles del home (1, 2 o 3)
CREATE TABLE IF NOT EXISTS home_carousel_assignments (
  product_id INT NOT NULL PRIMARY KEY,
  carousel_slot TINYINT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_home_carousel_slot (carousel_slot),
  CONSTRAINT chk_home_carousel_slot CHECK (carousel_slot IN (1, 2, 3)),
  CONSTRAINT fk_home_carousel_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE
);

-- Slides del home (imagen completa para banner principal)
CREATE TABLE IF NOT EXISTS home_slides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  image_url VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  display_order INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_home_slides_active_order (is_active, display_order)
);

-- Usuarios clientes (tienda)
CREATE TABLE IF NOT EXISTS customer_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email_verified_at DATETIME NULL,
  email_verification_required TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sesiones de clientes para login en tienda
CREATE TABLE IF NOT EXISTS customer_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME NULL,
  revoked_at DATETIME NULL,
  INDEX idx_customer_sessions_user (customer_user_id),
  INDEX idx_customer_sessions_expires (expires_at),
  CONSTRAINT fk_customer_sessions_user
    FOREIGN KEY (customer_user_id) REFERENCES customer_users(id)
    ON DELETE CASCADE
);

-- Protección anti-bruteforce para login/registro de clientes
CREATE TABLE IF NOT EXISTS customer_auth_rate_limits (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  action VARCHAR(40) NOT NULL,
  scope VARCHAR(20) NOT NULL,
  identifier_hash CHAR(64) NOT NULL,
  attempt_count INT NOT NULL DEFAULT 0,
  window_started_at DATETIME NOT NULL,
  blocked_until DATETIME NULL,
  last_attempt_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_customer_auth_rate_limit (action, scope, identifier_hash),
  INDEX idx_customer_auth_rate_limit_blocked (blocked_until),
  INDEX idx_customer_auth_rate_limit_window (window_started_at)
);

-- Tokens de recuperacion de contrasena para clientes
CREATE TABLE IF NOT EXISTS customer_password_resets (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  customer_user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  requested_ip VARCHAR(45) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customer_password_resets_user (customer_user_id),
  INDEX idx_customer_password_resets_expires (expires_at),
  INDEX idx_customer_password_resets_used (used_at),
  CONSTRAINT fk_customer_password_resets_user
    FOREIGN KEY (customer_user_id) REFERENCES customer_users(id)
    ON DELETE CASCADE
);

-- Tokens de verificacion de correo para clientes
CREATE TABLE IF NOT EXISTS customer_email_verifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  customer_user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  requested_ip VARCHAR(45) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customer_email_verifications_user (customer_user_id),
  INDEX idx_customer_email_verifications_expires (expires_at),
  INDEX idx_customer_email_verifications_used (used_at),
  CONSTRAINT fk_customer_email_verifications_user
    FOREIGN KEY (customer_user_id) REFERENCES customer_users(id)
    ON DELETE CASCADE
);

-- Insertar usuario admin de prueba
-- Email: admin@godart.com
-- Contraseña: password
-- (Si quieres otra contraseña, genera el hash con PHP: password_hash('tu_password', PASSWORD_BCRYPT))
INSERT INTO admin_users (email, password_hash) 
VALUES (
  'admin@godart.com',
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
)
ON DUPLICATE KEY UPDATE email = email;
