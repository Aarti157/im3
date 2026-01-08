// Globale Variable für die geladenen Daten
let parkhausData = [];

// Merker, welche Parkhäuser ein „fixiertes“ (geklicktes) Popup haben
const pinnedPopups = new Set();


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

// Funktion: Daten als Liste anzeigen (wird aktuell nicht genutzt, kann bleiben)
function displayData(data) {
    const displayDiv = document.getElementById('data-display');

    if (!data || data.length === 0) {
        displayDiv.innerHTML = '<p style="color: #ff0000;">Keine Daten verfügbar für diese Kombination.</p>';
        return;
    }

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

// Style für Pins je nach Belegung
function getPinStyle(avgFree) {
    if (avgFree === 0) {
        return { fill: '#000000', scale: 0.8 }; // schwarz, klein
    } else if (avgFree < 50) {
        return { fill: '#ff0000', scale: 0.8 }; // rot, klein
    } else if (avgFree < 200) {
        return { fill: '#EEF206', scale: 1.0 }; // gelb/orange, mittel
    } else {
        return { fill: '#04E717', scale: 1.2 }; // grün, groß
    }
}

// SVG-Punkt (Pin) in Seitenkoordinaten umrechnen (für Popups)
function getPinScreenPosition(pinGroup) {
    const svg = pinGroup.ownerSVGElement;
    const pt = svg.createSVGPoint();

    const bbox = pinGroup.getBBox();
    pt.x = bbox.x + bbox.width / 2;
    pt.y = bbox.y;

    const screenCTM = pinGroup.getScreenCTM();
    const screenPoint = pt.matrixTransform(screenCTM);

    return { x: screenPoint.x, y: screenPoint.y };
}

// Hilfsfunktion: Titel aus der API -> SVG-ID
function titleToSvgId(title) {
    // Beispiel: "Parkhaus Messe" -> "Parkhaus_Messe"
    return title.replace(/\s+/g, '_');
}

// Funktion: Pins im SVG anhand der Daten aktualisieren (Illustrator-Position bleibt)
function updatePins(data) {
    const mapWrapper = document.querySelector('.map-wrapper');
    if (!mapWrapper) return;

    data.forEach(parkhaus => {
        const svgId = titleToSvgId(parkhaus.title);
        const pinGroup = document.getElementById(svgId);

        if (!pinGroup) {
            console.warn('Kein SVG-Element gefunden für', parkhaus.title, 'mit ID', svgId);
            return;
        }

        const style = getPinStyle(parkhaus.avg_free);

        // Farbe setzen
        const paths = pinGroup.querySelectorAll('path');
        paths.forEach(p => {
            p.style.fill = style.fill;
        });

        pinGroup.style.cursor = 'pointer';

        // Falls es für dieses Parkhaus schon ein Popup-Element gibt, wiederverwenden
        let popup = mapWrapper.querySelector(`.pin-popup[data-title="${parkhaus.title}"]`);
        if (!popup) {
            popup = document.createElement('div');
            popup.className = 'pin-popup hidden';
            popup.dataset.title = parkhaus.title;

            popup.innerHTML = `
                <button class="pin-popup-close">&times;</button>
                <div class="pin-popup-title"></div>
                <div class="pin-popup-text"></div>
            `;
            mapWrapper.appendChild(popup);

            const closeBtn = popup.querySelector('.pin-popup-close');
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                popup.classList.add('hidden');
                pinnedPopups.delete(parkhaus.title);
            });
        }

        const titleEl = popup.querySelector('.pin-popup-title');
        const textEl = popup.querySelector('.pin-popup-text');
        titleEl.textContent = parkhaus.title;
        textEl.textContent = `${parkhaus.avg_free} freie Plätze`;

        function positionPopup() {
            // Im Desktop: Position neben dem Pin
            if (window.innerWidth > 768) {
                const pos = getPinScreenPosition(pinGroup);
                const wrapperRect = mapWrapper.getBoundingClientRect();
        
                const left = pos.x - wrapperRect.left + 8;
                const top = pos.y - wrapperRect.top - 10;
        
                popup.style.left = `${left}px`;
                popup.style.top = `${top}px`;
                popup.style.position = 'absolute';
                popup.style.transform = 'none';
            } else {
                // Im Responsive: zentriert (CSS übernimmt)
                popup.style.position = 'fixed';
                popup.style.left = '50%';
                popup.style.top = '50%';
                popup.style.transform = 'translate(-50%, -50%)';
            }
        }

        // Event-Listener entfernen (falls vorhanden) und neu setzen
        pinGroup.onmouseenter = null;
        pinGroup.onmouseleave = null;
        pinGroup.onclick = null;

        // Desktop: Hover aktivieren
        if (window.innerWidth > 768) {
            pinGroup.onmouseenter = () => {
                if (pinnedPopups.has(parkhaus.title)) {
                    positionPopup();
                    return;
                }
                positionPopup();
                popup.classList.remove('hidden');
            };

            pinGroup.onmouseleave = () => {
                if (pinnedPopups.has(parkhaus.title)) {
                    return;
                }
                popup.classList.add('hidden');
            };
        }

        // Click-Event für BEIDE Modi (Desktop UND Mobile)
        pinGroup.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Im Responsive: zuerst alle anderen Popups schließen
            if (window.innerWidth <= 768) {
                const allPopups = mapWrapper.querySelectorAll('.pin-popup');
                allPopups.forEach(p => {
                    if (p !== popup) {
                        p.classList.add('hidden');
                    }
                });
                pinnedPopups.clear();
            }

            if (pinnedPopups.has(parkhaus.title)) {
                pinnedPopups.delete(parkhaus.title);
                popup.classList.add('hidden');
            } else {
                positionPopup();
                popup.classList.remove('hidden');
                pinnedPopups.add(parkhaus.title);
            }
        };
    });
}


