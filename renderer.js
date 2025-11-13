// Script del renderer process

// Mostra le versioni dei componenti
document.getElementById('nodeVersion').textContent = process.versions.node;
document.getElementById('chromeVersion').textContent = process.versions.chrome;
document.getElementById('electronVersion').textContent = process.versions.electron;

// Event listeners per i pulsanti
document.getElementById('startBtn').addEventListener('click', () => {
    alert('Funzionalità Quiz in arrivo!');
    console.log('Pulsante Inizia Quiz cliccato');
});

document.getElementById('settingsBtn').addEventListener('click', () => {
    alert('Pannello Impostazioni in arrivo!');
    console.log('Pulsante Impostazioni cliccato');
});

// Log di conferma caricamento
console.log('Renderer script caricato correttamente');

