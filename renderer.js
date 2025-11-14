// Script del renderer process - Gestione aggiornamenti (globale)
// Usa ipcRenderer già dichiarato globalmente in homepage.js
// Non dichiariamo una nuova variabile per evitare conflitti
function getIpcRenderer() {
    return window.ipcRenderer || require('electron').ipcRenderer;
}

// Funzione per ottenere gli elementi del dialog (possono non essere ancora caricati)
function getUpdateElements() {
    const elements = {
        updateDialog: document.getElementById('updateDialog'),
        updateVersion: document.getElementById('updateVersion'),
        downloadProgress: document.getElementById('downloadProgress'),
        progressFill: document.getElementById('progressFill'),
        progressPercent: document.getElementById('progressPercent'),
        downloadBtn: document.getElementById('downloadBtn'),
        installBtn: document.getElementById('installBtn'),
        laterBtn: document.getElementById('laterBtn')
    };
    
    // Debug: verifica che tutti gli elementi esistano
    console.log('[RENDERER] Elementi trovati:', {
        updateDialog: !!elements.updateDialog,
        updateVersion: !!elements.updateVersion,
        downloadProgress: !!elements.downloadProgress,
        progressFill: !!elements.progressFill,
        progressPercent: !!elements.progressPercent,
        downloadBtn: !!elements.downloadBtn,
        installBtn: !!elements.installBtn,
        laterBtn: !!elements.laterBtn
    });
    
    return elements;
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
        console.log('[RENDERER] Click su Scarica Ora');
        elements.downloadBtn.disabled = true;
        elements.downloadBtn.textContent = 'Download in corso... 0%';
        
        // Mostra subito il progresso
        if (elements.downloadProgress) {
            elements.downloadProgress.style.display = 'block';
            console.log('[RENDERER] Progress bar mostrata manualmente');
        } else {
            console.error('[RENDERER] ERRORE: downloadProgress non trovato!');
        }
        
        if (elements.progressFill) {
            elements.progressFill.style.width = '0%';
        }
        
        if (elements.progressPercent) {
            elements.progressPercent.textContent = '0%';
        }
        
        console.log('[RENDERER] Invio richiesta download');
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
    console.log('[RENDERER] Update available ricevuto:', info);
    
    const elements = getUpdateElements();
    if (elements.updateVersion) {
        elements.updateVersion.textContent = info.version;
    }
    
    // Mostra le release notes se disponibili
    const releaseNotesDiv = document.getElementById('updateReleaseNotes');
    const releaseNotesContent = document.getElementById('releaseNotesContent');
    
    console.log('[RENDERER] Release notes div trovato:', !!releaseNotesDiv);
    console.log('[RENDERER] Release notes content trovato:', !!releaseNotesContent);
    console.log('[RENDERER] Release notes presenti:', !!info.releaseNotes);
    console.log('[RENDERER] Release notes valore:', info.releaseNotes);
    
    if (info.releaseNotes && info.releaseNotes.trim()) {
        console.log('[RENDERER] Release notes trovate, lunghezza:', info.releaseNotes.length);
        // Le release notes possono essere HTML o testo semplice
        if (releaseNotesDiv) {
            releaseNotesDiv.style.display = 'block';
            console.log('[RENDERER] Release notes div mostrato');
        } else {
            console.error('[RENDERER] ERRORE: releaseNotesDiv non trovato!');
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
    console.log('[RENDERER] Download progress ricevuto:', percent + '%');
    
    const elements = getUpdateElements();
    
    if (elements.downloadProgress) {
        elements.downloadProgress.style.display = 'block';
        console.log('[RENDERER] Progress bar mostrata');
    } else {
        console.warn('[RENDERER] downloadProgress element non trovato!');
    }
    
    if (elements.progressFill) {
        elements.progressFill.style.width = `${percent}%`;
        console.log('[RENDERER] Progress fill aggiornato a:', percent + '%');
    } else {
        console.warn('[RENDERER] progressFill element non trovato!');
    }
    
    if (elements.progressPercent) {
        elements.progressPercent.textContent = Math.round(percent) + '%';
        console.log('[RENDERER] Progress percent aggiornato');
    } else {
        console.warn('[RENDERER] progressPercent element non trovato!');
    }
    
    // Aggiorna anche il testo del pulsante
    if (elements.downloadBtn) {
        elements.downloadBtn.textContent = `Download in corso... ${Math.round(percent)}%`;
    }
});

// Download completato
getIpcRenderer().on('update-downloaded', () => {
    console.log('[RENDERER] Download completato!');
    const elements = getUpdateElements();
    if (elements.downloadProgress) {
        elements.downloadProgress.style.display = 'none';
    }
    if (elements.downloadBtn) {
        elements.downloadBtn.style.display = 'none';
    }
    if (elements.installBtn) {
        elements.installBtn.style.display = 'block';
        console.log('[RENDERER] Pulsante installa mostrato');
    }
});

// Gestione errori
getIpcRenderer().on('update-error', (event, errorMessage) => {
    console.error('[RENDERER] Errore aggiornamento:', errorMessage);
    alert('Errore durante l\'aggiornamento: ' + errorMessage);
});

