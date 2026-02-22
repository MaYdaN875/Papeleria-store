-- =============================================================================
-- Fase 1: Tablas para API de productos y categorías (Papelería Store)
-- Ejecutar contra MySQL. Ajustar charset/collate si es necesario.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CATEGORÍAS (jerarquía: padre null = Escolar, Escritura; parent_id = padre)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parent_id INT NULL,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50) NULL,
  color VARCHAR(20) NULL,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- PRODUCTOS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  brand VARCHAR(100) NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INT DEFAULT 0,
  sku VARCHAR(100) NULL UNIQUE,
  mayoreo BOOLEAN DEFAULT TRUE,
  menudeo BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

-- -----------------------------------------------------------------------------
-- IMÁGENES DE PRODUCTO (una principal por producto)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Índices útiles para listados y filtros
CREATE INDEX idx_products_category_active ON products(category_id, is_active);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_categories_parent_order ON categories(parent_id, display_order);
CREATE INDEX idx_product_images_primary ON product_images(product_id, is_primary);
