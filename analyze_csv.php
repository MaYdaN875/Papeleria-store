<?php
$handle = fopen('Inventario_con_Subclases_MEJORADO1.csv', 'r');
if (!$handle) die('No CSV');
$bom = fread($handle, 3);
if ($bom !== "\xEF\xBB\xBF") rewind($handle);
$header = fgetcsv($handle, 0, ',');

$catCol = 3;
$subCol = 7;
$count = 0;
while (($row = fgetcsv($handle, 0, ',')) !== false) {
    $count++;
    if (count($row) < 8) continue;
    $cat = mb_strtolower(trim($row[$catCol]), 'UTF-8');
    $sub = mb_strtolower(trim($row[$subCol]), 'UTF-8');

    if ($cat !== 'arte y manualidades' && $cat !== 'miselanea y regalos' && $cat !== 'miscelanea y regalos' && $cat !== 'servicios digitales e impresiones') {
        if ($cat === 'oficina y escolares' && $sub === 'pintura') {
             echo "Línea $count: Categoria='$cat', Subclase='$sub'\n";
        }
    }
}
fclose($handle);
echo "Finalizado.\n";