// Funktion: Panel-Text aktualisieren
function updatePanelText() {
    const hourValue = document.getElementById('hour-select').value;
    const weekdayValue = document.getElementById('weekday-select').value;
    
    // Wochentags-Namen
    const weekdayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    
    // Uhrzeit formatieren (z.B. "14" -> "14:00")
    const hourFormatted = hourValue.padStart(2, '0') + ':00';
    
    // Text aktualisieren
    document.getElementById('panel-weekday').textContent = weekdayNames[weekdayValue];
    document.getElementById('panel-hour').textContent = hourFormatted;
}


// Funktion: Ladeindikator anzeigen/verstecken
function toggleLoading(show) {
    const loadingDiv = document.getElementById('loading');
    if (!loadingDiv) return;
    if (show) {
        loadingDiv.classList.remove('hidden');
    } else {
        loadingDiv.classList.add('hidden');
    }
}

// Beim ersten Laden: alle Pins schwarz anzeigen
function initPinsDefault() {
    const mapWrapper = document.querySelector('.map-wrapper');
    if (!mapWrapper) return;

    const svg = mapWrapper.querySelector('svg');
    if (!svg) return;

    // Alle Gruppen durchsuchen, deren ID mit "Parkhaus_" beginnt
    const pinGroups = svg.querySelectorAll('g[id^="Parkhaus_"]');

    pinGroups.forEach(pinGroup => {
        const paths = pinGroup.querySelectorAll('path');
        paths.forEach(p => {
            p.style.fill = '#ffffff'; // schwarz
        });
    });
}

async function loadAndDisplay() {
    const hour = document.getElementById('hour-select').value;
    const weekday = document.getElementById('weekday-select').value;

    // Panel-Text aktualisieren
    updatePanelText();

    // Beim neuen Laden: alle Popups zurücksetzen
    pinnedPopups.clear();
    document.querySelectorAll('.pin-popup').forEach(p => p.classList.add('hidden'));

    toggleLoading(true);
    document.getElementById('data-display').innerHTML = '<p>Laden...</p>';

    const data = await loadAverageData(hour, weekday);

    toggleLoading(false);

    if (data) {
        parkhausData = data;
        updatePins(parkhausData);
        // displayData(data);
    } else {
        document.getElementById('data-display').innerHTML =
            '<p style="color: #ff0000;">Fehler beim Laden der Daten. Bitte versuche es erneut.</p>';
    }
}


// Event-Listener: Button-Klick
document.getElementById('load-button').addEventListener('click', loadAndDisplay);
// Beim ersten Laden: Pins auf Standard (schwarz) setzen
initPinsDefault();


// Optional: Automatisches Laden bei Dropdown-Änderung
// document.getElementById('hour-select').addEventListener('change', loadAndDisplay);
// document.getElementById('weekday-select').addEventListener('change', loadAndDisplay);

// Optional: Daten beim Seitenaufruf laden
// loadAndDisplay();