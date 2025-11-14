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
            contextIsolation: false
        },
        icon: path.join(__dirname, 'assets', 'icon.png')
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

// Eventi auto-updater
autoUpdater.on('update-available', (info) => {
    autoUpdater.logger.info('Aggiornamento disponibile:', info.version);
    autoUpdater.logger.info('Release notes:', info.releaseNotes);
    autoUpdater.logger.info('Info completo:', JSON.stringify(info, null, 2));
    
    // Estrai le release notes - possono essere in diversi formati
    let releaseNotes = null;
    if (info.releaseNotes) {
        // Se è una stringa, usala direttamente
        if (typeof info.releaseNotes === 'string') {
            releaseNotes = info.releaseNotes;
        } 
        // Se è un oggetto con una proprietà 'content' o 'body'
        else if (info.releaseNotes.content) {
            releaseNotes = info.releaseNotes.content;
        } else if (info.releaseNotes.body) {
            releaseNotes = info.releaseNotes.body;
        }
    }
    
    if (mainWindow) {
        mainWindow.webContents.send('update-available', {
            version: info.version,
            releaseNotes: releaseNotes,
            releaseDate: info.releaseDate
        });
    }
});

autoUpdater.on('update-not-available', (info) => {
    autoUpdater.logger.info('Nessun aggiornamento disponibile. Versione corrente:', info.version);
});

autoUpdater.on('download-progress', (progressObj) => {
    autoUpdater.logger.info('Progresso download:', Math.round(progressObj.percent) + '%');
    if (mainWindow) {
        mainWindow.webContents.send('download-progress', progressObj.percent);
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
    autoUpdater.downloadUpdate();
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

