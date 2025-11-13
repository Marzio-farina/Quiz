const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

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
    // Crea la finestra del browser
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, 'assets', 'icon.png')
    });

    // Carica il file index.html dell'app
    mainWindow.loadFile('index.html');

    // Apri gli strumenti di sviluppo in modalità sviluppo
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }

    // Emesso quando la finestra viene chiusa
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

// Gestione IPC per caricare la pagina quiz
ipcMain.on('load-quiz-page', (event, settings) => {
    console.log('Caricamento pagina quiz con impostazioni:', settings);
    quizSettings = settings;
    mainWindow.loadFile('pages/quiz.html');
    
    // Quando la pagina quiz è caricata, invia le impostazioni
    mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.webContents.send('start-quiz', quizSettings);
    });
});

// Questo metodo verrà chiamato quando Electron avrà finito
// l'inizializzazione ed è pronto per creare le finestre del browser
app.whenReady().then(() => {
    createWindow();

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

