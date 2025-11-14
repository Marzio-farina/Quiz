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
        elements.downloadBtn.textContent = 'Download in corso... 0%';
        
        // Mostra subito il progresso
        if (elements.downloadProgress) {
            elements.downloadProgress.style.display = 'block';
        }
        
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
    const elements = getUpdateElements();
    if (elements.updateVersion) {
        elements.updateVersion.textContent = info.version;
    }
    
    // Mostra le release notes se disponibili
    const releaseNotesDiv = document.getElementById('updateReleaseNotes');
    const releaseNotesContent = document.getElementById('releaseNotesContent');
    
    if (info.releaseNotes && info.releaseNotes.trim()) {
        // Le release notes possono essere HTML o testo semplice
        if (releaseNotesDiv) {
            releaseNotesDiv.style.display = 'block';
        }
        if (releaseNotesContent) {
            // Se sono HTML, inserisci direttamente, altrimenti formatta come testo
            const notes = info.releaseNotes.trim();
            if (notes.startsWith('<')) {
                // È già HTML
                releaseNotesContent.innerHTML = notes;
            } else {
                // Formatta il testo markdown semplice
                // Converti markdown base in HTML
                let html = notes
                    .replace(/### (.*)/g, '<h4>$1</h4>')
                    .replace(/## (.*)/g, '<h3>$1</h3>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>');
                
                // Dividi in paragrafi e liste
                const lines = html.split('\n').filter(line => line.trim());
                let result = '';
                let inList = false;
                
                lines.forEach(line => {
                    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                        if (!inList) {
                            result += '<ul>';
                            inList = true;
                        }
                        result += '<li>' + line.trim().substring(2) + '</li>';
                    } else {
                        if (inList) {
                            result += '</ul>';
                            inList = false;
                        }
                        if (line.trim() && !line.trim().startsWith('<h')) {
                            result += '<p>' + line.trim() + '</p>';
                        } else {
                            result += line;
                        }
                    }
                });
                
                if (inList) {
                    result += '</ul>';
                }
                
                releaseNotesContent.innerHTML = result || '<p>' + notes + '</p>';
            }
        }
    } else {
        if (releaseNotesDiv) {
            releaseNotesDiv.style.display = 'none';
        }
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
        elements.progressPercent.textContent = Math.round(percent) + '%';
    }
    
    // Aggiorna anche il testo del pulsante
    if (elements.downloadBtn) {
        elements.downloadBtn.textContent = `Download in corso... ${Math.round(percent)}%`;
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

