// Script specifico per la homepage
const { ipcRenderer } = require('electron');
// Esporta ipcRenderer globalmente per uso in altri script
window.ipcRenderer = ipcRenderer;
const fs = require('fs');
const path = require('path');

// Stato dell'applicazione
let selectedQuestionCount = 10;
let isRandomMode = false;
let allQuizzes = [];
let availableQuizCount = 0;

// Gestione tema
function initTheme() {
    try {
        // Carica il tema salvato dal localStorage
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        }
    } catch (error) {
        // Se localStorage non è disponibile, usa il tema di default
        console.warn('Impossibile caricare il tema salvato:', error);
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    
    try {
        // Salva la preferenza
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch (error) {
        console.warn('Impossibile salvare il tema:', error);
    }
}

// Inizializza il tema all'avvio
initTheme();

// Gestione click sul toggle tema
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
}

// Gestione pulsante minimizza applicazione
const minimizeAppBtn = document.getElementById('minimizeAppBtn');
if (minimizeAppBtn) {
    minimizeAppBtn.addEventListener('click', () => {
        ipcRenderer.send('minimize-window');
    });
}

// Gestione pulsante chiudi applicazione
const closeAppBtn = document.getElementById('closeAppBtn');
if (closeAppBtn) {
    closeAppBtn.addEventListener('click', () => {
        window.close();
    });
}

// Carica i quiz dal JSON
async function loadQuizData() {
    console.log('[loadQuizData] INIZIO');
    try {
        let dataPath;
        
        // Prova a ottenere il percorso tramite IPC (più affidabile)
        try {
            dataPath = ipcRenderer.sendSync('get-quiz-data-path');
            console.log('[loadQuizData] Percorso ottenuto via IPC:', dataPath);
        } catch (ipcError) {
            // Se IPC fallisce, usa il percorso diretto
            if (process.resourcesPath) {
                // App distribuita: quiz-data.json è in resources/
                dataPath = path.join(process.resourcesPath, 'quiz-data.json');
            } else {
                // Sviluppo: quiz-data.json è nella root del progetto
                dataPath = path.join(__dirname, '..', '..', 'quiz-data.json');
            }
            console.log('[loadQuizData] Percorso calcolato:', dataPath);
        }
        
        const rawData = fs.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(rawData);
        allQuizzes = data.quizzes;
        console.log('[loadQuizData] Quiz caricati:', {
            count: allQuizzes.length,
            firstQuizId: allQuizzes[0]?.id,
            firstQuizCategory: allQuizzes[0]?.category
        });
        return true;
    } catch (error) {
        console.error('[loadQuizData] Errore primo tentativo:', error);
        // Se il primo percorso fallisce, prova l'altro come fallback
        // In sviluppo, __dirname è pages/homepage/, quindi devi salire di 2 livelli per raggiungere la root
        try {
            // Prova prima con il percorso relativo dalla root del progetto
            const fallbackPath = path.join(__dirname, '..', '..', 'quiz-data.json');
            console.log('[loadQuizData] Tentativo fallback con percorso:', fallbackPath);
            const rawData = fs.readFileSync(fallbackPath, 'utf8');
            const data = JSON.parse(rawData);
            allQuizzes = data.quizzes;
            console.log('[loadQuizData] Quiz caricati da fallback:', {
                count: allQuizzes.length
            });
            return true;
        } catch (fallbackError) {
            console.error('[loadQuizData] Errore anche nel fallback:', fallbackError);
            return false;
        }
    }
}

// Funzioni helper per modalità Studio (stesso codice di quiz.js)
// Ottieni tutte le domande superate (stato 'passed')
// IMPORTANTE: Le chiavi in studyModeStatus sono salvate come STRINGHE
function getPassedQuestionIds() {
    try {
        const studyStatus = JSON.parse(localStorage.getItem('studyModeStatus') || '{}');
        const passedIds = new Set();
        
        Object.keys(studyStatus).forEach(idStr => {
            const id = Number(idStr);
            // Verifica che sia un numero valido e che lo stato sia 'passed'
            if (!isNaN(id) && studyStatus[idStr] === 'passed') {
                passedIds.add(id);
            }
        });
        
        console.log('[getPassedQuestionIds] Quiz superati (passed):', {
            count: passedIds.size,
            ids: Array.from(passedIds).slice(0, 20), // Mostra solo i primi 20 per non intasare
            totalInStatus: Object.keys(studyStatus).length
        });
        
        return passedIds;
    } catch (error) {
        console.error('Errore nel recupero dei quiz superati:', error);
        return new Set();
    }
}

// Ottieni tutte le domande risposte (solo quelle con risposta data: 'passed' o 'wrong', NON 'unanswered')
function getAnsweredQuestionIds() {
    try {
        const studyStatus = JSON.parse(localStorage.getItem('studyModeStatus') || '{}');
        const answeredIds = new Set();
        
        Object.keys(studyStatus).forEach(idStr => {
            const id = Number(idStr);
            const status = studyStatus[idStr];
            if (!isNaN(id) && status !== null && status !== undefined && status !== 'unanswered') {
                // Include solo le domande con risposta data (passed o wrong), NON quelle non risposte
                answeredIds.add(id);
            }
        });
        
        return answeredIds;
    } catch (error) {
        return new Set();
    }
}

// Ottieni tutte le domande sbagliate (stato 'wrong')
// IMPORTANTE: Le chiavi in studyModeStatus sono salvate come STRINGHE
function getWrongQuestionIds() {
    try {
        const studyStatus = JSON.parse(localStorage.getItem('studyModeStatus') || '{}');
        const wrongIds = new Set();
        
        Object.keys(studyStatus).forEach(idStr => {
            const id = Number(idStr);
            // Verifica che sia un numero valido e che lo stato sia 'wrong'
            if (!isNaN(id) && studyStatus[idStr] === 'wrong') {
                wrongIds.add(id);
            }
        });
        
        console.log('[getWrongQuestionIds] Quiz sbagliati (wrong):', {
            count: wrongIds.size,
            ids: Array.from(wrongIds).slice(0, 20) // Mostra solo i primi 20 per non intasare
        });
        
        return wrongIds;
    } catch (error) {
        console.error('Errore nel recupero dei quiz sbagliati:', error);
        return new Set();
    }
}

