-- Ejecuta este script en tu base de datos (ej. phpMyAdmin en Hostinger)
-- Añade las columnas necesarias para guardar la dirección de envío

ALTER TABLE `orders`
ADD COLUMN `delivery_method` VARCHAR(50) NOT NULL DEFAULT 'pickup',
ADD COLUMN `delivery_address` TEXT NULL;
