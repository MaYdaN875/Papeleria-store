<?php
require 'api/core/config.php';
require 'api/core/db.php';
$pdo = adminGetPdo(); // using admin DB config
$stmt = $pdo->query("SELECT p.name AS categoria_padre, c.name AS subclase, c.is_active FROM categories c JOIN categories p ON p.id = c.parent_id ORDER BY p.name, c.name;");
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);

$counts = [];
foreach ($results as $r) {
  $c = $r['categoria_padre'];
  if (!isset($counts[$c])) $counts[$c] = 0;
  $counts[$c]++;
}
print_r($counts);
print_r($results);