// Ottieni tutte le domande non risposte (stato 'unanswered' o non presenti in studyModeStatus)
// Nota: questa funzione restituisce gli ID dei quiz che NON sono in studyModeStatus o hanno stato 'unanswered'
// IMPORTANTE: esclude i quiz che hanno già uno stato diverso da 'unanswered' (es. 'passed', 'wrong')
function getUnansweredQuestionIds(allQuizIds) {
    try {
        const studyStatus = JSON.parse(localStorage.getItem('studyModeStatus') || '{}');
        const unansweredIds = new Set();
        let notInStatus = 0;
        let explicitUnanswered = 0;
        
        // Aggiungi tutti i quiz che non sono presenti in studyModeStatus
        // O che hanno esplicitamente stato 'unanswered'
        allQuizIds.forEach(quizId => {
            const idStr = String(quizId);
            const status = studyStatus[idStr];
            
            // Se non è presente in studyModeStatus, è non risposto
            if (!status) {
                unansweredIds.add(quizId);
                notInStatus++;
            } 
            // Se ha esplicitamente stato 'unanswered', è non risposto
            else if (status === 'unanswered') {
                unansweredIds.add(quizId);
                explicitUnanswered++;
            }
            // Se ha altri stati ('passed', 'wrong'), NON è non risposto, quindi non lo includiamo
        });
        
        console.log('[getUnansweredQuestionIds] Quiz non risposti (unanswered):', {
            count: unansweredIds.size,
            notInStatus: notInStatus,
            explicitUnanswered: explicitUnanswered,
            totalQuizIds: allQuizIds.length,
            ids: Array.from(unansweredIds).slice(0, 20) // Mostra solo i primi 20 per non intasare
        });
        
        return unansweredIds;
    } catch (error) {
        console.error('[getUnansweredQuestionIds] Errore:', error);
        return new Set();
    }
}

// Conta i quiz disponibili per le categorie selezionate, considerando anche modalità Studio e esclusioni
function countAvailableQuizzes(selectedCategories, studyMode = null, excludeMode = null) {
    console.log('[countAvailableQuizzes] INIZIO:', {
        selectedCategories: selectedCategories,
        selectedCategoriesCount: selectedCategories?.length || 0,
        studyMode: studyMode,
        excludeMode: excludeMode,
        totalQuizzes: allQuizzes.length
    });
    
    // Se non ci sono categorie selezionate, restituisci 0
    if (!selectedCategories || selectedCategories.length === 0) {
        console.log('[countAvailableQuizzes] Nessuna categoria selezionata, restituisco 0');
        return 0;
    }
    
    let filtered = allQuizzes;
    
    // Filtra per categorie
    filtered = allQuizzes.filter(quiz => {
        // Priorità 1: Se una sottocategoria è selezionata, usa solo quella
        if (quiz.subcategory && selectedCategories.includes(quiz.subcategory)) {
            return true;
        }
        
        // Priorità 2: Se la categoria principale è selezionata (senza sottocategorie specifiche)
        if (selectedCategories.includes(quiz.category)) {
            // Verifica che non ci siano sottocategorie selezionate per questa categoria
            const hasSubcategoriesForThisCategory = selectedCategories.some(cat => 
                cat.startsWith(quiz.category + '_') && cat !== quiz.category
            );
            
            // Se non ci sono sottocategorie selezionate per questa categoria, includi tutti i quiz
            if (!hasSubcategoriesForThisCategory) {
                return true;
            }
        }
        
        return false;
    });
    
    console.log('[countAvailableQuizzes] Dopo filtro categorie:', {
        filteredCount: filtered.length,
        filteredIds: filtered.map(q => q.id).slice(0, 20) // Mostra solo i primi 20
    });
    
    // Filtra i quiz in base alla modalità Studio e alle esclusioni
    // IMPORTANTE: In modalità Studio, SEMPRE escludi i quiz superati (passed)
    if (studyMode === 'study') {
        console.log('[countAvailableQuizzes] Modalità Studio attiva, applicando filtri...');
        
        const passedIds = getPassedQuestionIds();
        const allQuizIds = filtered.map(quiz => Number(quiz.id)).filter(id => !isNaN(id));
        const wrongIds = getWrongQuestionIds();
        const unansweredIds = getUnansweredQuestionIds(allQuizIds);
        
        // Calcola quanti ID di ogni tipo sono nelle categorie selezionate
        const passedInCategories = allQuizIds.filter(id => passedIds.has(id));
        const wrongInCategories = allQuizIds.filter(id => wrongIds.has(id));
        const unansweredInCategories = allQuizIds.filter(id => unansweredIds.has(id));
        
        console.log('[countAvailableQuizzes] Set di ID:', {
            passedIdsCount: passedIds.size,
            wrongIdsCount: wrongIds.size,
            unansweredIdsCount: unansweredIds.size,
            allQuizIdsCount: allQuizIds.length,
            passedInCategoriesCount: passedInCategories.length,
            wrongInCategoriesCount: wrongInCategories.length,
            unansweredInCategoriesCount: unansweredInCategories.length,
            passedIdsSample: Array.from(passedIds).slice(0, 10),
            wrongIdsSample: Array.from(wrongIds).slice(0, 10),
            unansweredIdsSample: Array.from(unansweredIds).slice(0, 10),
            passedInCategoriesSample: passedInCategories.slice(0, 10),
            wrongInCategoriesSample: wrongInCategories.slice(0, 10),
            unansweredInCategoriesSample: unansweredInCategories.slice(0, 10)
        });
        
        const beforeFilterCount = filtered.length;
        
        if (excludeMode === 'answered') {
            // Opzione "Solo sbagliati": mostra solo i quiz sbagliati (wrong)
            // Escludi: superati (passed) + non risposti (unanswered)
            console.log('[countAvailableQuizzes] Opzione "Solo sbagliati": mostra solo wrong');
            filtered = filtered.filter(quiz => {
                const quizId = Number(quiz.id);
                if (isNaN(quizId)) return false;
                // Escludi quelli superati
                if (passedIds.has(quizId)) return false;
                // Includi solo quelli sbagliati
                const isWrong = wrongIds.has(quizId);
                return isWrong;
            });
        } else {
            // Opzione "Tutti da fare" o default: mostra quiz sbagliati (wrong) + non risposti (unanswered)
            // Escludi solo: superati (passed)
            console.log('[countAvailableQuizzes] Opzione "Tutti da fare" o default: mostra wrong + unanswered');
            filtered = filtered.filter(quiz => {
                const quizId = Number(quiz.id);
                if (isNaN(quizId)) return false;
                // PRIMA: escludi quelli superati (priorità massima)
                if (passedIds.has(quizId)) return false;
                // POI: includi solo quelli sbagliati o non risposti
                const isWrong = wrongIds.has(quizId);
                const isUnanswered = unansweredIds.has(quizId);
                const included = isWrong || isUnanswered;
                return included;
            });
        }
        
        console.log('[countAvailableQuizzes] Dopo filtro Studio:', {
            beforeFilter: beforeFilterCount,
            afterFilter: filtered.length,
            excluded: beforeFilterCount - filtered.length,
            finalIds: filtered.map(q => q.id).slice(0, 20)
        });
    } else {
        console.log('[countAvailableQuizzes] Modalità Quiz (non Studio), nessun filtro aggiuntivo');
    }
    
    const finalCount = filtered.length;
    console.log('[countAvailableQuizzes] RISULTATO FINALE:', {
        count: finalCount,
        studyMode: studyMode,
        excludeMode: excludeMode
    });
    
    return finalCount;
}

