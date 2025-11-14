const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

// Abilita hot-reload in modalità sviluppo
if (process.argv.includes('--dev')) {
    const electronPath = process.platform === 'win32' 
        ? path.join(__dirname, 'node_modules', 'electron', 'dist', 'electron.exe')
        : path.join(__dirname, 'node_modules', 'electron', 'dist', 'electron');
    
    require('electron-reload')(__dirname, {
        electron: electronPath,
        hardResetMethod: 'exit'
    });
}

// Mantieni un riferimento globale alla finestra per evitare che venga chiusa dal garbage collector
let mainWindow;
let quizSettings = null;

function createWindow() {
    // Rimuovi completamente il menu dall'applicazione
    Menu.setApplicationMenu(null);
    
    // Crea la finestra del browser
    mainWindow = new BrowserWindow({
        width: 900,
        height: 800,
        minWidth: 375, // Larghezza minima iPhone SE (2020/2022)
        minHeight: 810, // Altezza minima per evitare scroll (header + content + footer)
        maxWidth: 900, // Larghezza massima (dimensione del container originale)
        frame: false, // Rimuove la barra del titolo e i controlli nativi
        transparent: false,
        backgroundColor: '#667eea',
        roundedCorners: true, // Abilita i bordi arrotondati su Windows 11
        hasShadow: true, // Abilita l'ombra della finestra per enfatizzare i bordi
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            devTools: true // Abilita DevTools
        },
        icon: path.join(__dirname, 'assets', 'icon.png')
    });
    
    // Abilita DevTools con tasto di scelta rapida (F12 o Ctrl+Shift+I)
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
            if (mainWindow.webContents.isDevToolsOpened()) {
                mainWindow.webContents.closeDevTools();
            } else {
                mainWindow.webContents.openDevTools();
            }
        }
    });

    // Carica il file index.html dell'app
    mainWindow.loadFile('index.html');

    // Funzione per inviare la versione
    function sendAppVersion() {
        try {
            const packagePath = path.join(__dirname, 'package.json');
            const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            const appVersion = packageData.version || '1.0.0';
            mainWindow.webContents.send('app-version', appVersion);
        } catch (error) {
            mainWindow.webContents.send('app-version', '1.0.0');
        }
    }

    // Invia la versione quando la pagina è caricata
    mainWindow.webContents.once('did-finish-load', () => {
        // Aspetta un po' per permettere alla homepage di caricarsi
        setTimeout(() => {
            sendAppVersion();
        }, 100);
    });

    // IPC handler per richiedere la versione
    ipcMain.on('request-app-version', () => {
        sendAppVersion();
    });

    // Emesso quando la finestra viene chiusa
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

// Gestione IPC per caricare la pagina quiz
ipcMain.on('load-quiz-page', (event, settings) => {
    quizSettings = settings;
    mainWindow.loadFile('pages/quiz/quiz.html');
    
    // Quando la pagina quiz è caricata, invia le impostazioni
    mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.webContents.send('start-quiz', quizSettings);
    });
});

// Gestione IPC per minimizzare la finestra
ipcMain.on('minimize-window', () => {
    if (mainWindow) {
        mainWindow.minimize();
    }
});

// Configurazione auto-updater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Configurazione per il debug
try {
    const log = require('electron-log');
    autoUpdater.logger = log;
    autoUpdater.logger.transports.file.level = 'info';
    autoUpdater.logger.transports.console.level = 'info';
} catch (e) {
    // Se electron-log non è disponibile, usa console normale
    autoUpdater.logger = {
        info: (...args) => console.log('[AUTO-UPDATER]', ...args),
        error: (...args) => console.error('[AUTO-UPDATER ERROR]', ...args),
        warn: (...args) => console.warn('[AUTO-UPDATER WARN]', ...args)
    };
}

// Funzione per recuperare le release notes da GitHub se non sono disponibili
async function fetchReleaseNotesFromGitHub(version) {
    try {
        const https = require('https');
        const url = `https://api.github.com/repos/Marzio-farina/Quiz/releases/tags/v${version}`;
        
        return new Promise((resolve, reject) => {
            https.get(url, {
                headers: {
                    'User-Agent': 'Quiz-App-Updater'
                }
            }, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const release = JSON.parse(data);
                        resolve(release.body || null);
                    } catch (e) {
                        reject(e);
                    }
                });
            }).on('error', reject);
        });
    } catch (error) {
        autoUpdater.logger.error('Errore nel recupero release notes da GitHub:', error);
        return null;
    }
}

