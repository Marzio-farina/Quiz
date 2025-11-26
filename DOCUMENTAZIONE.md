# 📚 Documentazione Completa - Quiz App

## 📋 Indice

1. [Panoramica](#panoramica)
2. [Tecnologie Utilizzate](#tecnologie-utilizzate)
3. [Struttura del Progetto](#struttura-del-progetto)
4. [Funzionalità Principali](#funzionalità-principali)
5. [Installazione e Setup](#installazione-e-setup)
6. [Sviluppo](#sviluppo)
7. [Build e Distribuzione](#build-e-distribuzione)
8. [Sistema di Aggiornamenti Automatici](#sistema-di-aggiornamenti-automatici)
9. [Architettura e Componenti](#architettura-e-componenti)
10. [Guida all'Uso](#guida-alluso)
11. [Estrazione Dati dal PDF](#estrazione-dati-dal-pdf)
12. [Troubleshooting](#troubleshooting)
13. [Licenza](#licenza)

---

## 🎯 Panoramica

**Quiz App** è un'applicazione desktop multipiattaforma sviluppata con Electron per la gestione e lo svolgimento di quiz. L'applicazione è progettata specificamente per quiz universitari di Farmacia Ospedaliera, ma può essere facilmente adattata per altri domini.

### Caratteristiche Principali

- ✅ **2990 quiz** estratti da PDF universitario
- ✅ **Modalità Studio** con feedback immediato
- ✅ **Modalità Esame** con timer e valutazione finale
- ✅ **Sistema di statistiche** con grafici interattivi
- ✅ **Filtri avanzati** per categorie e sottocategorie
- ✅ **Tema chiaro/scuro** personalizzabile
- ✅ **Aggiornamenti automatici** via GitHub Releases
- ✅ **Supporto immagini** per quiz con strutture chimiche
- ✅ **Navigazione intuitiva** tra le domande
- ✅ **Salvataggio progressi** in localStorage

### Versione Corrente

**v1.1.5** - Ultima versione stabile

---

## 🛠️ Tecnologie Utilizzate

### Core Technologies

- **Electron 32.0.0** - Framework per applicazioni desktop cross-platform
- **Node.js** - Runtime JavaScript lato server
- **HTML5/CSS3** - Struttura e styling dell'interfaccia
- **JavaScript (ES6+)** - Logica dell'applicazione

### Librerie Principali

- **electron-updater 6.6.2** - Sistema di aggiornamenti automatici
- **electron-log 5.0.1** - Sistema di logging avanzato
- **chart.js 4.5.1** - Grafici interattivi per statistiche
- **pdf-parse 1.1.1** - Estrazione dati da PDF

### Build Tools

- **electron-builder 26.0.12** - Packaging e distribuzione
- **electron-reload 2.0.0** - Hot-reload in sviluppo

### Strumenti Python (Opzionali)

- **PyMuPDF (fitz)** - Estrazione immagini da PDF

---

## 📁 Struttura del Progetto

```
Quiz/
├── assets/
│   └── icon.png                    # Icona dell'applicazione
│
├── pages/                          # Pagine dell'applicazione
│   ├── homepage/                   # Homepage principale
│   │   ├── homepage.html          # Struttura HTML
│   │   ├── homepage.css           # Stili specifici
│   │   └── homepage.js            # Logica homepage (filtri, categorie)
│   │
│   ├── quiz/                       # Pagina quiz
│   │   ├── quiz.html              # Struttura HTML quiz
│   │   ├── quiz.css               # Stili quiz (tema chiaro/scuro)
│   │   └── quiz.js                # Logica quiz (navigazione, risposte, timer)
│   │
│   └── statistics/                 # Pagina statistiche
│       ├── statistics.html        # Struttura HTML statistiche
│       ├── statistics.css        # Stili statistiche
│       └── statistics.js         # Logica statistiche (grafici, calcoli)
│
├── quiz-images/                    # Immagini estratte dal PDF (543 immagini)
│   └── quiz_*.png                 # Immagini associate ai quiz
│
├── dist/                           # Build di distribuzione
│   ├── Quiz App Setup *.exe      # Installer Windows
│   ├── Quiz App *.exe             # Versione portable
│   ├── latest.yml                 # Metadati aggiornamento
│   └── win-unpacked/              # App non compressa
│
├── main.js                         # Processo principale Electron
├── preload.js                      # Script preload (sicurezza)
├── renderer.js                     # Script renderer homepage
├── index.html                      # Entry point applicazione
├── styles.css                      # Stili CSS globali
│
├── quiz-data.json                  # Database quiz (2990 quiz in formato JSON)
│
├── extractPdfQuiz.js               # Script estrazione quiz da PDF
├── extract_pdf_images.py           # Script Python estrazione immagini
├── check_python_setup.py           # Verifica setup Python
├── requirements.txt                # Dipendenze Python
│
├── package.json                    # Configurazione progetto e build
├── package-lock.json               # Lock file dipendenze
│
└── DOCUMENTAZIONE.md               # Questa documentazione
```

---

## ⚡ Funzionalità Principali

### 1. Homepage

La homepage è il punto di ingresso dell'applicazione e offre:

- **Selezione numero domande**: Da 10 a 50 domande
- **Modalità casuale**: Attiva/disattiva selezione random
- **Filtri per categorie**: Selezione multipla di categorie e sottocategorie
- **Contatore quiz disponibili**: Mostra quanti quiz corrispondono ai filtri
- **Tema chiaro/scuro**: Toggle per cambiare tema
- **Navigazione**: Pulsanti per avviare quiz, vedere statistiche, aprire opzioni

### 2. Modalità Quiz

#### Modalità Studio

- **Feedback immediato**: Evidenziazione risposta corretta (verde) e sbagliata (rosso)
- **Navigazione libera**: Possibilità di tornare indietro alle domande precedenti
- **Visualizzazione automatica risposte**: Quando si naviga indietro, le risposte vengono mostrate automaticamente
- **Blocco risposte**: Una volta mostrato il feedback, non è possibile modificare la risposta
- **Dialog immagine ingrandita**: Click su immagini per visualizzarle ingrandite

#### Modalità Esame

- **Timer**: Cronometro che traccia il tempo impiegato
- **Pausa**: Possibilità di mettere in pausa il quiz
- **Valutazione finale**: Calcolo automatico del punteggio
- **Navigazione sequenziale**: Solo avanti, senza possibilità di tornare indietro

### 3. Sistema di Statistiche

- **Grafico performance**: Andamento nel tempo dei punteggi
- **Grafico radar categorie**: Performance per categoria
- **Statistiche aggregate**:
  - Totale quiz completati
  - Punteggio medio
  - Tempo medio per quiz
  - Miglior punteggio
- **Storico completo**: Lista di tutti i quiz completati
- **Reset statistiche**: Possibilità di cancellare tutte le statistiche

### 4. Sistema di Aggiornamenti

- **Controllo automatico**: All'avvio dell'app (non in modalità dev)
- **Notifica aggiornamenti**: Dialog quando è disponibile una nuova versione
- **Release notes**: Visualizzazione delle novità in formato Markdown
- **Download progressivo**: Barra di progresso durante il download
- **Installazione automatica**: Installazione e riavvio al termine del download

### 5. Gestione Immagini

- **Associazione automatica**: Le immagini vengono associate ai quiz tramite ID
- **Visualizzazione ingrandita**: Click su immagini per vederle in un dialog
- **Supporto multi-formato**: PNG, JPG, JPEG

---

## 🚀 Installazione e Setup

### Prerequisiti

- **Node.js** (v16 o superiore)
- **npm** (incluso con Node.js)
- **Git** (per clonare il repository)

### Installazione Dipendenze

```bash
# Clona il repository
git clone https://github.com/Marzio-farina/Quiz.git
cd Quiz

# Installa le dipendenze Node.js
npm install
```

### Setup Python (Opzionale - solo per estrazione immagini)

```bash
# Installa PyMuPDF
pip install PyMuPDF

# Verifica il setup
python check_python_setup.py
```

---

## 💻 Sviluppo

### Avvio in Modalità Sviluppo

```bash
npm start
```

Oppure con hot-reload:

```bash
npm run dev
```

### Struttura Sviluppo

- **main.js**: Processo principale Electron (gestione finestre, IPC, auto-updater)
- **renderer.js**: Script per la homepage (caricamento dati, filtri)
- **pages/homepage/homepage.js**: Logica specifica homepage
- **pages/quiz/quiz.js**: Logica quiz (navigazione, risposte, timer)
- **pages/statistics/statistics.js**: Logica statistiche (grafici, calcoli)

### Comunicazione IPC

L'applicazione usa IPC (Inter-Process Communication) per la comunicazione tra processo principale e renderer:

```javascript
// Dal renderer al main
ipcRenderer.send('load-quiz-page', settings);
ipcRenderer.send('minimize-window');
ipcRenderer.sendSync('get-quiz-data-path');

// Dal main al renderer
mainWindow.webContents.send('start-quiz', quizSettings);
mainWindow.webContents.send('update-available', updateInfo);
```

### Hot Reload

In modalità `--dev`, l'applicazione si ricarica automaticamente quando i file vengono modificati grazie a `electron-reload`.

### DevTools

I DevTools sono abilitati e possono essere aperti con:
- **F12**
- **Ctrl+Shift+I**

---

## 📦 Build e Distribuzione

### Build Locale

```bash
# Build per Windows (NSIS + Portable)
npm run build

# Build specifica per piattaforma
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

### Output Build

I file generati si trovano in `dist/`:

- **Quiz App Setup X.X.X.exe**: Installer Windows (NSIS)
- **Quiz App X.X.X.exe**: Versione portable
- **Quiz App Setup X.X.X.exe.blockmap**: Blockmap per aggiornamenti incrementali
- **latest.yml**: Metadati per auto-updater

### Configurazione Build

La configurazione è in `package.json` nella sezione `build`:

```json
{
  "build": {
    "appId": "com.marzianofarina.quizapp",
    "productName": "Quiz App",
    "publish": {
      "provider": "github",
      "owner": "Marzio-farina",
      "repo": "Quiz"
    },
    "win": {
      "target": ["nsis", "portable"],
      "icon": "assets/icon.png"
    }
  }
}
```

### Preparazione Release GitHub

1. **Aggiorna versione** in `package.json`:
   ```json
   "version": "1.1.6"
   ```

2. **Esegui build**:
   ```bash
   npm run build
   ```

3. **Correggi latest.yml** (se necessario):
   - Verifica che i nomi file usino punti invece di trattini
   - Esempio: `Quiz.App.Setup.1.1.6.exe` invece di `Quiz-App-Setup-1.1.6.exe`

4. **Crea tag Git**:
   ```bash
   git tag v1.1.6
   git push origin v1.1.6
   ```

5. **Crea GitHub Release**:
   - Vai su GitHub → Releases → Draft a new release
   - Tag: `v1.1.6`
   - Titolo: `v1.1.6`
   - Descrizione: Release notes in Markdown
   - Upload: `Quiz App Setup 1.1.6.exe` e `Quiz App 1.1.6.exe`
   - Pubblica la release

6. **Upload latest.yml**:
   - Carica `dist/latest.yml` come asset nella release (opzionale, ma consigliato)

---

## 🔄 Sistema di Aggiornamenti Automatici

### Funzionamento

L'applicazione usa `electron-updater` per controllare e installare aggiornamenti automaticamente.

### Configurazione

```javascript
// main.js
autoUpdater.autoDownload = false;  // Download manuale
autoUpdater.autoInstallOnAppQuit = true;  // Installazione automatica
autoUpdater.requestHeaders = {
    'Cache-Control': 'no-cache'  // Evita cache
};
```

### Flusso Aggiornamento

1. **Controllo automatico**: All'avvio (dopo 3 secondi, non in dev mode)
2. **Notifica disponibilità**: Dialog con versione e release notes
3. **Download manuale**: L'utente clicca "Download Now"
4. **Progresso download**: Barra di progresso con percentuale
5. **Installazione**: Al termine, pulsante "Installa e Riavvia"

### Release Notes

Le release notes vengono estratte da:
1. `info.releaseNotes` (se disponibile)
2. GitHub API (fallback se non disponibili)

### Troubleshooting Aggiornamenti

**Problema**: Aggiornamento non rilevato

**Soluzioni**:
- Verifica che il tag Git corrisponda alla versione
- Verifica che `latest.yml` sia corretto
- Pulisci la cache: `%LOCALAPPDATA%\electron-updater\cache\`

**Problema**: Errore 404 durante download

**Soluzioni**:
- Verifica che i nomi file in `latest.yml` corrispondano a quelli su GitHub
- GitHub rinomina i file con punti invece di trattini
- Correggi manualmente `latest.yml` se necessario

---

## 🏗️ Architettura e Componenti

### Processo Principale (main.js)

Gestisce:
- Creazione e gestione finestre
- Comunicazione IPC
- Auto-updater
- Percorsi file (sviluppo vs produzione)

### Renderer Process

Ogni pagina ha il proprio renderer:
- **Homepage**: Caricamento quiz, filtri, navigazione
- **Quiz**: Logica quiz, timer, navigazione domande
- **Statistiche**: Calcolo statistiche, rendering grafici

### Storage

- **localStorage**: Statistiche, tema, impostazioni
- **File system**: `quiz-data.json` (dati quiz), immagini in `quiz-images/`

### Gestione Tema

Il tema viene salvato in `localStorage` e applicato a tutte le pagine:

```javascript
// Salvataggio
localStorage.setItem('theme', 'dark' | 'light');

// Caricamento
const savedTheme = localStorage.getItem('theme') || 'light';
document.body.classList.add(savedTheme === 'dark' ? 'dark-theme' : '');
```

### Gestione Quiz

I quiz vengono caricati da `quiz-data.json`:

```json
{
  "quizzes": [
    {
      "id": 1,
      "question": "Domanda...",
      "answers": [
        {"letter": "A", "text": "Risposta A"},
        ...
      ],
      "correctAnswer": "A",
      "category": "Categoria",
      "subcategory": "Sottocategoria",
      "image": "quiz_1.png"  // Opzionale
    }
  ]
}
```

### Sistema di Navigazione Quiz

#### Variabili di Stato

```javascript
let isAnswerHighlighted = false;  // Evidenziazione mostrata?
let highlightedQuestions = new Set();  // Domande con feedback mostrato
let lastViewedQuestionIndex = -1;  // Ultima domanda visualizzata
let lastNonDisabledQuestionIndex = -1;  // Ultima domanda ancora modificabile
```

#### Logica Navigazione

- **Avanti**: Mostra feedback → passa alla prossima
- **Indietro**: Se ha risposta → mostra feedback → passa alla precedente
- **Blocco risposte**: Dopo feedback, risposta non modificabile
- **Auto-evidenziazione**: Tornando indietro a domanda non risposta, mostra automaticamente la risposta corretta (se non è l'ultima non disabilitata)

---

## 📖 Guida all'Uso

### Avvio Quiz

1. Seleziona il numero di domande (10-50)
2. (Opzionale) Attiva modalità casuale
3. (Opzionale) Seleziona categorie/sottocategorie
4. Clicca "Avvia Quiz"

### Durante il Quiz

#### Modalità Studio

- **Seleziona risposta**: Click su una risposta
- **Vedi feedback**: Clicca "Prossima →" per vedere se la risposta è corretta
- **Naviga**: Usa "← Precedente" e "Prossima →"
- **Immagine**: Click su immagini per ingrandirle
- **Esci**: Click su "✕" in alto a destra

#### Modalità Esame

- **Timer**: Il timer parte automaticamente
- **Pausa**: Click sul timer per mettere in pausa
- **Navigazione**: Solo avanti, non puoi tornare indietro
- **Termina**: All'ultima domanda, clicca "Termina Quiz"

### Visualizzazione Risultati

Al termine del quiz:
- **Punteggio**: Percentuale di risposte corrette
- **Tempo impiegato**: Tempo totale (esclusa pausa)
- **Dettagli**: Lista domande con risposte corrette/sbagliate
- **Salvataggio**: Le statistiche vengono salvate automaticamente

### Statistiche

- **Grafico performance**: Andamento punteggi nel tempo
- **Grafico radar**: Performance per categoria
- **Storico**: Lista completa quiz completati
- **Reset**: Pulsante per cancellare tutte le statistiche

### Opzioni

- **Tema**: Toggle tra tema chiaro e scuro
- **Controlla aggiornamenti**: Controllo manuale aggiornamenti
- **Versione**: Visualizza versione corrente

---

## 📄 Estrazione Dati dal PDF

### Estrazione Quiz

```bash
npm run extract
```

Questo comando:
1. Legge `Banca dati unisa farmacia ospedaliera.pdf`
2. Estrae domande, risposte e risposte corrette
3. Genera `quiz-data.json` con tutti i quiz

### Estrazione Immagini

#### Metodo Python (Consigliato)

```bash
# Installa PyMuPDF
pip install PyMuPDF

# Estrai immagini
python extract_pdf_images.py
```

Le immagini vengono salvate in `quiz-images/` con nomi `quiz_<id>.png`.

#### Associazione Immagini

Le immagini vengono associate automaticamente ai quiz tramite l'ID del quiz. Il campo `image` nel JSON viene popolato automaticamente se esiste un'immagine corrispondente.

### Formato quiz-data.json

```json
{
  "quizzes": [
    {
      "id": 1,
      "question": "Testo della domanda...",
      "answers": [
        {"letter": "A", "text": "Risposta A"},
        {"letter": "B", "text": "Risposta B"},
        {"letter": "C", "text": "Risposta C"},
        {"letter": "D", "text": "Risposta D"},
        {"letter": "E", "text": "Risposta E"}
      ],
      "correctAnswer": "A",
      "category": "Farmacologia",
      "subcategory": "Farmaci cardiovascolari",
      "image": "quiz_1.png"  // Opzionale
    }
  ]
}
```

---

## 🔧 Troubleshooting

### Problema: Quiz non si caricano

**Causa**: File `quiz-data.json` non trovato o percorso errato

**Soluzione**:
- Verifica che `quiz-data.json` esista nella root del progetto
- In produzione, verifica che sia incluso in `extraResources` in `package.json`
- Controlla i log nella console per errori di percorso

### Problema: Immagini non visualizzate

**Causa**: Percorso immagini errato o immagini non estratte

**Soluzione**:
- Verifica che le immagini siano in `quiz-images/`
- Verifica che il campo `image` nel JSON corrisponda al nome file
- Controlla che il percorso sia corretto (relativo alla root)

### Problema: Statistiche non salvate

**Causa**: localStorage non disponibile o disabilitato

**Soluzione**:
- Verifica che localStorage sia abilitato in Electron
- Controlla i permessi dell'applicazione
- Verifica spazio disponibile su disco

### Problema: Aggiornamenti non funzionano

**Causa**: Cache electron-updater o configurazione errata

**Soluzioni**:
1. Pulisci cache: `%LOCALAPPDATA%\electron-updater\cache\`
2. Verifica tag Git corrisponda alla versione
3. Verifica `latest.yml` sia corretto
4. Verifica che i file su GitHub abbiano nomi corretti

### Problema: Build fallisce

**Causa**: Dipendenze mancanti o configurazione errata

**Soluzione**:
```bash
# Reinstalla dipendenze
rm -rf node_modules package-lock.json
npm install

# Verifica configurazione
npm run build -- --help
```

### Problema: DevTools non si aprono

**Causa**: DevTools disabilitati o shortcut non funzionante

**Soluzione**:
- Verifica che `devTools: true` in `main.js`
- Prova `Ctrl+Shift+I` invece di `F12`
- In produzione, DevTools potrebbero essere disabilitati

---

## 📝 Note di Sviluppo

### Convenzioni Codice

- **Indentazione**: 4 spazi
- **Nomi variabili**: camelCase
- **Nomi funzioni**: camelCase
- **Commenti**: In italiano per spiegazioni, inglese per codice tecnico
- **CSS**: Classi in kebab-case

### Best Practices

- **localStorage**: Usa sempre try-catch per operazioni
- **IPC**: Gestisci sempre errori nelle comunicazioni
- **File system**: Usa percorsi assoluti o IPC per percorsi
- **Errori**: Logga sempre gli errori con `electron-log` o `console.error`

### Performance

- **Lazy loading**: I quiz vengono caricati solo quando necessario
- **Debouncing**: I filtri usano debouncing per evitare troppi calcoli
- **Memoization**: Le statistiche vengono calcolate solo quando necessario

### Sicurezza

- **Node Integration**: Abilitato per semplicità (non per produzione critica)
- **Context Isolation**: Disabilitato (da abilitare in futuro per maggiore sicurezza)
- **CSP**: Content Security Policy configurata in HTML

---

## 📄 Licenza

MIT License

Copyright (c) 2024 Marziano Farina

---

## 👤 Autore

**Marziano Farina**

- GitHub: [@Marzio-farina](https://github.com/Marzio-farina)
- Repository: [Quiz](https://github.com/Marzio-farina/Quiz)

---

## 🙏 Ringraziamenti

- **Electron** - Framework per applicazioni desktop
- **Chart.js** - Libreria per grafici
- **electron-updater** - Sistema di aggiornamenti
- **PyMuPDF** - Estrazione immagini da PDF

---

**Ultima modifica**: 2024-11-14  
**Versione documentazione**: 1.0.0  
**Versione applicazione**: 1.1.5