// Aggiorna dinamicamente i pulsanti delle quantità in base alle categorie e modalità Studio
function updateQuestionCountButtons() {
    console.log('[updateQuestionCountButtons] INIZIO');
    console.log('[updateQuestionCountButtons] Stato iniziale:', {
        allQuizzesLength: allQuizzes.length,
        categoryCheckboxesLength: categoryCheckboxes.length,
        categoryCheckboxesType: Array.isArray(categoryCheckboxes) ? 'array' : typeof categoryCheckboxes,
        categoryCheckboxesNodeList: categoryCheckboxes instanceof NodeList
    });
    
    // Verifica se categoryCheckboxes è un NodeList o un array
    const checkboxesArray = categoryCheckboxes instanceof NodeList 
        ? Array.from(categoryCheckboxes)
        : Array.isArray(categoryCheckboxes) 
            ? categoryCheckboxes 
            : [];
    
    console.log('[updateQuestionCountButtons] Checkbox trovati:', {
        count: checkboxesArray.length,
        checked: checkboxesArray.filter(cb => cb.checked).length,
        allValues: checkboxesArray.map(cb => ({ value: cb.value, checked: cb.checked }))
    });
    
    const selectedCategories = checkboxesArray
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    
    // Ottieni la modalità Studio e le impostazioni di esclusione (stesso codice del pulsante Inizia)
    const studyMode = studyModeToggle ? (studyModeToggle.checked ? 'study' : 'quiz') : 'quiz';
    const excludeMode = excludeCompletedToggle && studyMode === 'study' 
        ? (excludeCompletedToggle.checked ? 'passed' : 'answered')
        : null;
    
    console.log('[updateQuestionCountButtons] Impostazioni:', {
        selectedCategories: selectedCategories,
        selectedCategoriesCount: selectedCategories.length,
        studyMode: studyMode,
        excludeMode: excludeMode,
        studyModeToggleExists: !!studyModeToggle,
        studyModeToggleChecked: studyModeToggle?.checked,
        excludeCompletedToggleExists: !!excludeCompletedToggle,
        excludeCompletedToggleChecked: excludeCompletedToggle?.checked
    });
    
    // Conta i quiz disponibili considerando anche modalità Studio e esclusioni
    availableQuizCount = countAvailableQuizzes(selectedCategories, studyMode, excludeMode);
    
    console.log('[updateQuestionCountButtons] availableQuizCount:', availableQuizCount);
    
    // Valori standard dei pulsanti
    const standardButtons = [10, 20, 50, 100];
    
    // Determina quali pulsanti mostrare
    let buttonsToShow = standardButtons.filter(count => count <= availableQuizCount);
    
    // Se ci sono meno di 10 quiz disponibili, mostra solo il numero esatto disponibile
    if (availableQuizCount > 0 && availableQuizCount < 10) {
        buttonsToShow = [availableQuizCount];
    }
    // Se il massimo disponibile non è tra i valori standard e è tra 10 e 100, aggiungilo
    else if (availableQuizCount > 20 && availableQuizCount < 100 && !standardButtons.includes(availableQuizCount)) {
        buttonsToShow = buttonsToShow.filter(count => count < availableQuizCount);
        buttonsToShow.push(availableQuizCount);
    }
    // Se il massimo disponibile è tra 10 e 20 e non è 10 o 20, aggiungilo
    else if (availableQuizCount > 10 && availableQuizCount < 20 && !standardButtons.includes(availableQuizCount)) {
        buttonsToShow = buttonsToShow.filter(count => count < availableQuizCount);
        buttonsToShow.push(availableQuizCount);
    }
    
    // Assicurati che ci sia almeno un pulsante (anche se 0 quiz disponibili, mostra 0)
    if (buttonsToShow.length === 0) {
        buttonsToShow = [Math.max(0, Math.min(10, availableQuizCount))];
    }
    
    // Se la selezione corrente è maggiore del massimo disponibile, seleziona il massimo
    const maxAvailable = Math.max(...buttonsToShow);
    if (selectedQuestionCount > availableQuizCount) {
        selectedQuestionCount = maxAvailable;
    }
    
    // Se la selezione corrente non è tra i pulsanti disponibili, seleziona il più vicino
    if (!buttonsToShow.includes(selectedQuestionCount)) {
        selectedQuestionCount = maxAvailable;
    }
    
    // Ottieni il contenitore dei pulsanti
    const container = document.querySelector('.question-count-options');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Crea i nuovi pulsanti
    buttonsToShow.forEach(count => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.dataset.count = count;
        button.textContent = count;
        
        // Seleziona il pulsante corrispondente a selectedQuestionCount
        if (count === selectedQuestionCount) {
            button.classList.add('active');
        }
        
        // Aggiungi event listener
        button.addEventListener('click', () => {
            document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            selectedQuestionCount = parseInt(button.dataset.count);
        });
        
        container.appendChild(button);
    });
}

