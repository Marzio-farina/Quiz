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

## 🖼️ Estrazione Immagini dal PDF (Opzionale)

Alcuni quiz contengono strutture chimiche e grafici. Per estrarli:

### Metodo Python (Consigliato) ✅

```bash
# 1. Installa PyMuPDF
pip install PyMuPDF

# 2. Verifica il setup
python check_python_setup.py

# 3. Estrai le immagini
python extract_pdf_images.py
```

**Vantaggi:**
- ✅ Nessuna compilazione C++ necessaria
- ✅ Funziona su tutti i sistemi operativi
- ✅ Veloce ed efficiente

Le immagini verranno salvate in `quiz-images/`

📖 Guida dettagliata: [README_PYTHON_EXTRACTION.md](README_PYTHON_EXTRACTION.md)

## 📁 Struttura del progetto

```
Quiz/
├── main.js                         # Processo principale di Electron
├── preload.js                      # Script di preload per la sicurezza
├── index.html                      # Interfaccia utente principale
├── renderer.js                     # Script del renderer process
├── styles.css                      # Stili CSS
├── extractPdfQuiz.js               # Script Node.js per estrarre quiz dal PDF
├── extract_pdf_images.py           # Script Python per estrarre immagini
├── check_python_setup.py           # Script per verificare setup Python
├── requirements.txt                # Dipendenze Python
├── quiz-data.json                  # Database quiz in formato JSON
├── quiz-images/                    # Immagini estratte (opzionale)
├── package.json                    # Configurazione del progetto
├── README.md                       # Questo file
├── README_PYTHON_EXTRACTION.md     # Guida estrazione immagini
└── IMAGE_EXTRACTION_GUIDE.md       # Guida completa alle immagini
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

