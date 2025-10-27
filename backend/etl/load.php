<?php

// -> daten laden
$data = include('transform.php');

// -> datenbank zugangsdaten einbinden
require_once '../config.php';

// -> verbindung mit der datenbank
try {
    $pdo = new PDO($dsn, $username, $password, $options);
    $sql = "INSERT INTO parkhaus (title,published, lon, lat,free) VALUES (?, ?, ?,?,?)";
    $stmt = $pdo->prepare($sql);
    
    foreach($data as $parkhaus) {
        $stmt->execute([
            $parkhaus['title'],
            $parkhaus['published'],
            $parkhaus['lon'],
            $parkhaus['lat'],
            $parkhaus['free']
        ]);
    }

    echo "Daten erfolgreich eingefügt.";
} catch (PDOException $e) {
    die("Verbindung zur Datenbank konnte nicht hergestellt werden: " . $e->getMessage());
}