// Gestione checkbox Random
const randomCheck = document.getElementById('randomCheck');
if (randomCheck) {
    randomCheck.addEventListener('change', (e) => {
        isRandomMode = e.target.checked;
    });
}

// Gestione pulsante Inizia Quiz
const startBtn = document.getElementById('startBtn');
if (startBtn) {
    startBtn.addEventListener('click', () => {
        // Ottieni le categorie selezionate
        const selectedCategories = Array.from(categoryCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        
        // Ottieni la modalità e le impostazioni di esclusione
        const studyMode = studyModeToggle ? (studyModeToggle.checked ? 'study' : 'quiz') : 'quiz';
        const excludeMode = excludeCompletedToggle && studyMode === 'study' 
            ? (excludeCompletedToggle.checked ? 'passed' : 'answered')
            : null;
        
        // Salva le impostazioni e carica la pagina quiz
        const settings = {
            count: selectedQuestionCount,
            random: isRandomMode,
            categories: selectedCategories,
            studyMode: studyMode,
            excludeMode: excludeMode // 'answered' per escludere tutte le domande risposte, 'passed' per escludere solo quelle superate
        };
        
        // Passa le impostazioni al main process
        ipcRenderer.send('load-quiz-page', settings);
    });
}

// Gestione pulsante Statistiche
const statsBtn = document.getElementById('statsBtn');
if (statsBtn) {
    statsBtn.addEventListener('click', () => {
        // Naviga alla pagina statistiche
        window.location.href = 'pages/statistics/statistics.html';
    });
}

// Mappa delle icone per categoria
const categoryIcons = {
    'FARMACOLOGIA': '💊',
    'CHIMICA_FARMACEUTICA': '⚗️',
    'LEGISLAZIONE': '⚖️',
    'MICROBIOLOGIA': '🦠',
    'FARMACEUTICA': '💉',
    'CHIMICA_ANALITICA': '🔬',
    'FARMACOGNOSIA': '🌿',
    'COSMETOLOGIA': '✨',
    'ECONOMIA_FARMACEUTICA': '💰',
    'ALTRO': '📌'
};

// Mappa dei nomi delle categorie
const categoryNames = {
    'FARMACOLOGIA': 'Farmacologia',
    'CHIMICA_FARMACEUTICA': 'Chimica Farmaceutica',
    'LEGISLAZIONE': 'Legislazione',
    'MICROBIOLOGIA': 'Microbiologia',
    'FARMACEUTICA': 'Farmaceutica',
    'CHIMICA_ANALITICA': 'Chimica Analitica',
    'FARMACOGNOSIA': 'Farmacognosia',
    'COSMETOLOGIA': 'Cosmetologia',
    'ECONOMIA_FARMACEUTICA': 'Economia Farmaceutica',
    'ALTRO': 'Altro'
};

// Mappa dei nomi delle sottocategorie (per visualizzazione)
const subcategoryDisplayNames = {
    'FARMACOLOGIA_CARDIOVASCOLARE': 'Cardiovascolare',
    'FARMACOLOGIA_ANTIBIOTICI': 'Antibiotici',
    'FARMACOLOGIA_SISTEMA_NERVOSO': 'Sistema Nervoso',
    'FARMACOLOGIA_ANTINFIAMMATORI': 'Antinfiammatori',
    'FARMACEUTICA_SOLIDE': 'Forme Solide',
    'FARMACEUTICA_LIQUIDE': 'Forme Liquide',
    'FARMACEUTICA_SEMISOLIDE': 'Forme Semisolide',
    'FARMACEUTICA_ECCIPIENTI': 'Eccipienti',
    'CHIMICA_FARMACEUTICA_STRUTTURA': 'Struttura Molecolare',
    'CHIMICA_FARMACEUTICA_ISOMERIA': 'Isomeria',
    'CHIMICA_FARMACEUTICA_SINTESI': 'Sintesi',
    'CHIMICA_FARMACEUTICA_ACIDI_BASI': 'Acidi e Basi',
    'LEGISLAZIONE_RICETTE': 'Ricette',
    'LEGISLAZIONE_NORMATIVE': 'Normative',
    'LEGISLAZIONE_ETICHETTATURA': 'Etichettatura',
    'LEGISLAZIONE_FARMACOVIGILANZA': 'Farmacovigilanza',
    'CHIMICA_ANALITICA_SPETTROSCOPIA': 'Spettroscopia',
    'CHIMICA_ANALITICA_CROMATOGRAFIA': 'Cromatografia',
    'CHIMICA_ANALITICA_ANALISI': 'Analisi',
    'CHIMICA_ANALITICA_VALIDAZIONE': 'Validazione',
    'FARMACOGNOSIA_BOTANICA': 'Botanica',
    'FARMACOGNOSIA_ESTRATTI': 'Estratti',
    'FARMACOGNOSIA_PRINCIPI_ATTIVI': 'Principi Attivi',
    'FARMACOGNOSIA_OMEOPATIA': 'Omeopatia',
    'COSMETOLOGIA_PRODOTTI': 'Prodotti',
    'COSMETOLOGIA_PROTEZIONE_SOLARE': 'Protezione Solare',
    'COSMETOLOGIA_INGREDIENTI': 'Ingredienti',
    'COSMETOLOGIA_LEGISLAZIONE': 'Legislazione',
    'MICROBIOLOGIA_BATTERI': 'Batteri',
    'MICROBIOLOGIA_PATOGENI': 'Patogeni',
    'MICROBIOLOGIA_RESISTENZA': 'Resistenza',
    'MICROBIOLOGIA_ANTIBIOTICI': 'Antibiotici',
    'ECONOMIA_FARMACEUTICA_PREZZI': 'Prezzi',
    'ECONOMIA_FARMACEUTICA_PRONTUARIO': 'Prontuario',
    'ECONOMIA_FARMACEUTICA_EQUIVALENTI': 'Equivalenti',
    'ECONOMIA_FARMACEUTICA_GESTIONE': 'Gestione'
};

// Genera dinamicamente le sottocategorie dal JSON
function generateCategoryFilters() {
    const container = document.getElementById('categoriesDialogContent');
    if (!container) {
        return;
    }
    if (allQuizzes.length === 0) {
        return;
    }
    
    // Raggruppa i quiz per sottocategoria (dal JSON)
    const subcategoryGroups = {};
    allQuizzes.forEach(quiz => {
        if (quiz.subcategory) {
            if (!subcategoryGroups[quiz.subcategory]) {
                subcategoryGroups[quiz.subcategory] = [];
            }
            subcategoryGroups[quiz.subcategory].push(quiz);
        }
    });
    
    // Raggruppa le sottocategorie per categoria padre
    const categoryToSubcategories = {};
    Object.keys(subcategoryGroups).forEach(subcategory => {
        const parentCategory = subcategory.split('_')[0] + (subcategory.includes('_') ? '_' + subcategory.split('_')[1] : '');
        // Estrai la categoria principale (prima parte prima del secondo underscore)
        const parts = subcategory.split('_');
        let parentCat = parts[0];
        if (parts.length > 2) {
            // Se ci sono più di 2 parti, la categoria è la prima parte
            parentCat = parts[0];
        }
        
        if (!categoryToSubcategories[parentCat]) {
            categoryToSubcategories[parentCat] = [];
        }
        categoryToSubcategories[parentCat].push(subcategory);
    });
    
    // Ordina le categorie
    const allCategories = ['FARMACOLOGIA', 'CHIMICA_FARMACEUTICA', 'LEGISLAZIONE', 'MICROBIOLOGIA', 
                          'FARMACEUTICA', 'CHIMICA_ANALITICA', 'FARMACOGNOSIA', 'COSMETOLOGIA', 
                          'ECONOMIA_FARMACEUTICA', 'ALTRO'];
    
    container.innerHTML = '';
    
    allCategories.forEach(category => {
        const subcategories = categoryToSubcategories[category] || [];
        const categoryQuizzes = allQuizzes.filter(q => q.category === category);
        const quizCount = categoryQuizzes.length;
        
        // Mostra sempre la categoria principale
        const categoryLabel = document.createElement('label');
        categoryLabel.className = 'category-checkbox';
        categoryLabel.innerHTML = `
            <input type="checkbox" value="${category}" checked>
            <span>${categoryIcons[category] || '📌'} ${categoryNames[category] || category}</span>
            <span class="category-stats" data-category="${category}">-</span>
        `;
        container.appendChild(categoryLabel);
        
        // Se la categoria ha più di 500 quiz, mostra anche le sottocategorie estratte dal JSON
        if (quizCount > 500 && subcategories.length > 0) {
            // Mostra le sottocategorie sotto la categoria principale
            subcategories.sort().forEach(subcategory => {
                const subcategoryQuizCount = subcategoryGroups[subcategory]?.length || 0;
                const displayName = subcategoryDisplayNames[subcategory] || subcategory.replace(category + '_', '');
                
                const subcategoryLabel = document.createElement('label');
                subcategoryLabel.className = 'category-checkbox subcategory';
                subcategoryLabel.innerHTML = `
                    <input type="checkbox" value="${subcategory}" checked>
                    <span>${displayName}</span>
                    <span class="category-stats" data-category="${subcategory}">-</span>
                `;
                container.appendChild(subcategoryLabel);
            });
        }
    });
    
    // Aggiorna i riferimenti ai checkbox
    categoryCheckboxes = document.querySelectorAll('.category-checkbox input[type="checkbox"]');
    
    // Ricarica le categorie selezionate
    loadSelectedCategories();
    
    // Reimposta gli event listener per la sincronizzazione
    setupCategorySyncListeners();
    
    // Aggiorna le statistiche ora che gli elementi sono stati generati
    // Usa setTimeout per assicurarsi che il DOM sia stato aggiornato
    setTimeout(() => {
        updateCategoryStats();
    }, 0);
}

// Setup event listeners per sincronizzazione categoria padre/sottocategorie
function setupCategorySyncListeners() {
    // Rimuovi listener precedenti se esistono
    categoryCheckboxes.forEach(checkbox => {
        const newCheckbox = checkbox.cloneNode(true);
        checkbox.parentNode.replaceChild(newCheckbox, checkbox);
    });
    
    // Aggiorna il riferimento
    categoryCheckboxes = document.querySelectorAll('.category-checkbox input[type="checkbox"]');
    
    // Aggiungi listener per ogni checkbox
    categoryCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const checkboxValue = e.target.value;
            
            // Estrai la categoria principale dalla sottocategoria (es. FARMACOLOGIA_CARDIOVASCOLARE -> FARMACOLOGIA)
            const parts = checkboxValue.split('_');
            const parentCategory = parts[0];
            
            // Trova tutte le sottocategorie della stessa categoria padre
            const subcategoryCheckboxes = Array.from(categoryCheckboxes)
                .filter(cb => {
                    const cbParts = cb.value.split('_');
                    // Verifica che sia una sottocategoria (ha più di una parte) e che appartenga alla categoria padre
                    return cbParts.length > 1 && cbParts[0] === parentCategory && cb.value !== parentCategory;
                });
            
            const parentCheckbox = Array.from(categoryCheckboxes)
                .find(cb => cb.value === parentCategory);
            
            // Se è una categoria principale e ci sono sottocategorie
            if (checkboxValue === parentCategory && parentCheckbox && subcategoryCheckboxes.length > 0) {
                // Se viene spuntata la categoria principale, spunta tutte le sottocategorie
                if (e.target.checked) {
                    subcategoryCheckboxes.forEach(sub => {
                        sub.checked = true;
                    });
                } else {
                    // Se viene deselezionata la categoria principale, deseleziona tutte le sottocategorie
                    subcategoryCheckboxes.forEach(sub => {
                        sub.checked = false;
                    });
                }
            } else if (parts.length > 1 && parentCheckbox && subcategoryCheckboxes.length > 0) {
                // Se è una sottocategoria
                
                // Caso 2: Se anche solo una sottocategoria è deselezionata, deseleziona la categoria padre
                if (!e.target.checked) {
                    parentCheckbox.checked = false;
                } else {
                    // Caso 1: Se tutte le sottocategorie sono selezionate, seleziona anche la categoria padre
                    const allSubcategoriesChecked = subcategoryCheckboxes.every(sub => sub.checked);
                    parentCheckbox.checked = allSubcategoriesChecked;
                }
            }
            
            saveSelectedCategories();
        });
    });
}

