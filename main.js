const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const pdf = require('pdf-parse');

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
        
        // Apri automaticamente DevTools in modalità sviluppo
        if (process.argv.includes('--dev') || !process.resourcesPath) {
            mainWindow.webContents.openDevTools();
        }
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

// Gestione IPC per ottenere il percorso del file quiz-data.json
ipcMain.on('get-quiz-data-path', (event) => {
    let dataPath;
    
    // Prova prima con __dirname (sviluppo: root del progetto)
    const devPath = path.join(__dirname, 'quiz-data.json');
    if (fs.existsSync(devPath)) {
        dataPath = devPath;
    } else if (process.resourcesPath) {
        // App distribuita: quiz-data.json è in resources/
        const prodPath = path.join(process.resourcesPath, 'quiz-data.json');
        if (fs.existsSync(prodPath)) {
            dataPath = prodPath;
        } else {
            // Fallback: usa __dirname anche se il file non esiste (per errori più chiari)
            dataPath = devPath;
        }
    } else {
        // Fallback: usa __dirname
        dataPath = devPath;
    }
    
    event.returnValue = dataPath;
});

// Funzione per trovare la pagina di una domanda nel PDF
async function findQuestionPage(pdfPath, questionText) {
    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const pdfData = await pdf(dataBuffer, {
            // Estrai il testo con informazioni sulla pagina
            max: 0 // Estrai tutto il testo
        });
        
        // Normalizza il testo della domanda per la ricerca
        // Usa quasi tutta la domanda per trovare una corrispondenza unica
        const normalizedQuestion = questionText
            .toLowerCase()
            .trim()
            .replace(/[^\w\s]/g, ' ') // Rimuovi punteggiatura
            .replace(/\s+/g, ' '); // Normalizza spazi multipli
        
        // Normalizza anche il testo del PDF
        const totalText = pdfData.text.toLowerCase()
            .replace(/[^\w\s]/g, ' ') // Rimuovi punteggiatura
            .replace(/\s+/g, ' '); // Normalizza spazi multipli
        
        // Usa una porzione significativa della domanda (circa 85-90% del testo)
        // Questo garantisce una corrispondenza unica nel PDF
        const questionLength = normalizedQuestion.length;
        let searchText = '';
        let matchIndex = -1;
        
        // Prova con percentuali crescenti del testo (85%, 90%, 95%, 100%)
        const percentages = [0.85, 0.90, 0.95, 1.0];
        
        for (const pct of percentages) {
            const searchLength = Math.floor(questionLength * pct);
            searchText = normalizedQuestion.substring(0, searchLength).trim();
            
            if (searchText.length < 30) {
                // Se il testo è troppo corto, usa tutto
                searchText = normalizedQuestion;
            }
            
            // Cerca il testo nel PDF
            matchIndex = totalText.indexOf(searchText);
            
            if (matchIndex !== -1) {
                // Verifica quante occorrenze ci sono
                let occurrenceCount = 0;
                let searchPos = matchIndex;
                const occurrences = [];
                
                while (searchPos !== -1 && occurrenceCount < 20) {
                    occurrences.push(searchPos);
                    occurrenceCount++;
                    searchPos = totalText.indexOf(searchText, searchPos + 1);
                }
                
                // Se c'è una sola occorrenza, perfetto!
                if (occurrences.length === 1) {
                    console.log(`Trovata corrispondenza unica con ${(pct * 100).toFixed(0)}% del testo (${searchText.length} caratteri)`);
                    break;
                } else if (occurrences.length > 1) {
                    // Se ci sono più occorrenze, usa la prima (più probabile)
                    console.log(`Trovate ${occurrences.length} occorrenze con ${(pct * 100).toFixed(0)}% del testo, uso la prima`);
                    matchIndex = occurrences[0];
                    break;
                }
            }
        }
        
        // Se ancora non trovato, prova con pattern di parole significative
        if (matchIndex === -1) {
            const words = normalizedQuestion.split(/\s+/).filter(w => w.length > 2);
            const minWords = Math.min(20, Math.floor(words.length * 0.8)); // Almeno l'80% delle parole
            const wordPattern = words.slice(0, minWords).join(' ');
            matchIndex = totalText.indexOf(wordPattern);
            
            if (matchIndex !== -1) {
                console.log(`Trovato con pattern di ${minWords} parole`);
            }
        }
        
        if (matchIndex === -1) {
            console.warn('Testo della domanda non trovato nel PDF, uso pagina 1');
            return 1; // Fallback alla prima pagina
        }
        
        // Calcola la pagina basandosi sulla posizione esatta del testo trovato
        // Usa un algoritmo più preciso considerando che:
        // 1. Le prime pagine potrebbero avere più testo (intestazioni, indici)
        // 2. Le domande potrebbero essere distribuite in modo non uniforme
        // 3. Il testo estratto potrebbe non includere spazi, immagini, formattazione
        const textRatio = matchIndex / totalText.length;
        
        // Calcola la stima base della pagina
        let estimatedPage = Math.floor(textRatio * pdfData.numpages) + 1;
        
        // Applica una correzione non lineare per migliorare la precisione
        // Le prime pagine tendono ad avere più contenuto (intestazioni, indici)
        // quindi la distribuzione non è uniforme
        let correctionFactor = 1.0;
        
        // Se siamo nelle prime pagine, la correzione è minore
        if (estimatedPage < 100) {
            correctionFactor = 1.01;
        } else if (estimatedPage < 500) {
            // Per pagine intermedie, aggiungi un offset più significativo
            // Questo compensa per il fatto che il testo estratto potrebbe essere
            // più denso nelle prime pagine
            correctionFactor = 1.015;
        } else {
            // Per pagine avanzate, la correzione è ancora maggiore
            // perché il testo potrebbe essere meno denso (più spazi, immagini)
            correctionFactor = 1.02;
        }
        
        // Applica la correzione
        estimatedPage = Math.floor(textRatio * pdfData.numpages * correctionFactor) + 1;
        
        // Aggiungi un offset aggiuntivo basato sulla lunghezza media del testo per pagina
        // Se il testo totale è molto lungo rispetto al numero di pagine,
        // significa che le pagine hanno molto testo e potremmo dover aggiustare
        const avgCharsPerPage = totalText.length / pdfData.numpages;
        if (avgCharsPerPage > 2000) {
            // Pagine con molto testo: aggiungi un piccolo offset
            estimatedPage += 1;
        }
        
        // Assicurati che la pagina sia valida
        const finalPage = Math.max(1, Math.min(estimatedPage, pdfData.numpages));
        
        console.log(`Domanda trovata alla posizione ${matchIndex}/${totalText.length} (${(textRatio * 100).toFixed(2)}%), pagina stimata: ${finalPage}/${pdfData.numpages} (correzione: ${correctionFactor})`);
        
        return finalPage;
    } catch (error) {
        console.error('Errore nella ricerca della pagina:', error);
        return 1; // Fallback alla prima pagina
    }
}

