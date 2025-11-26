# 🔍 Debug Conteggio Quiz - Problema "11 invece di 10"

**Data**: 2025-01-27  
**Problema**: Vedi 11 quiz disponibili invece di 10 quando hai 16 superati su 26

---

## 📊 Situazione Attuale

- **Totale quiz**: 26
- **Superati**: 16 (stato 'passed' in `studyModeStatus`)
- **Atteso**: 10 quiz disponibili (wrong + unanswered)
- **Visto**: 11 quiz disponibili ❌

---

## 🔍 Possibili Cause

### 1. Quiz Completati in Modalità Quiz (Non Studio)

Se hai fatto alcuni quiz in **modalità Quiz** (non Studio), questi:
- ✅ Sono salvati in `quizStatistics`
- ❌ NON sono in `studyModeStatus`
- ✅ Vengono contati come "non risposti" in modalità Studio

**Questo è il comportamento corretto**: in modalità Studio consideriamo solo i quiz fatti in modalità Studio.

**Soluzione**: Se vuoi che i quiz fatti in modalità Quiz vengano considerati, dovremmo modificare la logica per leggere anche da `quizStatistics`.

---

### 2. Quiz Non Escluso Correttamente

Uno dei 16 quiz "superati" potrebbe non essere escluso correttamente se:
- Non è in `studyModeStatus` con stato 'passed'
- Ha un altro stato (es. 'wrong', 'unanswered')
- Non è presente in `studyModeStatus`

**Verifica**: Controlla in `localStorage.getItem('studyModeStatus')` se tutti i 16 quiz superati hanno stato 'passed'.

---

### 3. Doppio Conteggio

Un quiz potrebbe essere contato due volte se:
- È sia in `wrongIds` che in `unansweredIds` (non dovrebbe essere possibile)
- Viene incluso due volte nel filtro

**Correzione applicata**: Ho migliorato la logica per evitare doppi conteggi.

---

## 🔧 Correzioni Applicate

1. ✅ Migliorata `getUnansweredQuestionIds()` per escludere quiz con altri stati
2. ✅ Migliorata logica di filtro per evitare doppi conteggi
3. ✅ Aggiunto controllo esplicito per priorità: passed → wrong → unanswered

---

## 🧪 Come Verificare

1. **Apri la console del browser** (F12)
2. **Esegui questo codice**:

```javascript
// Conta i quiz superati
const studyStatus = JSON.parse(localStorage.getItem('studyModeStatus') || '{}');
const passed = Object.keys(studyStatus).filter(id => studyStatus[id] === 'passed');
console.log('Quiz superati:', passed.length);
console.log('ID quiz superati:', passed);

// Conta i quiz sbagliati
const wrong = Object.keys(studyStatus).filter(id => studyStatus[id] === 'wrong');
console.log('Quiz sbagliati:', wrong.length);

// Conta i quiz non risposti (per la categoria selezionata)
// (dovresti avere 26 quiz totali - 16 superati - wrong = unanswered)
```

3. **Verifica**:
   - Se vedi 16 quiz superati, allora il problema è altrove
   - Se vedi meno di 16, alcuni quiz superati non sono tracciati correttamente

---

## 💡 Soluzione Proposta

Se il problema è che i quiz fatti in modalità Quiz vengono contati come "non risposti", possiamo:

1. **Opzione 1**: Considerare anche `quizStatistics` per escludere quiz completati in modalità Quiz
2. **Opzione 2**: Mantenere il comportamento attuale (solo `studyModeStatus`)

**Raccomandazione**: Opzione 1 se vuoi che i quiz fatti in modalità Quiz vengano considerati.

---

**Nota**: Se il problema persiste, potrebbe essere necessario aggiungere logging per vedere esattamente quali quiz vengono inclusi/esclusi.

