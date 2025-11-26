# Nuovo File JSON Quiz - ssfo-quiz-modello2.pdf

## 📄 File Generato

**File:** `new-quiz-data.json`

Questo file contiene **70 domande** estratte dal PDF `ssfo-quiz-modello2.pdf`.

## ✅ Stato Attuale

- **Totale domande estratte:** 70
- **Risposte corrette identificate:** 2 (domande 13 e 25)
- **Risposte corrette da verificare:** 68

## 📋 Distribuzione per Categoria

- **FARMACOLOGIA:** 33 domande
- **CHIMICA_FARMACEUTICA:** 13 domande
- **FARMACEUTICA:** 13 domande
- **LEGISLAZIONE:** 8 domande
- **MICROBIOLOGIA:** 2 domande
- **ECONOMIA_FARMACEUTICA:** 1 domanda

## ⚠️ Risposte Corrette

Le risposte corrette nel PDF originale sono indicate con il simbolo **"#"** prima della lettera (es: `# D fludrocortisone`), ma questo simbolo **non è presente** nel testo estratto dal PDF.

### Come Aggiungere le Risposte Corrette

1. Apri il file `correct-answers-ssfo-modello2.json`
2. Aggiungi le risposte corrette nel formato:
   ```json
   {
     "correctAnswers": {
       "1": "A",
       "2": "E",
       "3": "C",
       ...
     }
   }
   ```
3. Riesegui lo script `extractNewPdfQuizzes.js` per aggiornare il file `new-quiz-data.json`

### Risposte Corrette Già Identificate

- **Domanda 13:** D (fludrocortisone)
- **Domanda 25:** A (ha idrogeni acidi)

## 🔄 Utilizzo

### Per Estrarre Nuove Domande da Altri PDF

1. Modifica il percorso del PDF in `extractNewPdfQuizzes.js`:
   ```javascript
   const pdfPath = path.join(__dirname, 'Ulteriori quiz', 'nome-file.pdf');
   ```

2. Esegui lo script:
   ```bash
   node extractNewPdfQuizzes.js
   ```

3. Il file `new-quiz-data.json` verrà aggiornato con le nuove domande

### Per Unire con quiz-data.json Esistente

Le domande nel file `new-quiz-data.json` hanno ID che iniziano da 1. Per unirle con `quiz-data.json`:

1. Carica entrambi i file JSON
2. Modifica gli ID delle nuove domande per continuare dalla fine di `quiz-data.json` (es: se `quiz-data.json` ha 2990 quiz, le nuove domande dovrebbero avere ID da 2991 in poi)
3. Unisci gli array `quizzes` dei due file

## 📝 Formato JSON

Il formato è identico a `quiz-data.json`:

```json
{
  "metadata": {
    "sourceFile": "ssfo-quiz-modello2.pdf",
    "extractionDate": "2025-11-26T18:26:52.814Z",
    "totalQuizzes": 70,
    "note": "68 domande necessitano verifica manuale delle risposte corrette"
  },
  "quizzes": [
    {
      "id": 1,
      "question": "Testo della domanda",
      "category": "FARMACOLOGIA",
      "subcategory": "FARMACOLOGIA_ANTINFIAMMATORI",
      "answers": [
        {
          "letter": "A",
          "text": "Testo risposta A"
        },
        ...
      ],
      "correctAnswer": "A" // o null se non identificata
    }
  ]
}
```

## 🎯 Prossimi Passi

1. Verifica manualmente le risposte corrette nel PDF originale
2. Aggiungi le risposte corrette nel file `correct-answers-ssfo-modello2.json`
3. Riesegui lo script per aggiornare `new-quiz-data.json`
4. Una volta completato, unisci con `quiz-data.json` se necessario

