# 📖 Guida all'Estrazione Testo da PDF Scansionati con OCR

Questo script Python estrae testo da PDF scansionati (immagini) usando OCR (Optical Character Recognition).

## 🚀 Quick Start

### 1. Installa Python

Se non hai Python installato:
- **Windows**: https://www.python.org/downloads/
- Durante l'installazione, seleziona **"Add Python to PATH"**

### 2. Installa le Dipendenze Python

```bash
pip install -r requirements.txt
```

Oppure manualmente:
```bash
pip install pdf2image pytesseract Pillow
```

### 3. Installa Tesseract OCR

Tesseract è il motore OCR che riconosce il testo nelle immagini.

#### Windows:
1. Scarica l'installer da: https://github.com/UB-Mannheim/tesseract/wiki
2. Installa Tesseract (default: `C:\Program Files\Tesseract-OCR`)
3. Durante l'installazione, seleziona anche il pacchetto **"Italian"** per il riconoscimento dell'italiano
4. (Opzionale) Aggiungi Tesseract al PATH di sistema

#### Mac:
```bash
brew install tesseract
brew install tesseract-lang  # Per supporto multilingua
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
sudo apt-get install tesseract-ocr-ita  # Per italiano
sudo apt-get install tesseract-ocr-eng   # Per inglese
```

### 4. Installa Poppler

Poppler è necessario per convertire PDF in immagini.

#### Windows:
1. Scarica da: https://github.com/oschwartz10612/poppler-windows/releases
2. Estrai l'archivio in una cartella (es: `C:\poppler`)
3. Aggiungi `C:\poppler\Library\bin` al PATH di sistema

**Alternativa Windows (più semplice):**
```bash
# Usa conda per installare poppler
conda install -c conda-forge poppler
```

#### Mac:
```bash
brew install poppler
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt-get install poppler-utils
```

### 5. Esegui lo Script

```bash
python extract_text_from_pdf_ocr.py
```

## ⚙️ Configurazione

### Modificare il Percorso del PDF

Apri `extract_text_from_pdf_ocr.py` e modifica:

```python
PDF_PATH = os.path.join("Ulteriori quiz", "ssfo-quiz-modello3.pdf")
OUTPUT_TEXT_FILE = os.path.join("Ulteriori quiz", "ssfo-quiz-modello3.txt")
```

### Modificare la Lingua OCR

Per cambiare la lingua, modifica:

```python
OCR_LANG = 'ita+eng'  # Italiano + Inglese
```

Lingue disponibili:
- `'ita'` - Solo italiano
- `'eng'` - Solo inglese
- `'ita+eng'` - Italiano + Inglese (consigliato)
- `'fra'` - Francese
- `'deu'` - Tedesco
- `'spa'` - Spagnolo
- E altre... (vedi: `tesseract --list-langs`)

### Modificare la Risoluzione

Per migliorare la qualità (ma più lento):

```python
dpi=400  # o 600 per massima qualità
```

## 🔧 Risoluzione Problemi

### Errore: "Tesseract not found"

**Windows:**
1. Verifica che Tesseract sia installato in `C:\Program Files\Tesseract-OCR`
2. Se installato altrove, decommenta e modifica questa riga in `extract_text_from_pdf_ocr.py`:
   ```python
   pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
   ```

**Mac/Linux:**
- Verifica che Tesseract sia nel PATH: `which tesseract`
- Se non lo è, aggiungi al PATH o specifica il percorso completo

### Errore: "poppler not found" o "pdf2image error"

**Windows:**
1. Verifica che poppler sia installato e nel PATH
2. Oppure usa conda: `conda install -c conda-forge poppler`

**Mac:**
- Verifica: `which pdftoppm`
- Se non trovato: `brew install poppler`

**Linux:**
- Installa: `sudo apt-get install poppler-utils`

### OCR di Bassa Qualità

1. **Aumenta il DPI:**
   ```python
   dpi=400  # o 600
   ```

2. **Pre-elabora le immagini** (opzionale):
   - Converti in scala di grigi
   - Applica filtri per migliorare il contrasto
   - Rimuovi il rumore

3. **Verifica la qualità del PDF originale:**
   - PDF a bassa risoluzione producono risultati peggiori

### Testo Mancante o Errato

1. **Verifica che la lingua sia corretta:**
   - Usa `'ita+eng'` per testo misto italiano/inglese

2. **Controlla manualmente il file di output:**
   - L'OCR non è perfetto, potrebbe richiedere correzioni manuali

3. **Prova con DPI più alto:**
   - 300 DPI è un buon compromesso
   - 400-600 DPI per massima qualità (ma più lento)

## 📊 Prestazioni

- **Tempo stimato:** ~10-30 secondi per pagina (dipende da DPI e dimensione)
- **Per un PDF di 90 pagine:** ~15-45 minuti
- **Memoria:** ~100-200 MB per pagina (dipende da DPI)

## 💡 Suggerimenti

1. **Per PDF grandi:** Inizia con poche pagine per testare
2. **Per migliori risultati:** Usa DPI 400-600 per PDF di qualità media/bassa
3. **Per velocità:** Usa DPI 300 e thread_count=4 (già configurato)
4. **Verifica sempre:** Controlla manualmente il testo estratto per errori comuni

## 🔗 Link Utili

- **Tesseract OCR:** https://github.com/tesseract-ocr/tesseract
- **pdf2image:** https://github.com/Belval/pdf2image
- **pytesseract:** https://github.com/madmaze/pytesseract
- **Poppler:** https://poppler.freedesktop.org/

## 📝 Note

- L'OCR non è perfetto al 100%, potrebbe richiedere correzioni manuali
- La qualità dipende molto dalla qualità del PDF originale
- PDF con testo già selezionabile non necessitano OCR (usa `pdf-parse` invece)