// Funzione per aprire un PDF a una pagina specifica su Windows
function openPdfAtPage(pdfPath, pageNumber) {
    return new Promise((resolve, reject) => {
        // Normalizza il percorso (rimuovi encoding URL se presente e frammenti)
        let normalizedPath = pdfPath.replace(/%20/g, ' ').replace(/%23/g, '#');
        // Rimuovi eventuali frammenti esistenti (come #page=...)
        normalizedPath = normalizedPath.split('#')[0];
        
        // Assicurati che il percorso sia assoluto e con backslash per Windows
        const absolutePath = path.resolve(normalizedPath);
        
        // Verifica che il file esista
        if (!fs.existsSync(absolutePath)) {
            reject(new Error(`File non trovato: ${absolutePath}`));
            return;
        }
        
        // Prova diversi visualizzatori PDF comuni su Windows
        // SumatraPDF (molto comune e affidabile) - usa percorso con backslash
        const sumatraPath = `"C:\\Program Files\\SumatraPDF\\SumatraPDF.exe"`;
        const sumatraCommand = `${sumatraPath} -page ${pageNumber} "${absolutePath}"`;
        
        // Adobe Acrobat Reader - usa percorso con backslash
        const adobePath1 = `"C:\\Program Files\\Adobe\\Acrobat DC\\Acrobat\\Acrobat.exe"`;
        const adobePath2 = `"C:\\Program Files (x86)\\Adobe\\Acrobat Reader DC\\Reader\\AcroRd32.exe"`;
        const adobeCommand1 = `${adobePath1} /A "page=${pageNumber}" "${absolutePath}"`;
        const adobeCommand2 = `${adobePath2} /A "page=${pageNumber}" "${absolutePath}"`;
        
        // Edge con frammento URL - converti backslash in slash per URL
        const edgeUrlPath = absolutePath.replace(/\\/g, '/').replace(/ /g, '%20');
        const edgePath = `file:///${edgeUrlPath}#page=${pageNumber}`;
        const edgeCommand = `start msedge "${edgePath}"`;
        
        // Chrome con frammento URL
        const chromePath = `file:///${edgeUrlPath}#page=${pageNumber}`;
        const chromeCommand = `start chrome "${chromePath}"`;
        
        // Fallback: apri normalmente con shell.openPath
        const fallbackCommand = () => {
            shell.openPath(absolutePath).then(() => {
                console.log(`PDF aperto normalmente (senza numero pagina): ${absolutePath}`);
                resolve();
            }).catch(reject);
        };
        
        // Prova SumatraPDF per primo (più affidabile per i parametri pagina)
        exec(sumatraCommand, { timeout: 5000 }, (error) => {
            if (!error) {
                console.log(`PDF aperto con SumatraPDF alla pagina ${pageNumber}`);
                resolve();
                return;
            }
            
            // Se fallisce, prova Adobe Reader
            exec(adobeCommand1, { timeout: 5000 }, (error2) => {
                if (!error2) {
                    console.log(`PDF aperto con Adobe Reader alla pagina ${pageNumber}`);
                    resolve();
                    return;
                }
                
                exec(adobeCommand2, { timeout: 5000 }, (error3) => {
                    if (!error3) {
                        console.log(`PDF aperto con Adobe Reader (x86) alla pagina ${pageNumber}`);
                        resolve();
                        return;
                    }
                    
                    // Se fallisce, prova Edge
                    exec(edgeCommand, { timeout: 5000 }, (error4) => {
                        if (!error4) {
                            console.log(`PDF aperto con Edge alla pagina ${pageNumber}`);
                            resolve();
                            return;
                        }
                        
                        // Se fallisce, prova Chrome
                        exec(chromeCommand, { timeout: 5000 }, (error5) => {
                            if (!error5) {
                                console.log(`PDF aperto con Chrome alla pagina ${pageNumber}`);
                                resolve();
                                return;
                            }
                            
                            // Fallback: apri normalmente senza numero pagina
                            console.warn('Nessun visualizzatore PDF con supporto pagina trovato, apro normalmente');
                            fallbackCommand();
                        });
                    });
                });
            });
        });
    });
}

