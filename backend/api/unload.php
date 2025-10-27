<?php
header('Content-Type: application/json');
// -> datenbank zugangsdaten einbinden
require_once '../config.php';

// -> verbindung mit der datenbank
try {
    $pdo = new PDO($dsn, $username, $password, $options);//datenbankverbindung herstellen
    $sql = "SELECT * from parkhaus";//sql abfrage formulieren
    $stmt= $pdo->prepare ($sql);//abfrage vorbereiten
    $stmt->execute();//abfrage ausführen
    $results= $stmt-> fetchAll();//Ergebnis in mehrdimensionales Array umwandeln
    echo json_encode($results);//array als json ausgeben
    
    


} catch (PDOException $e) {
    die("Verbindung zur Datenbank konnte nicht hergestellt werden: " . $e->getMessage());
}