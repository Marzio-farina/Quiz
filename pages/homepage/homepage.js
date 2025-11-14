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
    // Carica il tema salvato dal localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    
    // Salva la preferenza
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
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
    try {
        const dataPath = path.join(__dirname, '..', '..', 'quiz-data.json');
        const rawData = fs.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(rawData);
        allQuizzes = data.quizzes;
        return true;
    } catch (error) {
        return false;
    }
}

// Conta i quiz disponibili per le categorie selezionate
function countAvailableQuizzes(selectedCategories) {
    if (!selectedCategories || selectedCategories.length === 0) {
        return allQuizzes.length;
    }
    
    const filtered = allQuizzes.filter(quiz => {
        // Se la categoria principale è selezionata, includi tutti i quiz di quella categoria
        if (selectedCategories.includes(quiz.category)) {
            return true;
        }
        
        // Controlla se una sottocategoria è selezionata
        // Cerca pattern categoria_N (es. FARMACOLOGIA_1, FARMACOLOGIA_2, ecc.)
        const subcategoryMatch = selectedCategories.find(cat => {
            if (cat.includes('_') && cat.startsWith(quiz.category + '_')) {
                const subcategoryNum = parseInt(cat.split('_')[1]);
                if (!isNaN(subcategoryNum)) {
                    // Calcola l'indice della sottocategoria basandosi sulla posizione del quiz nella categoria
                    const categoryQuizzes = allQuizzes.filter(q => q.category === quiz.category).sort((a, b) => a.id - b.id);
                    const quizIndex = categoryQuizzes.findIndex(q => q.id === quiz.id);
                    const subcategoryIndex = Math.floor(quizIndex / 500);
                    return subcategoryIndex === (subcategoryNum - 1);
                }
            }
            return false;
        });
        
        return !!subcategoryMatch;
    });
    
    return filtered.length;
}