// Gestione IPC per aprire un file PDF
ipcMain.on('open-pdf', async (event, pdfFileName, questionText) => {
    try {
        // Il PDF principale è nella root, gli altri sono in "Ulteriori quiz"
        const isMainPdf = pdfFileName === 'Banca dati unisa farmacia ospedaliera.pdf';
        
        let pdfPath = null;
        
        if (isMainPdf) {
            // PDF principale: cerca nella root
            const devPath = path.join(__dirname, pdfFileName);
            const prodPath = process.resourcesPath 
                ? path.join(process.resourcesPath, pdfFileName)
                : devPath;
            
            // Prova prima sviluppo, poi produzione
            if (fs.existsSync(devPath)) {
                pdfPath = devPath;
            } else if (fs.existsSync(prodPath)) {
                pdfPath = prodPath;
            }
        } else {
            // Altri PDF: cerca in "Ulteriori quiz"
            const devPath = path.join(__dirname, 'Ulteriori quiz', pdfFileName);
            const prodPath = process.resourcesPath 
                ? path.join(process.resourcesPath, 'Ulteriori quiz', pdfFileName)
                : devPath;
            
            // Prova prima sviluppo, poi produzione
            if (fs.existsSync(devPath)) {
                pdfPath = devPath;
            } else if (fs.existsSync(prodPath)) {
                pdfPath = prodPath;
            }
        }
        
        if (!pdfPath || !fs.existsSync(pdfPath)) {
            const errorMsg = `File PDF non trovato: ${pdfFileName}`;
            console.error(errorMsg);
            event.reply('pdf-open-error', errorMsg);
            return;
        }
        
        // Se abbiamo il testo della domanda, cerca la pagina
        let pageNumber = 1;
        if (questionText) {
            try {
                pageNumber = await findQuestionPage(pdfPath, questionText);
                console.log(`Trovata pagina stimata: ${pageNumber} per la domanda`);
            } catch (pageError) {
                console.warn('Errore nella ricerca della pagina, uso pagina 1:', pageError);
            }
        }
        
        // Apri il PDF alla pagina specifica
        if (process.platform === 'win32') {
            try {
                await openPdfAtPage(pdfPath, pageNumber);
                console.log(`PDF aperto alla pagina ${pageNumber}: ${pdfPath}`);
            } catch (openError) {
                console.error('Errore nell\'apertura del PDF con pagina:', openError);
                // Fallback: apri senza numero pagina
                shell.openPath(pdfPath).then(() => {
                    console.log(`PDF aperto normalmente (fallback): ${pdfPath}`);
                }).catch(err => {
                    console.error(`Errore nell'apertura del PDF: ${err}`);
                    event.reply('pdf-open-error', err.message);
                });
            }
        } else {
            // Per altri sistemi operativi, apri normalmente
            shell.openPath(pdfPath).then(() => {
                console.log(`PDF aperto: ${pdfPath}`);
            }).catch(err => {
                console.error(`Errore nell'apertura del PDF: ${err}`);
                event.reply('pdf-open-error', err.message);
            });
        }
    } catch (error) {
        console.error('Errore nell\'apertura del PDF:', error);
        event.reply('pdf-open-error', error.message);
    }
});

// Configurazione auto-updater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Disabilita la cache per forzare il download del latest.yml aggiornato
// Questo risolve il problema quando GitHub rinomina i file (trattini -> punti)
autoUpdater.requestHeaders = {
    'Cache-Control': 'no-cache'
};

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

