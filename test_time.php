<?php
$pdo = new PDO("mysql:host=localhost;dbname=u214097926_godart;charset=utf8mb4", "root", "", [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$pdo->exec('TRUNCATE TABLE daily_sales_closings');
echo "Tabla reiniciada.";