// Gestione dialog categorie
const categoriesDialog = document.getElementById('categoriesDialog');
const filterBtn = document.getElementById('filterBtn');
const optionsBtn = document.getElementById('optionsBtn');
const closeDialogBtn = document.getElementById('closeDialogBtn');
let categoryCheckboxes = [];

// Gestione pulsante Filtri - Toggle dialog categorie
if (filterBtn) {
    filterBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (categoriesDialog) {
            const isHidden = categoriesDialog.classList.contains('hidden');
            categoriesDialog.classList.toggle('hidden');
            // Se stiamo aprendo il dialog, assicurati che gli elementi siano stati generati
            if (isHidden) {
                const container = document.getElementById('categoriesDialogContent');
                
                // Se i quiz non sono ancora caricati, caricali prima
                if (allQuizzes.length === 0) {
                    await loadQuizData();
                }
                
                // Se il container è vuoto o non ci sono elementi, genera le categorie
                if (!container || container.children.length === 0 || document.querySelectorAll('.category-stats').length === 0) {
                    if (allQuizzes.length > 0) {
                        generateCategoryFilters();
                    }
                } else {
                    // Gli elementi esistono già, aggiorna solo le statistiche
                    setTimeout(() => {
                        updateCategoryStats();
                    }, 50);
                }
            }
        }
    });
}

