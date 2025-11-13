# Quiz App - Applicazione Electron

Un'applicazione desktop per quiz creata con Electron.

## 🚀 Installazione

1. Installa le dipendenze:
```bash
npm install
```

## 💻 Avvio dell'applicazione

Per avviare l'applicazione in modalità sviluppo:

```bash
npm start
```

## 📊 Estrazione Quiz dal PDF

Per estrarre i quiz dal PDF e generare il file JSON:

```bash
npm run extract
```

Questo comando:
- Legge il file PDF "Banca dati unisa farmacia ospedaliera.pdf"
- Estrae domande, risposte e risposte corrette
- Genera il file `quiz-data.json` con tutti i quiz in formato strutturato

## 📁 Struttura del progetto

```
Quiz/
├── main.js                    # Processo principale di Electron
├── preload.js                 # Script di preload per la sicurezza
├── index.html                 # Interfaccia utente principale
├── renderer.js                # Script del renderer process
├── styles.css                 # Stili CSS
├── extractPdfQuiz.js          # Script per estrarre quiz dal PDF
├── quiz-data.json             # Database quiz in formato JSON
├── package.json               # Configurazione del progetto
└── README.md                  # Questo file
```

## 🛠️ Tecnologie utilizzate

- **Electron**: Framework per applicazioni desktop
- **HTML5**: Struttura della UI
- **CSS3**: Styling moderno
- **JavaScript**: Logica dell'applicazione

## 📝 Prossimi passi

- [ ] Implementare la logica del quiz
- [ ] Aggiungere database per le domande
- [ ] Creare sistema di punteggio
- [ ] Aggiungere più categorie di quiz
- [ ] Implementare salvataggio progressi

## 📄 Licenza

MIT

