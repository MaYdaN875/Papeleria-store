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
