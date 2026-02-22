-- =============================================================================
-- Fase 1: Datos iniciales para pruebas (categorías y productos)
-- Ejecutar después de init-db-fase1.sql
-- =============================================================================

-- Categorías padre (para menú: Escolar, Escritura, etc.)
INSERT INTO categories (name, slug, icon, display_order) VALUES
  ('Útiles Escolares', 'escolares', 'fas fa-book', 1),
  ('Escritura', 'escritura', 'fas fa-pencil-alt', 2),
  ('Papelería', 'papeleria', 'fas fa-file', 3),
  ('Arte & Manualidades', 'arte', 'fas fa-palette', 4)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Categorías hijas (ejemplo: bajo Escolares id=1)
INSERT INTO categories (parent_id, name, slug, icon, color, display_order) VALUES
  (1, 'Cuadernos', 'cuadernos', 'fas fa-book', '#FF6B9D', 1),
  (1, 'Estuches', 'estuches', 'fas fa-briefcase', '#C44569', 2),
  (2, 'Bolígrafos', 'boligrafos', 'fas fa-pen', '#4ECDC4', 1),
  (2, 'Marcadores', 'marcadores', 'fas fa-highlighter', '#95E1D3', 2)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Productos de ejemplo (category_id 1 = Escolares, 5 = Cuadernos, 6 = Estuches, etc.)
INSERT INTO products (category_id, name, slug, description, brand, price, stock, sku, mayoreo, menudeo) VALUES
  (5, 'Cuaderno Profesional A4 100 hojas', 'cuaderno-profesional-a4', 'Cuaderno tamaño profesional, 100 hojas rayadas.', 'Norma', 45.00, 120, 'CUA-A4-100', TRUE, TRUE),
  (5, 'Cuaderno College 80 hojas', 'cuaderno-college-80', 'Cuaderno college 80 hojas, pasta suave.', NULL, 28.50, 200, 'CUA-COL-80', TRUE, TRUE),
  (6, 'Estuche escolar 3 piezas', 'estuche-escolar-3p', 'Estuche con regla, sacapuntas y goma.', 'Faber-Castell', 89.00, 80, 'EST-3P', TRUE, TRUE),
  (7, 'Bolígrafo punta fina azul pack 12', 'boligrafo-punta-fina-12', 'Pack 12 bolígrafos punta fina 0.7mm.', 'Bic', 65.00, 150, 'BOL-PF-12', TRUE, TRUE),
  (8, 'Marcadores fluorescentes pack 6', 'marcadores-fluorescentes-6', 'Pack 6 colores surtidos.', 'Stabilo', 95.00, 60, 'MAR-FLU-6', TRUE, TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name), price = VALUES(price), stock = VALUES(stock);

-- Imagen principal por producto (ajustar image_url a tus assets reales)
INSERT IGNORE INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, CONCAT('/images/products/', slug, '.jpg'), TRUE, 0 FROM products LIMIT 5;
