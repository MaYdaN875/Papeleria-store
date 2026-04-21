<?php
require_once __DIR__ . '/core/config.php';

try {
    $pdo = new PDO(
        "mysql:host=" . ADMIN_DB_HOST . ";dbname=" . ADMIN_DB_NAME . ";charset=utf8mb4",
        ADMIN_DB_USER,
        ADMIN_DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]
    );

    // Intentar añadir delivery_method
    try {
        $pdo->exec("ALTER TABLE orders ADD COLUMN delivery_method VARCHAR(50) DEFAULT 'pickup'");
        echo "Columna delivery_method añadida.\n";
    } catch (PDOException $e) {
        echo "Nota: delivery_method posiblemente ya existe (" . $e->getMessage() . ")\n";
    }

    // Intentar añadir delivery_address
    try {
        $pdo->exec("ALTER TABLE orders ADD COLUMN delivery_address TEXT NULL");
        echo "Columna delivery_address añadida.\n";
    } catch (PDOException $e) {
        echo "Nota: delivery_address posiblemente ya existe (" . $e->getMessage() . ")\n";
    }

    echo "Migración terminada.\n";
} catch (PDOException $e) {
    echo "Error conectando a DB: " . $e->getMessage() . "\n";
}
