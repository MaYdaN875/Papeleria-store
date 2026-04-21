-- Ejecuta este script en tu base de datos (ej. phpMyAdmin en Hostinger)
-- Añade las columnas necesarias para guardar la dirección de envío en la orden
-- Y también en el prefil del usuario para que se guarde de forma permanente

-- ALTER TABLE `orders`
-- ADD COLUMN `delivery_method` VARCHAR(50) NOT NULL DEFAULT 'pickup',
-- ADD COLUMN `delivery_address` TEXT NULL;

-- Bonus: Guardar la dirección en el perfil
ALTER TABLE `customer_users`
ADD COLUMN `default_delivery_address` TEXT NULL;
