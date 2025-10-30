<?php
// Datenbank-Zugangsdaten einbinden
require_once '../config.php';

// CORS-Header setzen
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    // GET-Parameter empfangen und validieren
    $hour = isset($_GET['hour']) ? (int)$_GET['hour'] : null;
    $weekday = isset($_GET['weekday']) ? (int)$_GET['weekday'] : null;
    
    // Parameter-Validierung
    if ($hour === null || $weekday === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Parameter hour und weekday sind erforderlich']);
        exit;
    }
    
    if ($hour < 0 || $hour > 23) {
        http_response_code(400);
        echo json_encode(['error' => 'hour muss zwischen 0 und 23 liegen']);
        exit;
    }
    
    if ($weekday < 0 || $weekday > 6) {
        http_response_code(400);
        echo json_encode(['error' => 'weekday muss zwischen 0 und 6 liegen']);
        exit;
    }
    
    // Datenbankverbindung herstellen
    $pdo = new PDO($dsn, $username, $password, $options);
    
    // SQL-Query mit Durchschnittsberechnung, mit Rundungs-Logik für korrekte Stunden-Zuordnung
    // Nur Daten der letzten 8 Wochen werden berücksichtigt
    $sql = "SELECT 
                title,
                AVG(free) as avg_free,
                COUNT(*) as data_points,
                lon,
                lat
            FROM parkhaus
            WHERE HOUR(DATE_ADD(published, INTERVAL 30 MINUTE)) = :hour 
            AND WEEKDAY(DATE_ADD(published, INTERVAL 30 MINUTE)) = :weekday
            AND published >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
            GROUP BY title, lon, lat
            ORDER BY title";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':hour' => $hour,
        ':weekday' => $weekday
    ]);
    
    $results = $stmt->fetchAll();
    
    // Durchschnittswerte runden und Warnung bei wenig Daten hinzufügen
    foreach ($results as &$row) {
        $row['avg_free'] = round($row['avg_free'], 0);
        
        // Warnung, wenn weniger als 4 Datenpunkte vorhanden sind
        if ($row['data_points'] < 4) {
            $row['warning'] = 'Wenige Daten verfügbar - Wert könnte ungenau sein';
        }
        
        // Optional: data_points aus der Ausgabe entfernen (für sauberes JSON)
        // Kommentiere die nächste Zeile aus, wenn du die Anzahl sehen möchtest
        // unset($row['data_points']);
    }
    
    // JSON zurückgeben
    echo json_encode($results);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Datenbankfehler: ' . $e->getMessage()]);
}
?>
