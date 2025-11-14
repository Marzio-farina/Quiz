// Script del renderer process - Gestione aggiornamenti (globale)
// Usa ipcRenderer già dichiarato globalmente in homepage.js
// Non dichiariamo una nuova variabile per evitare conflitti
function getIpcRenderer() {
    return window.ipcRenderer || require('electron').ipcRenderer;
}

// Funzione per ottenere gli elementi del dialog (possono non essere ancora caricati)
function getUpdateElements() {
    return {
        updateDialog: document.getElementById('updateDialog'),
        updateVersion: document.getElementById('updateVersion'),
        downloadProgress: document.getElementById('downloadProgress'),
        progressFill: document.getElementById('progressFill'),
        progressPercent: document.getElementById('progressPercent'),
        downloadBtn: document.getElementById('downloadBtn'),
        installBtn: document.getElementById('installBtn'),
        laterBtn: document.getElementById('laterBtn')
    };
}

// Inizializza gli event listener quando il DOM è pronto
function initUpdateHandlers() {
    const elements = getUpdateElements();
    
    if (!elements.updateDialog || !elements.downloadBtn || !elements.installBtn || !elements.laterBtn) {
        // Se gli elementi non sono ancora disponibili, riprova dopo un breve delay
        setTimeout(initUpdateHandlers, 100);
        return;
    }

    // Pulsante "Scarica Ora"
    elements.downloadBtn.addEventListener('click', () => {
        elements.downloadBtn.disabled = true;
        elements.downloadBtn.textContent = 'Download in corso...';
        getIpcRenderer().send('download-update');
    });

    // Pulsante "Installa e Riavvia"
    elements.installBtn.addEventListener('click', () => {
        getIpcRenderer().send('install-update');
    });

    // Pulsante "Più tardi"
    elements.laterBtn.addEventListener('click', () => {
        if (elements.updateDialog) {
            elements.updateDialog.style.display = 'none';
            document.body.classList.remove('dialog-open');
        }
    });
}

// Avvia l'inizializzazione quando il DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUpdateHandlers);
} else {
    initUpdateHandlers();
}

// Quando c'è un aggiornamento disponibile
getIpcRenderer().on('update-available', (event, info) => {
    console.log('📦 Nuova versione disponibile:', info.version);
    const elements = getUpdateElements();
    if (elements.updateVersion) {
        elements.updateVersion.textContent = info.version;
    }
    if (elements.updateDialog) {
        elements.updateDialog.style.display = 'flex';
        document.body.classList.add('dialog-open');
    }
});

// Progresso download
getIpcRenderer().on('download-progress', (event, percent) => {
    const elements = getUpdateElements();
    if (elements.downloadProgress) {
        elements.downloadProgress.style.display = 'block';
    }
    if (elements.progressFill) {
        elements.progressFill.style.width = `${percent}%`;
    }
    if (elements.progressPercent) {
        elements.progressPercent.textContent = Math.round(percent);
    }
});

// Download completato
getIpcRenderer().on('update-downloaded', () => {
    const elements = getUpdateElements();
    if (elements.downloadProgress) {
        elements.downloadProgress.style.display = 'none';
    }
    if (elements.downloadBtn) {
        elements.downloadBtn.style.display = 'none';
    }
    if (elements.installBtn) {
        elements.installBtn.style.display = 'block';
    }
});

