# ✅ Fix Study Mode Status - Gestione Corretta dello Stato

**Data**: 2025-01-27  
**Problema**: Le domande che appaiono in più sessioni di studio venivano conteggiate più volte

---

## 🐛 Problema Identificato

1. **Doppio conteggio**: Se una domanda appare in 2 sessioni di studio, viene aggiornata 2 volte in `studyModeStatus`
2. **Stato non finale**: Lo stato potrebbe non riflettere l'ultimo risultato se una domanda viene risposta correttamente dopo essere stata sbagliata
3. **Mancanza di priorità**: Non c'era una logica chiara per gestire i cambiamenti di stato

---

## 🔧 Correzioni Applicate

### 1. Logica di Priorità nello Stato

**File**: `pages/quiz/quiz.js` (linee 951-985)

**Prima**:
```javascript
// Aggiornava sempre lo stato, anche se era già 'passed'
if (userAnswer === quiz.correctAnswer) {
    updateQuestionStudyStatus(questionId, 'passed');
}
```

**Dopo**:
```javascript
// Se è già 'passed', non aggiornare (una volta superata, rimane superata)
if (currentStatus === 'passed') {
    return;
}

// Se risposta corretta, diventa 'passed' (sovrascrive wrong/unanswered)
if (userAnswer === quiz.correctAnswer) {
    newStatus = 'passed';
}
```

**Priorità degli stati**:
1. **'passed'** (massima priorità): Una volta superata, rimane superata
2. **'wrong'**: Se sbagliata, rimane wrong (non torna a unanswered)
3. **'unanswered'**: Solo se mai risposta o esplicitamente unanswered

---

### 2. Gestione Transizioni di Stato

**Regole implementate**:
- ✅ `passed` → non può tornare a `wrong` o `unanswered`
- ✅ `wrong` → può diventare `passed` (se risposta corretta)
- ✅ `wrong` → rimane `wrong` se non risposta (non torna a `unanswered`)
- ✅ `unanswered` → può diventare `passed` o `wrong`

---

### 3. Distinzione Sessioni Quiz vs Studio

**File**: `pages/quiz/quiz.js` (linea 937)

Lo storico già distingue tra sessioni:
```javascript
studyMode: quizSettings.studyMode || 'quiz' // 'study' o 'quiz'
```

**Comportamento**:
- ✅ Sessioni **Quiz**: Salvate nello storico, NON aggiornano `studyModeStatus`
- ✅ Sessioni **Studio**: Salvate nello storico E aggiornano `studyModeStatus`

---

## ✅ Risultato

Ora il sistema:
- ✅ Conta ogni quiz **una sola volta** in `studyModeStatus`
- ✅ Lo stato finale riflette l'**ultimo risultato** di ogni quiz
- ✅ Una volta superata (`passed`), una domanda rimane superata
- ✅ Distingue correttamente tra sessioni di quiz e sessioni di studio

---

## 📊 Esempio

**Scenario**: Domanda ID 1 appare in 3 sessioni di studio

**Sessione 1**: Risposta sbagliata → `studyModeStatus[1] = 'wrong'`
**Sessione 2**: Non risposta → `studyModeStatus[1] = 'wrong'` (rimane wrong)
**Sessione 3**: Risposta corretta → `studyModeStatus[1] = 'passed'`

**Risultato finale**: `studyModeStatus[1] = 'passed'` ✅

**Conteggio**: La domanda viene contata **una sola volta** come 'passed'

---

## 🧪 Test Consigliati

1. **Test transizione wrong → passed**:
   - Rispondi sbagliato a una domanda in sessione 1
   - Rispondi correttamente alla stessa domanda in sessione 2
   - Verifica che lo stato finale sia 'passed'

2. **Test priorità passed**:
   - Rispondi correttamente a una domanda (diventa 'passed')
   - Rispondi sbagliato alla stessa domanda in una nuova sessione
   - Verifica che lo stato rimanga 'passed'

3. **Test conteggio**:
   - Fai 2 sessioni di studio con alcune domande duplicate
   - Verifica che il conteggio sia corretto (ogni domanda contata una volta)

---

## 📝 Note Tecniche

- `studyModeStatus` contiene lo **stato finale** di ogni quiz (non tutte le occorrenze)
- Le funzioni di conteggio (`getPassedQuestionIds`, `getWrongQuestionIds`, etc.) usano solo `studyModeStatus`
- Lo storico (`quizStatistics`) contiene tutte le sessioni (quiz + studio) per le statistiche
- Solo le sessioni di **studio** aggiornano `studyModeStatus`

---

**Fix completato da**: Auto (AI Assistant)  
**File modificati**: `pages/quiz/quiz.js`  
**Errori di linting**: 0

