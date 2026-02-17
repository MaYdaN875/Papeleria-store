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