// Aggiorna dinamicamente i pulsanti delle quantità in base alle categorie
function updateQuestionCountButtons() {
    const selectedCategories = Array.from(categoryCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    
    availableQuizCount = countAvailableQuizzes(selectedCategories);
    
    // Valori standard dei pulsanti
    const standardButtons = [10, 20, 50, 100];
    
    // Determina quali pulsanti mostrare
    let buttonsToShow = standardButtons.filter(count => count <= availableQuizCount);
    
    // Se il massimo disponibile non è tra i valori standard, aggiungilo
    if (availableQuizCount > 20 && availableQuizCount < 100 && !standardButtons.includes(availableQuizCount)) {
        buttonsToShow = buttonsToShow.filter(count => count < availableQuizCount);
        buttonsToShow.push(availableQuizCount);
    }
    
    // Assicurati che ci sia almeno un pulsante
    if (buttonsToShow.length === 0) {
        buttonsToShow = [Math.min(10, availableQuizCount)];
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
        
        // Salva le impostazioni e carica la pagina quiz
        const settings = {
            count: selectedQuestionCount,
            random: isRandomMode,
            categories: selectedCategories
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

// Genera dinamicamente le categorie nel dialog
function generateCategoryFilters() {
    const container = document.getElementById('categoriesDialogContent');
    if (!container) {
        console.warn('categoriesDialogContent non trovato');
        return;
    }
    if (allQuizzes.length === 0) {
        console.warn('Nessun quiz caricato');
        return;
    }
    
    // Raggruppa i quiz per categoria
    const categoryGroups = {};
    allQuizzes.forEach(quiz => {
        if (!categoryGroups[quiz.category]) {
            categoryGroups[quiz.category] = [];
        }
        categoryGroups[quiz.category].push(quiz);
    });
    
    // Ordina le categorie
    const allCategories = ['FARMACOLOGIA', 'CHIMICA_FARMACEUTICA', 'LEGISLAZIONE', 'MICROBIOLOGIA', 
                          'FARMACEUTICA', 'CHIMICA_ANALITICA', 'FARMACOGNOSIA', 'COSMETOLOGIA', 
                          'ECONOMIA_FARMACEUTICA', 'ALTRO'];
    
    container.innerHTML = '';
    
    allCategories.forEach(category => {
        const quizzes = categoryGroups[category] || [];
        const quizCount = quizzes.length;
        
        // Crea la checkbox principale della categoria
        const categoryLabel = document.createElement('label');
        categoryLabel.className = 'category-checkbox';
        categoryLabel.innerHTML = `
            <input type="checkbox" value="${category}" checked>
            <span>${categoryIcons[category] || '📌'} ${categoryNames[category] || category}</span>
            <span class="category-stats" data-category="${category}">-</span>
        `;
        container.appendChild(categoryLabel);
        
        // Se la categoria ha più di 500 quiz, crea le sottocategorie
        if (quizCount > 500) {
            const numSubcategories = Math.ceil(quizCount / 500);
            const sortedQuizzes = quizzes.sort((a, b) => a.id - b.id);
            
            for (let i = 0; i < numSubcategories; i++) {
                const startIndex = i * 500;
                const endIndex = Math.min(startIndex + 500, quizCount);
                const startId = sortedQuizzes[startIndex]?.id || (startIndex + 1);
                const endId = sortedQuizzes[endIndex - 1]?.id || endIndex;
                
                const subcategoryLabel = document.createElement('label');
                subcategoryLabel.className = 'category-checkbox subcategory';
                subcategoryLabel.innerHTML = `
                    <input type="checkbox" value="${category}_${i + 1}" checked>
                    <span>📚 Parte ${i + 1}</span>
                    <span class="category-stats" data-category="${category}_${i + 1}">-</span>
                `;
                container.appendChild(subcategoryLabel);
            }
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
            
            // Gestione sincronizzazione FARMACOLOGIA e sottocategorie
            const subcategoryCheckboxes = Array.from(categoryCheckboxes)
                .filter(cb => cb.value.startsWith(checkboxValue + '_'));
            
            const parentCategory = checkboxValue.split('_')[0];
            const parentCheckbox = Array.from(categoryCheckboxes)
                .find(cb => cb.value === parentCategory);
            
            if (checkboxValue === parentCategory && parentCheckbox) {
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
            } else if (checkboxValue.includes('_') && parentCheckbox) {
                // Se viene deselezionata una sottocategoria, deseleziona la categoria principale
                if (!e.target.checked && parentCheckbox.checked) {
                    parentCheckbox.checked = false;
                }
                
                // Se tutte le sottocategorie sono spuntate, spunta la categoria principale
                if (e.target.checked) {
                    const allSubcategoriesChecked = subcategoryCheckboxes.every(sub => sub.checked);
                    if (allSubcategoriesChecked && !parentCheckbox.checked) {
                        parentCheckbox.checked = true;
                    }
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
    filterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (categoriesDialog) {
            const isHidden = categoriesDialog.classList.contains('hidden');
            categoriesDialog.classList.toggle('hidden');
            // Se stiamo aprendo il dialog, assicurati che gli elementi siano stati generati
            if (isHidden) {
                const container = document.getElementById('categoriesDialogContent');
                // Se il container è vuoto o non ci sono elementi, genera le categorie
                if (!container || container.children.length === 0 || document.querySelectorAll('.category-stats').length === 0) {
                    if (allQuizzes.length > 0) {
                        generateCategoryFilters();
                    } else {
                        // Se i quiz non sono ancora caricati, aspetta un po'
                        setTimeout(() => {
                            if (allQuizzes.length > 0) {
                                generateCategoryFilters();
                            }
                        }, 100);
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
        console.log('Modalità cambiata:', mode);
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
    
    // Inizializza tutte le categorie a 0
    const allCategories = ['FARMACOLOGIA', 'CHIMICA_FARMACEUTICA', 'LEGISLAZIONE', 'MICROBIOLOGIA', 
                          'FARMACEUTICA', 'CHIMICA_ANALITICA', 'FARMACOGNOSIA', 'COSMETOLOGIA', 
                          'ECONOMIA_FARMACEUTICA', 'ALTRO'];
    
    allCategories.forEach(category => {
        categoryStats[category] = { correct: 0, total: 0 };
        
        // Aggiungi sottocategorie se la categoria ha più di 500 quiz
        const categoryQuizzes = allQuizzes.filter(q => q.category === category);
        if (categoryQuizzes.length > 500) {
            const numSubcategories = Math.ceil(categoryQuizzes.length / 500);
            for (let i = 1; i <= numSubcategories; i++) {
                categoryStats[`${category}_${i}`] = { correct: 0, total: 0 };
            }
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
            console.error('Errore nel caricamento dei quiz per le statistiche:', error);
            return categoryStats; // Ritorna statistiche vuote se non riesce a caricare i quiz
        }
    }
    
    // Calcola il totale di quiz disponibili per ogni categoria nel file quiz-data.json
    allQuizzes.forEach(quiz => {
        if (quiz.category && categoryStats[quiz.category]) {
            categoryStats[quiz.category].total++;
        }
        
        // Calcola anche i totali per le sottocategorie (se esistono)
        const categoryQuizzes = allQuizzes.filter(q => q.category === quiz.category).sort((a, b) => a.id - b.id);
        if (categoryQuizzes.length > 500) {
            const quizIndex = categoryQuizzes.findIndex(q => q.id === quiz.id);
            if (quizIndex >= 0) {
                const subcategoryIndex = Math.floor(quizIndex / 500) + 1;
                const subcategoryKey = `${quiz.category}_${subcategoryIndex}`;
                if (categoryStats[subcategoryKey]) {
                    categoryStats[subcategoryKey].total++;
                }
            }
        }
    });
    
    // Calcola le risposte corrette per categoria da tutti i quiz completati
    if (stats.history && Array.isArray(stats.history)) {
        let updated = false;
        stats.history.forEach((quiz) => {
            if (quiz.details && Array.isArray(quiz.details)) {
                quiz.details.forEach((detail) => {
                    let category = detail.category;
                    
                    // Se la categoria non è presente, cerca il quiz originale usando questionId
                    if (!category && detail.questionId) {
                        if (allQuizzes.length > 0) {
                            const originalQuiz = allQuizzes.find(q => q.id === detail.questionId);
                            if (originalQuiz && originalQuiz.category) {
                                category = originalQuiz.category;
                                // Aggiorna il dettaglio con la categoria trovata (per future chiamate)
                                detail.category = category;
                                updated = true;
                            }
                        }
                    }
                    
                    // Conta solo le risposte corrette
                    if (category && detail.isCorrect) {
                        categoryStats[category] = categoryStats[category] || { correct: 0, total: 0 };
                        categoryStats[category].correct++;
                        
                        // Conta anche per le sottocategorie (se esistono)
                        const categoryQuizzes = allQuizzes.filter(q => q.category === category).sort((a, b) => a.id - b.id);
                        if (categoryQuizzes.length > 500) {
                            const quizIndex = categoryQuizzes.findIndex(q => q.id === detail.questionId);
                            if (quizIndex >= 0) {
                                const subcategoryIndex = Math.floor(quizIndex / 500) + 1;
                                const subcategoryKey = `${category}_${subcategoryIndex}`;
                                categoryStats[subcategoryKey] = categoryStats[subcategoryKey] || { correct: 0, total: 0 };
                                categoryStats[subcategoryKey].correct++;
                            }
                        }
                    }
                });
            }
        });
        
        // Salva le statistiche aggiornate con le categorie recuperate solo se abbiamo fatto aggiornamenti
        if (updated) {
            localStorage.setItem('quizStatistics', JSON.stringify(stats));
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
    
    console.log('Statistiche calcolate:', categoryStats);
    console.log('Elementi trovati:', statsElements.length);
    console.log('Container presente:', !!container);
    console.log('Dialog presente:', !!categoriesDialog);
    
    if (statsElements.length === 0) {
        console.warn('Nessun elemento .category-stats trovato');
        // Se gli elementi non sono ancora stati generati, prova a generarli
        if (container && allQuizzes.length > 0) {
            console.log('Tentativo di generare le categorie...');
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
                console.log(`Categoria ${category}: ${stats.correct}/${stats.total}`);
            } else {
                element.textContent = '-';
            }
        } else {
            element.textContent = '-';
            if (category) {
                console.log(`Categoria ${category}: nessuna statistica (total: ${categoryStats[category]?.total || 0})`);
            }
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

