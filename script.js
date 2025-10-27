//Daten von API laden
async function loadData() {
    const url = 'https://im3.potterai.ch/backend/api/unload.php'; // mit korrekter API-URL ersetzen
    try {
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error(error);
        return false;
    }
}
const data = await loadData();

console.log(data); // gibt die Daten der API oder false in der Konsole aus
