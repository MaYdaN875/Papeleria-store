<?php
require 'api/core/config.php';
require 'api/core/db.php';
$pdo = adminGetPdo();
$stmt = $pdo->query('SELECT NOW()');
echo "With offset: " . $stmt->fetchColumn() . "\n";
$pdo->exec("SET time_zone = 'SYSTEM'");
$stmt = $pdo->query('SELECT NOW()');
echo "SYSTEM: " . $stmt->fetchColumn() . "\n";
echo "PHP: " . date('Y-m-d H:i:s') . "\n";
