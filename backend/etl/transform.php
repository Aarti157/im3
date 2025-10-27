<?php

// -> daten laden
$data = include('extract.php');
$parkaeuser = $data["results"];
// -> testen
/*echo '<pre> ';
print_r($data["results"]);
echo '</pre>';*/

// -> testen
$transformed_data = [];
foreach ($parkaeuser as $parkhaus)
{
 
    $parkhausData = [];
    $parkhausData ["title"]= $parkhaus["title"];
    $parkhausData ["published"]= $parkhaus["published"];
    $parkhausData ["free"]= $parkhaus["free"];
    $parkhausData ["lon"]= $parkhaus["geo_point_2d"]["lon"];
    $parkhausData ["lat"]= $parkhaus["geo_point_2d"]["lat"];
    $transformed_data[]=$parkhausData;
}
/*echo '<pre>';
print_r($transformed_data);
echo '</pre>';*/

// -> daten zurückgeben
return $transformed_data;