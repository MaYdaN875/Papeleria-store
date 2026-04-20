-- =============================================================================
-- Migración: Tabla de cortes de caja (daily_sales_closings)
-- Ejecutar en phpMyAdmin → SQL de tu base de datos en Hostinger
-- =============================================================================

CREATE TABLE IF NOT EXISTS daily_sales_closings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  closing_date DATE NOT NULL,
  period_start DATETIME NOT NULL,
  period_end DATETIME NOT NULL,
  total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_units INT NOT NULL DEFAULT 0,
  total_orders INT NOT NULL DEFAULT 0,
  products_detail JSON NULL,
  notes VARCHAR(255) NULL,
  closed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_by INT NULL,
  INDEX idx_closing_date (closing_date DESC),
  INDEX idx_period (period_start, period_end),
  CONSTRAINT fk_closing_admin
    FOREIGN KEY (closed_by) REFERENCES admin_users(id)
    ON DELETE SET NULL
);
