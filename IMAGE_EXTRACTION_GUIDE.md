# Guida all'Estrazione delle Immagini dal PDF

## 🎯 Problema

Alcuni quiz nel PDF contengono riferimenti a immagini (strutture chimiche, grafici, formule) che non vengono estratte automaticamente dal testo.

Esempio:
- **Quiz N°5**: "Il fenobarbital è il composto rappresentato dalla **struttura indicata**"
- **Quiz N°7**: "La cocaina, di cui si riporta la **struttura**"

## ⚠️ Limitazione Tecnica

L'estrazione automatica delle immagini su Windows richiede:
- Visual Studio C++ Build Tools
- Librerie native compilate
- Configurazione complessa

Questo rende difficile una soluzione automatica semplice.

## ✅ Soluzioni Consigliate

### **Soluzione 1: Link al PDF Originale (Più Semplice)**

Nell'applicazione Electron, quando un quiz contiene "struttura indicata" o simili:
1. Mostrare un pulsante "📄 Vedi PDF Originale"
2. Aprire il PDF alla pagina corretta
3. L'utente può vedere l'immagine direttamente nel PDF

**Vantaggi:**
- Nessuna estrazione necessaria
- Sempre aggiornato
- Semplice da implementare

### **Soluzione 2: Estrazione Manuale Selettiva**

Estrarre manualmente solo le immagini più importanti:

1. **Aprire il PDF con Adobe Acrobat Reader**
2. **Usare lo strumento Screenshot** (Win + Shift + S su Windows)
3. **Salvare le immagini** nella cartella `quiz-images/`
4. **Nominare i file**: `quiz_5_structure.png`, `quiz_7_structure.png`, etc.
5. **Aggiornare il JSON** aggiungendo il campo `image`:

```json
{
  "id": 5,
  "question": "Il fenobarbital è il composto rappresentato dalla struttura indicata...",
  "image": "quiz_5_structure.png",
  "answers": [...]
}
```

### **Soluzione 3: Conversione Online**

Usare servizi online per convertire il PDF in immagini:

1. **https://www.ilovepdf.com/pdf_to_jpg**
2. **https://smallpdf.com/pdf-to-jpg**
3. **https://pdf2png.com/**

Poi ritagliare e salvare solo le immagini necessarie.

### **Soluzione 4: Script Python (Consigliata per Estrazione Automatica) ✅**

Python rende l'estrazione molto più semplice! Usa PyMuPDF (fitz).

**Installazione:**

```bash
# Installa Python 3 se non ce l'hai già
# Poi installa PyMuPDF:
pip install PyMuPDF
```

**Esecuzione:**

```bash
python extract_pdf_images.py
```

Lo script ti chiederà:
- **Opzione 1**: Prime 10 pagine (test veloce)
- **Opzione 2**: Prime 100 pagine
- **Opzione 3**: Tutte le 1500 pagine (completo)

Le immagini verranno salvate in `quiz-images/` con metadata JSON.

**Vantaggi:**
- ✅ Nessuna compilazione C++ necessaria
- ✅ Funziona su Windows/Mac/Linux
- ✅ Veloce ed efficiente
- ✅ Estrae immagini in formato originale (PNG/JPEG)

## 📊 Quiz con Immagini

Ecco alcuni quiz che potrebbero contenere immagini:

- **N°5**: Struttura fenobarbital
- **N°7**: Struttura cocaina  
- **N°17**: Struttura naltrexone
- **N°64**: Struttura aminoacido
- **Altri**: Cerca "struttura indicata", "figura", "grafico" nel JSON

## 🔍 Come Trovare i Quiz con Immagini

Esegui questo comando per cercare i quiz che potrebbero avere immagini:

```bash
grep -i "struttura indicata\|figura\|grafico\|riportato in struttura" quiz-data.json
```

## 💡 Raccomandazione

Per un'applicazione quiz funzionale, la **Soluzione 1** (link al PDF) è la più pratica e veloce da implementare.

Le immagini possono essere aggiunte successivamente in modo graduale se necessario.