// Eventi auto-updater
autoUpdater.on('update-available', async (info) => {
    autoUpdater.logger.info('=== AGGIORNAMENTO DISPONIBILE ===');
    autoUpdater.logger.info('Versione:', info.version);
    autoUpdater.logger.info('Tipo releaseNotes:', typeof info.releaseNotes);
    autoUpdater.logger.info('Release notes raw:', info.releaseNotes);
    autoUpdater.logger.info('Info completo:', JSON.stringify(info, null, 2));
    
    // Estrai le release notes - possono essere in diversi formati
    let releaseNotes = null;
    if (info.releaseNotes) {
        // Se è una stringa, usala direttamente
        if (typeof info.releaseNotes === 'string') {
            releaseNotes = info.releaseNotes;
            autoUpdater.logger.info('Release notes estratte (stringa):', releaseNotes.substring(0, 200));
        } 
        // Se è un oggetto con una proprietà 'content' o 'body'
        else if (info.releaseNotes.content) {
            releaseNotes = info.releaseNotes.content;
            autoUpdater.logger.info('Release notes estratte (content):', releaseNotes.substring(0, 200));
        } else if (info.releaseNotes.body) {
            releaseNotes = info.releaseNotes.body;
            autoUpdater.logger.info('Release notes estratte (body):', releaseNotes.substring(0, 200));
        } else {
            autoUpdater.logger.warn('Release notes non in formato riconosciuto:', Object.keys(info.releaseNotes));
        }
    } else {
        autoUpdater.logger.warn('Nessuna release notes trovata in info, provo a recuperarle da GitHub...');
        // Prova a recuperarle direttamente da GitHub
        releaseNotes = await fetchReleaseNotesFromGitHub(info.version);
        if (releaseNotes) {
            autoUpdater.logger.info('Release notes recuperate da GitHub:', releaseNotes.substring(0, 200));
        } else {
            autoUpdater.logger.warn('Impossibile recuperare release notes da GitHub');
        }
    }
    
    const updateInfo = {
        version: info.version,
        releaseNotes: releaseNotes,
        releaseDate: info.releaseDate
    };
    
    autoUpdater.logger.info('Invio al renderer:', JSON.stringify(updateInfo, null, 2));
    
    if (mainWindow) {
        mainWindow.webContents.send('update-available', updateInfo);
    }
});

autoUpdater.on('update-not-available', (info) => {
    autoUpdater.logger.info('Nessun aggiornamento disponibile. Versione corrente:', info.version);
});

autoUpdater.on('download-progress', (progressObj) => {
    const percent = progressObj.percent || 0;
    const percentRounded = Math.round(percent);
    
    autoUpdater.logger.info('=== PROGRESSO DOWNLOAD ===');
    autoUpdater.logger.info('Percentuale raw:', percent);
    autoUpdater.logger.info('Percentuale arrotondata:', percentRounded + '%');
    autoUpdater.logger.info('Bytes per secondo:', progressObj.bytesPerSecond);
    autoUpdater.logger.info('Totale:', progressObj.total);
    autoUpdater.logger.info('Trasferiti:', progressObj.transferred);
    autoUpdater.logger.info('ProgressObj completo:', JSON.stringify(progressObj, null, 2));
    
    if (mainWindow && !mainWindow.isDestroyed()) {
        autoUpdater.logger.info('Invio progresso al renderer:', percentRounded);
        mainWindow.webContents.send('download-progress', percentRounded);
    } else {
        autoUpdater.logger.warn('MainWindow non disponibile per inviare progresso');
    }
});

autoUpdater.on('update-downloaded', () => {
    autoUpdater.logger.info('Aggiornamento scaricato');
    if (mainWindow) {
        mainWindow.webContents.send('update-downloaded');
    }
});

autoUpdater.on('error', (err) => {
    autoUpdater.logger.error('Errore aggiornamento:', err);
    // Invia l'errore al renderer per debug
    if (mainWindow) {
        mainWindow.webContents.send('update-error', err.message);
    }
});

autoUpdater.on('checking-for-update', () => {
    autoUpdater.logger.info('Controllo aggiornamenti in corso...');
});

// IPC per scaricare l'aggiornamento
ipcMain.on('download-update', () => {
    autoUpdater.logger.info('=== RICHIESTA DOWNLOAD AGGIORNAMENTO ===');
    autoUpdater.logger.info('Avvio download...');
    try {
        autoUpdater.downloadUpdate();
        autoUpdater.logger.info('Download avviato con successo');
    } catch (error) {
        autoUpdater.logger.error('Errore nell\'avvio del download:', error);
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('update-error', error.message);
        }
    }
});

// IPC per installare e riavviare
ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall();
});

// IPC per controllare manualmente gli aggiornamenti
ipcMain.on('check-for-updates', () => {
    if (!process.argv.includes('--dev')) {
        autoUpdater.logger.info('Controllo manuale aggiornamenti richiesto');
        autoUpdater.checkForUpdates().catch(err => {
            autoUpdater.logger.error('Errore nel controllo manuale aggiornamenti:', err);
            if (mainWindow) {
                mainWindow.webContents.send('update-error', err.message);
            }
        });
    }
});

// IPC per aprire DevTools
ipcMain.on('open-devtools', () => {
    if (mainWindow) {
        mainWindow.webContents.openDevTools();
    }
});

// Questo metodo verrà chiamato quando Electron avrà finito
// l'inizializzazione ed è pronto per creare le finestre del browser
app.whenReady().then(() => {
    createWindow();

    // Controlla aggiornamenti dopo 3 secondi (non in modalità dev)
    if (!process.argv.includes('--dev')) {
        setTimeout(() => {
            autoUpdater.logger.info('Avvio controllo aggiornamenti...');
            autoUpdater.checkForUpdates().catch(err => {
                autoUpdater.logger.error('Errore nel controllo aggiornamenti:', err);
            });
        }, 3000);
    }

    // Su macOS è comune ricreare una finestra nell'app quando
    // l'icona del dock viene cliccata e non ci sono altre finestre aperte
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Esci quando tutte le finestre sono chiuse, eccetto su macOS
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

