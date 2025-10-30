// Globale Variable für die geladenen Daten
let parkhausData = [];

// Funktion: Daten von der API laden
async function loadAverageData(hour, weekday) {
    const url = `https://im3.potterai.ch/backend/api/calculate_averages.php?hour=${hour}&weekday=${weekday}`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP-Fehler! Status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        return null;
    }
}

// Funktion: Daten als Liste anzeigen
function displayData(data) {
    const displayDiv = document.getElementById('data-display');
    
    // Wenn keine Daten vorhanden
    if (!data || data.length === 0) {
        displayDiv.innerHTML = '<p style="color: #ff0000;">Keine Daten verfügbar für diese Kombination.</p>';
        return;
    }
    
    // HTML für die Parkhaus-Liste erstellen
    let html = '<div class="parkhaus-list">';
    
    data.forEach(parkhaus => {
        html += `
            <div class="parkhaus-item">
                <h3>${parkhaus.title}</h3>
                <p class="free-spaces">${parkhaus.avg_free} freie Plätze</p>
            </div>
        `;
    });
    
    html += '</div>';
    displayDiv.innerHTML = html;
}

// Funktion: Ladeindikator anzeigen/verstecken
function toggleLoading(show) {
    const loadingDiv = document.getElementById('loading');
    if (show) {
        loadingDiv.classList.remove('hidden');
    } else {
        loadingDiv.classList.add('hidden');
    }
}

// Funktion: Daten laden und anzeigen
async function loadAndDisplay() {
    // Werte aus den Dropdowns holen
    const hour = document.getElementById('hour-select').value;
    const weekday = document.getElementById('weekday-select').value;
    
    // Ladeindikator anzeigen
    toggleLoading(true);
    
    // Alte Daten ausblenden
    document.getElementById('data-display').innerHTML = '<p>Laden...</p>';
    
    // Daten von API laden
    const data = await loadAverageData(hour, weekday);
    
    // Ladeindikator verstecken
    toggleLoading(false);
    
    // Daten anzeigen
    if (data) {
        parkhausData = data; // Für spätere Verwendung speichern
        displayData(data);
    } else {
        document.getElementById('data-display').innerHTML = 
            '<p style="color: #ff0000;">Fehler beim Laden der Daten. Bitte versuche es erneut.</p>';
    }
}

// Event-Listener: Button-Klick
document.getElementById('load-button').addEventListener('click', loadAndDisplay);

// Optional: Automatisches Laden bei Dropdown-Änderung
// Kommentiere die nächsten 2 Zeilen ein, wenn du automatisches Laden möchtest
// document.getElementById('hour-select').addEventListener('change', loadAndDisplay);
// document.getElementById('weekday-select').addEventListener('change', loadAndDisplay);

// Optional: Daten beim Seitenaufruf laden
// Kommentiere die nächste Zeile ein, wenn du möchtest, dass Daten automatisch geladen werden
// loadAndDisplay();