// Gestione dialog opzioni
const optionsDialog = document.getElementById('optionsDialog');
const closeOptionsDialogBtn = document.getElementById('closeOptionsDialogBtn');

// Gestione pulsante Opzioni - Toggle dialog opzioni
if (optionsBtn) {
    optionsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (optionsDialog) {
            const isHidden = optionsDialog.classList.contains('hidden');
            optionsDialog.classList.toggle('hidden');
        }
    });
}

// Chiudi dialog opzioni con pulsante X
if (closeOptionsDialogBtn) {
    closeOptionsDialogBtn.addEventListener('click', () => {
        if (optionsDialog) {
            optionsDialog.classList.add('hidden');
        }
    });
}

// Chiudi dialog opzioni quando si clicca fuori
document.addEventListener('click', (e) => {
    if (optionsDialog && !optionsDialog.contains(e.target) && e.target !== optionsBtn && !optionsBtn?.contains(e.target)) {
        if (!optionsDialog.classList.contains('hidden')) {
            optionsDialog.classList.add('hidden');
        }
    }
});

// Gestione toggle modalità Studio/Quiz
const studyModeToggle = document.getElementById('studyModeToggle');
if (studyModeToggle) {
    const modeLabelLeft = document.querySelector('.mode-label-left');
    const modeLabelRight = document.querySelector('.mode-label-right');
    
    // Funzione per aggiornare l'evidenziazione delle label
    function updateModeLabels() {
        if (studyModeToggle.checked) {
            // Studio attivo
            if (modeLabelLeft) modeLabelLeft.classList.remove('active');
            if (modeLabelRight) modeLabelRight.classList.add('active');
        } else {
            // Quiz attivo
            if (modeLabelLeft) modeLabelLeft.classList.add('active');
            if (modeLabelRight) modeLabelRight.classList.remove('active');
        }
    }
    
    // Carica lo stato salvato (default: Studio = checked)
    const savedMode = localStorage.getItem('studyMode');
    if (savedMode === 'quiz') {
        studyModeToggle.checked = false;
    } else {
        studyModeToggle.checked = true; // Default: Studio
    }
    
    // Aggiorna le label all'inizializzazione
    updateModeLabels();
    
    studyModeToggle.addEventListener('change', (e) => {
        const mode = e.target.checked ? 'study' : 'quiz';
        localStorage.setItem('studyMode', mode);
        updateModeLabels();
        updateExcludeSectionVisibility();
        // Aggiorna i pulsanti delle quantità quando cambia la modalità
        updateQuestionCountButtons();
    });
}

// Gestione sezione Escludi
const excludeSection = document.getElementById('excludeSection');
const excludeCompletedToggle = document.getElementById('excludeCompletedToggle');
const excludeLabelLeft = document.querySelector('.exclude-label-left');
const excludeLabelRight = document.querySelector('.exclude-label-right');

// Funzione per mostrare/nascondere la sezione Escludi
function updateExcludeSectionVisibility() {
    if (excludeSection && studyModeToggle) {
        if (studyModeToggle.checked) {
            // Modalità Studio: mostra la sezione Escludi
            excludeSection.classList.remove('hidden');
        } else {
            // Modalità Quiz: nascondi la sezione Escludi
            excludeSection.classList.add('hidden');
        }
    }
}

