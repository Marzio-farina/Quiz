# ✅ Fix Modalità Studio - Conteggio Quiz Disponibili (Parte 2)

**Data**: 2025-01-27  
**Problema**: In modalità Studio vedevi 0 quiz invece di vedere i quiz non risposti + quelli sbagliati

---

## 🐛 Problema Identificato

In modalità Studio, l'utente si aspettava di vedere:
- ✅ Quiz **non risposti** (unanswered o non presenti in localStorage)
- ✅ Quiz **sbagliati** (wrong)
- ❌ Escludere solo quiz **superati** (passed)

**Comportamento precedente**:
- Quando l'esclusione era "risposti" (`excludeMode === 'answered'`), venivano esclusi TUTTI i quiz risposti (sia passed che wrong)
- Questo causava 0 quiz disponibili se l'utente aveva risposto a tutti i quiz (anche sbagliandoli)

---

## 🔧 Correzioni Applicate

### 1. Aggiunta Funzione `getWrongQuestionIds()`

**File**: `pages/homepage/homepage.js` (linee 143-159)

Aggiunta funzione helper per ottenere i quiz sbagliati (stato 'wrong'):
```javascript
function getWrongQuestionIds() {
    // Ritorna un Set con gli ID dei quiz con stato 'wrong'
}
```

---

### 2. Modificata Logica di Esclusione in Modalità Studio

**File**: `pages/homepage/homepage.js` (linee 174-220)

**Modifiche**:
- In modalità Studio, **sempre** escludiamo solo i quiz superati (passed)
- Indipendentemente dall'opzione selezionata ("risposti" o "superati"), la logica è la stessa
- Questo garantisce che rimangano sempre: quiz non risposti + quiz sbagliati

**Prima**:
```javascript
if (excludeMode === 'answered') {
    // Escludeva TUTTI i quiz risposti (passed + wrong) ❌
    excludeIds = getAnsweredQuestionIds();
}
```

**Dopo**:
```javascript
if (excludeMode === 'answered') {
    // Esclude solo quelli superati (passed) ✅
    // Rimangono: non risposti + sbagliati
    excludeIds = getPassedQuestionIds();
}
```

---

## ✅ Risultato

Ora in modalità Studio:
- ✅ Vengono mostrati i quiz **non risposti** (unanswered o non presenti in localStorage)
- ✅ Vengono mostrati i quiz **sbagliati** (wrong)
- ✅ Vengono esclusi solo i quiz **superati** (passed)
- ✅ Funziona indipendentemente dall'opzione "risposti" o "superati" selezionata

---

## 📝 Logica Finale

### Modalità Studio - Comportamento

**Quiz inclusi**:
- Quiz non risposti (non hanno stato in `studyModeStatus` o hanno stato `'unanswered'`)
- Quiz sbagliati (hanno stato `'wrong'` in `studyModeStatus`)

**Quiz esclusi**:
- Quiz superati (hanno stato `'passed'` in `studyModeStatus`)

**Esempio**:
- Totale quiz: 26
- Superati: 16
- Sbagliati: 5
- Non risposti: 5

**Risultato**: Vengono mostrati 10 quiz (5 sbagliati + 5 non risposti)

---

## 🧪 Test Consigliati

1. **Test con quiz misti**:
   - Completa alcuni quiz in modalità Studio
   - Rispondi correttamente ad alcuni (superati)
   - Rispondi sbagliato ad alcuni (sbagliati)
   - Lascia alcuni non risposti
   - Verifica che vengano mostrati solo quelli sbagliati + non risposti

2. **Test cambio esclusione**:
   - Cambia tra "risposti" e "superati"
   - Verifica che il conteggio rimanga lo stesso (dovrebbe essere identico)

3. **Test con tutti i quiz superati**:
   - Se tutti i quiz sono superati, dovresti vedere 0 quiz disponibili
   - Questo è corretto perché non ci sono quiz da studiare

---

## ⚠️ Nota Importante

La logica è stata semplificata: in modalità Studio, indipendentemente dall'opzione selezionata ("risposti" o "superati"), viene sempre escluso solo quello che è stato superato. Questo perché in modalità Studio l'obiettivo è studiare quello che non si sa o che si è sbagliato.

Se in futuro vuoi una logica diversa (es. "risposti" esclude tutti i risposti, "superati" esclude solo i superati), la logica può essere facilmente modificata.

---

**Fix completato da**: Auto (AI Assistant)  
**File modificati**: `pages/homepage/homepage.js`  
**Errori di linting**: 0

