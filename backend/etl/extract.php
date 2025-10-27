<?php

// -> fetch von Basel Parkhaus API
function fetchParkhausData() {
    $url = "https://data.bs.ch/api/explore/v2.1/catalog/datasets/100088/records?limit=20";

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);

    return json_decode($response, true);
}

// -> daten laden
$data = fetchParkhausData();

// -> testen
/*cho '<pre>';
print_r($data);
echo '</pre>';*/

// -> daten zurückgeben
return $data;