// Funzione per aggiornare l'evidenziazione delle label Escludi
function updateExcludeLabels() {
    if (excludeCompletedToggle) {
        if (excludeCompletedToggle.checked) {
            // Quiz superati selezionato
            if (excludeLabelLeft) excludeLabelLeft.classList.remove('active');
            if (excludeLabelRight) excludeLabelRight.classList.add('active');
        } else {
            // Quiz risposti selezionato (default)
            if (excludeLabelLeft) excludeLabelLeft.classList.add('active');
            if (excludeLabelRight) excludeLabelRight.classList.remove('active');
        }
    }
}

// Inizializza la sezione Escludi
if (excludeCompletedToggle) {
    // Carica lo stato salvato (default: quiz risposti = non checked, quindi slide a sinistra)
    const savedExcludeMode = localStorage.getItem('excludeMode');
    if (savedExcludeMode === 'passed') {
        excludeCompletedToggle.checked = true; // Quiz superati
    } else {
        excludeCompletedToggle.checked = false; // Quiz risposti (default)
    }
    
    // Aggiorna le label all'inizializzazione
    updateExcludeLabels();
    
    // Aggiorna la visibilità in base alla modalità
    updateExcludeSectionVisibility();
    
    excludeCompletedToggle.addEventListener('change', (e) => {
        const excludeMode = e.target.checked ? 'passed' : 'answered';
        localStorage.setItem('excludeMode', excludeMode);
        updateExcludeLabels();
        // Aggiorna i pulsanti delle quantità quando cambia l'esclusione
        updateQuestionCountButtons();
    });
}

// Chiudi dialog con pulsante X
if (closeDialogBtn) {
    closeDialogBtn.addEventListener('click', () => {
        if (categoriesDialog) {
            categoriesDialog.classList.add('hidden');
        }
    });
}

// Chiudi dialog quando si clicca fuori
document.addEventListener('click', (e) => {
    if (categoriesDialog && !categoriesDialog.contains(e.target) && e.target !== filterBtn && !filterBtn?.contains(e.target)) {
        if (!categoriesDialog.classList.contains('hidden')) {
            categoriesDialog.classList.add('hidden');
        }
    }
});

// Calcola le statistiche per categoria
function calculateCategoryStats() {
    const stats = JSON.parse(localStorage.getItem('quizStatistics') || '{"completed": 0, "history": []}');
    const categoryStats = {};
    
    // Inizializza tutte le categorie e sottocategorie a 0 (dal JSON)
    const allCategories = ['FARMACOLOGIA', 'CHIMICA_FARMACEUTICA', 'LEGISLAZIONE', 'MICROBIOLOGIA', 
                          'FARMACEUTICA', 'CHIMICA_ANALITICA', 'FARMACOGNOSIA', 'COSMETOLOGIA', 
                          'ECONOMIA_FARMACEUTICA', 'ALTRO'];
    
    allCategories.forEach(category => {
        categoryStats[category] = { correct: 0, total: 0 };
    });
    
    // Aggiungi tutte le sottocategorie presenti nel JSON
    allQuizzes.forEach(quiz => {
        if (quiz.subcategory) {
            categoryStats[quiz.subcategory] = categoryStats[quiz.subcategory] || { correct: 0, total: 0 };
        }
    });
    
    // Se allQuizzes non è ancora caricato, caricalo ora
    if (allQuizzes.length === 0) {
        try {
            // Prova prima con process.cwd() che è più affidabile nel renderer process
            let dataPath = path.join(process.cwd(), 'quiz-data.json');
            let rawData;
            try {
                rawData = fs.readFileSync(dataPath, 'utf8');
            } catch (e) {
                // Se fallisce, prova con __dirname
                dataPath = path.join(__dirname, '..', '..', 'quiz-data.json');
                rawData = fs.readFileSync(dataPath, 'utf8');
            }
            const data = JSON.parse(rawData);
            allQuizzes = data.quizzes;
        } catch (error) {
            return categoryStats; // Ritorna statistiche vuote se non riesce a caricare i quiz
        }
    }
    
    // Calcola il totale di quiz disponibili per ogni categoria e sottocategoria nel file quiz-data.json
    allQuizzes.forEach(quiz => {
        if (quiz.category && categoryStats[quiz.category]) {
            categoryStats[quiz.category].total++;
        }
        
        // Calcola anche i totali per le sottocategorie (dal JSON)
        if (quiz.subcategory && categoryStats[quiz.subcategory]) {
            categoryStats[quiz.subcategory].total++;
        }
    });
    
    // Calcola le risposte corrette per categoria usando studyModeStatus (stato finale)
    // IMPORTANTE: Conta solo lo stato finale, non tutte le occorrenze nello storico
    // Questo evita di contare più volte la stessa domanda se appare in più sessioni
    try {
        const studyStatus = JSON.parse(localStorage.getItem('studyModeStatus') || '{}');
        
        // Itera su tutti i quiz e controlla lo stato finale in studyModeStatus
        allQuizzes.forEach(quiz => {
            const questionId = Number(quiz.id);
            if (isNaN(questionId)) return;
            
            // Leggi lo stato come stringa per consistenza
            const idStr = String(questionId);
            const finalStatus = studyStatus[idStr];
            
            // Conta solo se lo stato finale è 'passed' (superata)
            if (finalStatus === 'passed') {
                const category = quiz.category;
                const subcategory = quiz.subcategory;
                
                // Conta per la categoria principale
                if (category && categoryStats[category]) {
                    categoryStats[category].correct++;
                }
                
                // Conta anche per la sottocategoria se presente
                if (subcategory && categoryStats[subcategory]) {
                    categoryStats[subcategory].correct++;
                }
            }
        });
    } catch (error) {
        console.error('Errore nel calcolo statistiche categoria da studyModeStatus:', error);
        // Fallback: usa il metodo vecchio se studyModeStatus non è disponibile
        if (stats.history && Array.isArray(stats.history)) {
            // Usa solo le sessioni di studio (non quelle di quiz)
            const studySessions = stats.history.filter(session => session.studyMode === 'study');
            const questionIdsCounted = new Set(); // Evita doppi conteggi
            
            studySessions.forEach((quiz) => {
                if (quiz.details && Array.isArray(quiz.details)) {
                    quiz.details.forEach((detail) => {
                        const questionId = Number(detail.questionId);
                        if (isNaN(questionId)) return;
                        
                        // Conta solo se non è già stato contato e se è corretta
                        if (!questionIdsCounted.has(questionId) && detail.isCorrect) {
                            questionIdsCounted.add(questionId);
                            
                            let category = detail.category;
                            
                            // Se la categoria non è presente, cerca il quiz originale
                            if (!category && allQuizzes.length > 0) {
                                const originalQuiz = allQuizzes.find(q => q.id === questionId);
                                if (originalQuiz && originalQuiz.category) {
                                    category = originalQuiz.category;
                                }
                            }
                            
                            if (category && categoryStats[category]) {
                                categoryStats[category].correct++;
                            }
                            
                            // Conta anche per la sottocategoria
                            if (allQuizzes.length > 0) {
                                const originalQuiz = allQuizzes.find(q => q.id === questionId);
                                if (originalQuiz && originalQuiz.subcategory && categoryStats[originalQuiz.subcategory]) {
                                    categoryStats[originalQuiz.subcategory].correct++;
                                }
                            }
                        }
                    });
                }
            });
        }
    }
    
    return categoryStats;
}

