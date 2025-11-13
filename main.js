const { app, BrowserWindow } = require('electron');
const path = require('path');

// Mantieni un riferimento globale alla finestra per evitare che venga chiusa dal garbage collector
let mainWindow;

function createWindow() {
    // Crea la finestra del browser
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        },
        icon: path.join(__dirname, 'assets', 'icon.png')
    });

    // Carica il file index.html dell'app
    mainWindow.loadFile('index.html');

    // Apri gli strumenti di sviluppo (rimuovi in produzione)
    // mainWindow.webContents.openDevTools();

    // Emesso quando la finestra viene chiusa
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

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

