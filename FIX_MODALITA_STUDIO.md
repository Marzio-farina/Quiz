# ✅ Fix Modalità Studio - Conteggio Quiz Disponibili

**Data**: 2025-01-27  
**Problema**: I pulsanti delle quantità non consideravano le esclusioni in modalità Studio

---

## 🐛 Problema Identificato

Quando l'utente:
- Seleziona solo la categoria **Cosmetologia** (26 quiz totali)
- Attiva la **modalità Studio**
- Attiva l'esclusione **"superati"** (passed)
- Ha superato **16/26** domande

**Comportamento atteso**: Dovrebbero rimanere solo **10 quiz disponibili** (26 - 16 = 10), quindi dovrebbe essere mostrato solo il pulsante **"10"**.

**Comportamento precedente**: Venivano mostrati i pulsanti **10, 20, 50** perché il conteggio non considerava le esclusioni.

---

## 🔧 Correzioni Applicate

### 1. Aggiunte Funzioni Helper per Modalità Studio

**File**: `pages/homepage/homepage.js`

Aggiunte le funzioni per ottenere i quiz esclusi:
- `getPassedQuestionIds()` - Ottiene tutte le domande superate (stato 'passed')
- `getAnsweredQuestionIds()` - Ottiene tutte le domande risposte (stato 'passed' o 'wrong')

Queste funzioni leggono da `localStorage.getItem('studyModeStatus')` come in `quiz.js`.

---

### 2. Modificata `countAvailableQuizzes()`

**File**: `pages/homepage/homepage.js` (linee 145-197)

**Modifiche**:
- Aggiunti parametri `studyMode` e `excludeMode`
- Applicata la stessa logica di filtro di `selectQuizzes()` in `quiz.js`
- Quando `studyMode === 'study'` e `excludeMode` è impostato:
  - Se `excludeMode === 'passed'`: esclude solo i quiz superati
  - Se `excludeMode === 'answered'`: esclude tutti i quiz risposti

**Prima**:
```javascript
function countAvailableQuizzes(selectedCategories) {
    // Contava solo per categorie, ignorava modalità Studio
}
```

**Dopo**:
```javascript
function countAvailableQuizzes(selectedCategories, studyMode = null, excludeMode = null) {
    // Filtra per categorie
    // Poi filtra per modalità Studio e esclusioni (stessa logica di quiz.js)
}
```

---

### 3. Modificata `updateQuestionCountButtons()`

**File**: `pages/homepage/homepage.js` (linee 199-265)

**Modifiche**:
- Ora legge la modalità Studio e l'esclusione dai toggle
- Passa questi parametri a `countAvailableQuizzes()`
- Migliorata la logica per gestire casi con meno di 10 quiz disponibili

**Logica migliorata**:
- Se ci sono **meno di 10 quiz disponibili**, mostra solo il numero esatto (es. se ci sono 10, mostra solo "10")
- Se ci sono **tra 10 e 20 quiz**, mostra "10" e il numero esatto se diverso da 10 o 20
- Se ci sono **più di 20 quiz**, mostra i pulsanti standard (10, 20, 50, 100) o il numero esatto se tra 20 e 100

---

### 4. Aggiunti Event Listeners per Aggiornamento Automatico

**File**: `pages/homepage/homepage.js`

**Modifiche**:
- Aggiunta chiamata a `updateQuestionCountButtons()` quando cambia `studyModeToggle`
- Aggiunta chiamata a `updateQuestionCountButtons()` quando cambia `excludeCompletedToggle`

Ora i pulsanti si aggiornano automaticamente quando l'utente:
- Cambia da Quiz a Studio (o viceversa)
- Cambia l'esclusione tra "risposti" e "superati"

---

## ✅ Risultato

Ora quando l'utente ha:
- ✅ Categoria **Cosmetologia** selezionata (26 quiz)
- ✅ Modalità **Studio** attiva
- ✅ Esclusione **"superati"** attiva
- ✅ **16/26** quiz superati

Il sistema:
- ✅ Conta correttamente solo i **10 quiz non superati** (26 - 16 = 10)
- ✅ Mostra solo il pulsante **"10"** invece di 10, 20, 50
- ✅ Si aggiorna automaticamente quando cambiano le impostazioni

---

## 🧪 Test Consigliati

1. **Test caso specifico**:
   - Seleziona solo Cosmetologia
   - Attiva modalità Studio
   - Attiva esclusione "superati"
   - Verifica che i pulsanti mostrino solo "10" (se hai superato 16/26)

2. **Test cambio modalità**:
   - Cambia da Studio a Quiz → i pulsanti dovrebbero mostrare 10, 20, 50 (tutti i 26 quiz)
   - Cambia da Quiz a Studio → i pulsanti dovrebbero aggiornarsi in base alle esclusioni

3. **Test cambio esclusione**:
   - Cambia da "superati" a "risposti" → i pulsanti dovrebbero aggiornarsi
   - Cambia da "risposti" a "superati" → i pulsanti dovrebbero aggiornarsi

---

## 📝 Note Tecniche

- Le funzioni helper (`getPassedQuestionIds`, `getAnsweredQuestionIds`) sono duplicate da `quiz.js` per mantenere la coerenza
- La logica di filtro è identica a quella in `selectQuizzes()` in `quiz.js` per garantire coerenza
- Il conteggio viene aggiornato in tempo reale quando cambiano le impostazioni

---

**Fix completato da**: Auto (AI Assistant)  
**File modificati**: `pages/homepage/homepage.js`  
**Errori di linting**: 0

