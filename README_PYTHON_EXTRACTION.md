# 🐍 Estrazione Immagini PDF con Python

## 📖 Panoramica

Questo script Python estrae automaticamente tutte le immagini incorporate nel PDF dei quiz (strutture chimiche, grafici, formule).

## ✅ Vantaggi rispetto a Node.js

- **Nessuna compilazione**: Non richiede Visual Studio C++ Build Tools
- **Semplice**: Installazione in un comando
- **Veloce**: PyMuPDF è molto efficiente
- **Cross-platform**: Funziona su Windows, Mac e Linux
- **Formato originale**: Estrae le immagini nel loro formato originale (PNG, JPEG)

## 🚀 Quick Start

### 1. Installa Python

Se non hai Python installato:
- Windows: https://www.python.org/downloads/
- Durante l'installazione, seleziona "Add Python to PATH"

### 2. Installa PyMuPDF

```bash
pip install PyMuPDF
```

O usa il file requirements.txt:

```bash
pip install -r requirements.txt
```

### 3. Esegui lo Script

```bash
python extract_pdf_images.py
```

## 📊 Modalità di Estrazione

Lo script offre 3 modalità:

### Modalità 1: Test (10 pagine)
Estrae le immagini dalle prime 10 pagine per verificare che tutto funzioni.

```
Tempo stimato: ~10 secondi
Immagini: ~5-10
```

### Modalità 2: Media (100 pagine)
Estrae le prime 100 pagine per avere un buon campione.

```
Tempo stimato: ~1-2 minuti
Immagini: ~50-100
```

### Modalità 3: Completa (1500 pagine)
Estrae tutte le immagini da tutto il PDF.

```
Tempo stimato: ~10-15 minuti
Immagini: ~750-1000
```

## 📁 Output

Le immagini vengono salvate in:

```
quiz-images/
├── page_0001_img_01.png
├── page_0001_img_02.png
├── page_0003_img_01.jpeg
├── ...
└── images-metadata.json
```

### Metadata JSON

Il file `images-metadata.json` contiene informazioni dettagliate:

```json
{
  "total_images": 856,
  "total_pages_processed": 1500,
  "images": [
    {
      "filename": "page_0003_img_01.png",
      "page": 3,
      "image_index": 1,
      "width": 400,
      "height": 300,
      "colorspace": "DeviceRGB",
      "size_bytes": 15240
    }
  ]
}
```

## 🔗 Associare Immagini ai Quiz

Dopo l'estrazione, puoi:

1. **Manuale**: Apri le immagini e identifica a quale quiz appartengono
2. **Automatico**: Usa la posizione della pagina per associarle
   - Pagina 3 = Quiz 5 e 6 (circa)
   - 2 quiz per pagina in media

## 🛠️ Esempio di Integrazione nel JSON

Aggiungi il campo `image` ai quiz:

```json
{
  "id": 5,
  "question": "Il fenobarbital è il composto rappresentato dalla struttura indicata...",
  "image": "page_0003_img_01.png",
  "answers": [...]
}
```

## 🔍 Troubleshooting

### Errore: "pip non riconosciuto"
- Assicurati che Python sia nel PATH
- Usa: `python -m pip install PyMuPDF`

### Errore: "ModuleNotFoundError: No module named 'fitz'"
- PyMuPDF non è installato
- Esegui: `pip install PyMuPDF`

### Nessuna immagine estratta
- Alcune pagine potrebbero non avere immagini
- Prova con modalità 2 o 3 per processare più pagine

## 💡 Suggerimenti

1. **Inizia con Modalità 1** per verificare che funzioni
2. **Controlla le immagini** estratte per qualità
3. **Associa manualmente** le immagini più importanti ai quiz
4. **Considera un database** se hai molte immagini da gestire

## 📝 Note

- Le immagini estratte mantengono il formato originale del PDF
- Alcune immagini potrebbero essere icone o elementi decorativi
- Le strutture chimiche sono solitamente in formato PNG o JPEG
- La dimensione totale delle immagini può essere ~50-200 MB

## 🎯 Prossimi Passi

Dopo aver estratto le immagini:

1. Apri la cartella `quiz-images/`
2. Identifica le immagini utili (strutture chimiche, grafici)
3. Rinomina quelle importanti (es: `fenobarbital_structure.png`)
4. Aggiungi i riferimenti nel file `quiz-data.json`
5. Nell'app Electron, mostra le immagini quando disponibili

