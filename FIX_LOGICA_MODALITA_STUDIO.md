# ✅ Fix Logica Modalità Studio - Conteggio Corretto

**Data**: 2025-01-27  
**Problema**: La logica di conteggio in modalità Studio non corrispondeva ai requisiti

---

## 📋 Requisiti Corretti

### 1. **Modalità Quiz**
- ✅ Mostra **tutti i quiz** della categoria selezionata
- ✅ Nessuna esclusione
- ✅ Conteggio: tutti i quiz disponibili nella categoria

### 2. **Modalità Studio con opzione "risposti"**
- ✅ Mostra **solo i quiz sbagliati** (wrong)
- ✅ Esclude: superati (passed) + non risposti (unanswered)
- ✅ Conteggio: solo i quiz con stato 'wrong'

### 3. **Modalità Studio con opzione "Non risposti"** (precedentemente "superati")
- ✅ Mostra **quiz sbagliati (wrong) + non risposti (unanswered)**
- ✅ Esclude solo: superati (passed)
- ✅ Conteggio: quiz wrong + unanswered

---

## 🔧 Correzioni Applicate

### 1. Aggiunta Funzione `getUnansweredQuestionIds()`

**File**: `pages/homepage/homepage.js` e `pages/quiz/quiz.js`

Aggiunta funzione per ottenere i quiz non risposti:
- Quiz che non sono presenti in `studyModeStatus`
- Quiz con stato `'unanswered'` in `studyModeStatus`

```javascript
function getUnansweredQuestionIds(allQuizIds) {
    // Ritorna un Set con gli ID dei quiz non risposti
}
```

---

### 2. Modificata Logica di Filtro in Modalità Studio

**File**: `pages/homepage/homepage.js` (linee 193-232)

**Opzione "risposti" (`excludeMode === 'answered'`)**:
```javascript
// Mostra solo quelli sbagliati (wrong)
const wrongIds = getWrongQuestionIds();
filtered = filtered.filter(quiz => wrongIds.has(quizId));
```

**Opzione "Non risposti" (`excludeMode === 'passed'`)**:
```javascript
// Mostra wrong + unanswered, escludi solo passed
const passedIds = getPassedQuestionIds();
const wrongIds = getWrongQuestionIds();
const unansweredIds = getUnansweredQuestionIds(allQuizIds);

filtered = filtered.filter(quiz => {
    if (passedIds.has(quizId)) return false; // Escludi superati
    return wrongIds.has(quizId) || unansweredIds.has(quizId); // Includi wrong + unanswered
});
```

---

### 3. Aggiornata Logica in `quiz.js`

**File**: `pages/quiz/quiz.js` (linee 305-340)

Stessa logica applicata in `selectQuizzes()` per coerenza tra homepage e quiz page.

---

### 4. Rinominata Opzione "superati" in "Non risposti"

**File**: `pages/homepage/homepage.html` (linea 59)

Cambiato il testo da "superati" a "Non risposti" per chiarezza.

---

## ✅ Risultato

### Esempio Pratico

Supponiamo di avere 26 quiz in Cosmetologia:
- 16 superati (passed)
- 5 sbagliati (wrong)
- 5 non risposti (unanswered)

**Modalità Quiz**:
- Mostra: **26 quiz** (tutti)

**Modalità Studio - Opzione "risposti"**:
- Mostra: **5 quiz** (solo quelli sbagliati)

**Modalità Studio - Opzione "Non risposti"**:
- Mostra: **10 quiz** (5 sbagliati + 5 non risposti)

---

## 🧪 Test Consigliati

1. **Test Modalità Quiz**:
   - Seleziona una categoria
   - Verifica che vengano mostrati tutti i quiz della categoria
   - Verifica che il conteggio corrisponda al totale

2. **Test Modalità Studio - "risposti"**:
   - Attiva modalità Studio
   - Seleziona opzione "risposti"
   - Verifica che vengano mostrati solo i quiz sbagliati
   - Verifica che il conteggio corrisponda al numero di quiz sbagliati

3. **Test Modalità Studio - "Non risposti"**:
   - Attiva modalità Studio
   - Seleziona opzione "Non risposti"
   - Verifica che vengano mostrati quiz sbagliati + non risposti
   - Verifica che il conteggio corrisponda alla somma

4. **Test Cambio Opzioni**:
   - Cambia tra "risposti" e "Non risposti"
   - Verifica che il conteggio si aggiorni correttamente
   - Verifica che i pulsanti delle quantità si aggiornino

---

## 📝 Note Tecniche

- Le funzioni helper sono duplicate in `homepage.js` e `quiz.js` per mantenere la coerenza
- La logica è identica in entrambi i file per garantire che il conteggio in homepage corrisponda ai quiz effettivamente selezionati
- I quiz non risposti sono identificati come:
  - Quiz non presenti in `studyModeStatus`
  - Quiz con stato `'unanswered'` in `studyModeStatus`

---

**Fix completato da**: Auto (AI Assistant)  
**File modificati**: 
- `pages/homepage/homepage.js`
- `pages/quiz/quiz.js`
- `pages/homepage/homepage.html`
**Errori di linting**: 0