// Aggiorna le statistiche visualizzate nel dialog
function updateCategoryStats() {
    const categoryStats = calculateCategoryStats();
    
    // Cerca gli elementi all'interno del dialog delle categorie
    const categoriesDialog = document.getElementById('categoriesDialog');
    const container = document.getElementById('categoriesDialogContent');
    let statsElements;
    
    if (container) {
        statsElements = container.querySelectorAll('.category-stats');
    } else {
        statsElements = document.querySelectorAll('.category-stats');
    }
    
    if (statsElements.length === 0) {
        // Se gli elementi non sono ancora stati generati, prova a generarli
        if (container && allQuizzes.length > 0) {
            generateCategoryFilters();
            return;
        }
        return;
    }
    
    statsElements.forEach(element => {
        const category = element.getAttribute('data-category');
        if (category && categoryStats[category]) {
            const stats = categoryStats[category];
            if (stats.total > 0) {
                element.textContent = `${stats.correct}/${stats.total}`;
            } else {
                element.textContent = '-';
            }
        } else {
            element.textContent = '-';
        }
    });
}

// Carica le categorie selezionate dal localStorage
function loadSelectedCategories() {
    const savedCategories = localStorage.getItem('selectedCategories');
    if (savedCategories) {
        const categories = JSON.parse(savedCategories);
        categoryCheckboxes.forEach(checkbox => {
            checkbox.checked = categories.includes(checkbox.value);
        });
    }
    
    // Aggiorna anche le statistiche dopo che i quiz sono stati caricati
    // Non chiamare updateCategoryStats qui, verrà chiamata in init() dopo loadQuizData()
}

// La sincronizzazione tra categoria padre e sottocategorie è gestita in setupCategorySyncListeners()

// Salva le categorie selezionate nel localStorage
function saveSelectedCategories() {
    // La sincronizzazione categoria padre/sottocategorie è gestita in setupCategorySyncListeners()
    
    const selectedCategories = Array.from(categoryCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    localStorage.setItem('selectedCategories', JSON.stringify(selectedCategories));
    
    // Aggiorna i pulsanti delle quantità
    updateQuestionCountButtons();
    
    // Aggiorna le statistiche (potrebbero essere cambiate dopo un quiz)
    updateCategoryStats();
}

// Le categorie vengono caricate dinamicamente in generateCategoryFilters()
// e gli event listener vengono impostati in setupCategorySyncListeners()

// Pulsante "Seleziona Tutto"
const selectAllBtn = document.getElementById('selectAllBtn');
if (selectAllBtn) {
    selectAllBtn.addEventListener('click', () => {
        categoryCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        // La sincronizzazione verrà gestita da saveSelectedCategories
        saveSelectedCategories();
        updateQuestionCountButtons();
    });
}

// Pulsante "Deseleziona Tutto"
const deselectAllBtn = document.getElementById('deselectAllBtn');
if (deselectAllBtn) {
    deselectAllBtn.addEventListener('click', () => {
        categoryCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        // La sincronizzazione verrà gestita da saveSelectedCategories
        saveSelectedCategories();
        updateQuestionCountButtons();
    });
}

// Aggiorna le statistiche quando si apre il dialog
if (categoriesDialog) {
    // Usa MutationObserver per rilevare quando il dialog viene mostrato
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                if (!categoriesDialog.classList.contains('hidden')) {
                    updateCategoryStats();
                }
            }
        });
    });
    observer.observe(categoriesDialog, { attributes: true, attributeFilter: ['class'] });
}

// Gestione versione applicazione
ipcRenderer.on('app-version', (event, version) => {
    const versionElement = document.getElementById('appVersion');
    if (versionElement) {
        versionElement.textContent = version;
    }
});

// Richiedi la versione se non è ancora stata inviata
ipcRenderer.send('request-app-version');

// Funzione per aprire i DevTools (disponibile globalmente)
window.openDevTools = function() {
    ipcRenderer.send('open-devtools');
};

// Apri automaticamente i DevTools
window.openDevTools();

// Inizializzazione all'avvio
async function init() {
    // Carica i quiz
    const loaded = await loadQuizData();
    if (loaded) {
        // Genera dinamicamente le categorie nel dialog
        // generateCategoryFilters() chiamerà updateCategoryStats() internamente
        generateCategoryFilters();
        
        // Aggiorna i pulsanti in base alle categorie caricate
        updateQuestionCountButtons();
    }
}

// Avvia l'inizializzazione quando il DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

