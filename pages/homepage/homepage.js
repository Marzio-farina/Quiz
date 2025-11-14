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
        if (quiz.category === 'FARMACOLOGIA') {
            const farmacologiaQuizzes = allQuizzes.filter(q => q.category === 'FARMACOLOGIA').sort((a, b) => a.id - b.id);
            const quizIndex = farmacologiaQuizzes.findIndex(q => q.id === quiz.id);
            
            if (quizIndex >= 0 && quizIndex < 500 && selectedCategories.includes('FARMACOLOGIA_1')) {
                return true;
            }
            if (quizIndex >= 500 && quizIndex < 1000 && selectedCategories.includes('FARMACOLOGIA_2')) {
                return true;
            }
            if (quizIndex >= 1000 && quizIndex < 1500 && selectedCategories.includes('FARMACOLOGIA_3')) {
                return true;
            }
            if (quizIndex >= 1500 && selectedCategories.includes('FARMACOLOGIA_4')) {
                return true;
            }
        }
        
        return false;
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

// Riferimento ai checkbox delle categorie
let categoryCheckboxes;

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

// Gestione dialog categorie
const categoriesDialog = document.getElementById('categoriesDialog');
const filterBtn = document.getElementById('filterBtn');
const optionsBtn = document.getElementById('optionsBtn');
const closeDialogBtn = document.getElementById('closeDialogBtn');
categoryCheckboxes = document.querySelectorAll('.category-checkbox input[type="checkbox"]');

// Gestione pulsante Filtri - Toggle dialog categorie
if (filterBtn) {
    filterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (categoriesDialog) {
            const isHidden = categoriesDialog.classList.contains('hidden');
            categoriesDialog.classList.toggle('hidden');
            // Se stiamo aprendo il dialog, aggiorna le statistiche
            if (isHidden) {
                setTimeout(() => {
                    updateCategoryStats();
                }, 50);
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
    const allCategories = ['FARMACOLOGIA', 'FARMACOLOGIA_1', 'FARMACOLOGIA_2', 'FARMACOLOGIA_3', 'FARMACOLOGIA_4',
                          'CHIMICA_FARMACEUTICA', 'LEGISLAZIONE', 'MICROBIOLOGIA', 
                          'FARMACEUTICA', 'CHIMICA_ANALITICA', 'FARMACOGNOSIA', 'COSMETOLOGIA', 
                          'ECONOMIA_FARMACEUTICA', 'ALTRO'];
    
    allCategories.forEach(category => {
        categoryStats[category] = { correct: 0, total: 0 };
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
    const farmacologiaQuizzes = allQuizzes.filter(q => q.category === 'FARMACOLOGIA').sort((a, b) => a.id - b.id);
    
    allQuizzes.forEach(quiz => {
        if (quiz.category && categoryStats[quiz.category]) {
            categoryStats[quiz.category].total++;
        }
        
        // Calcola anche i totali per le sottocategorie di FARMACOLOGIA
        if (quiz.category === 'FARMACOLOGIA') {
            const quizIndex = farmacologiaQuizzes.findIndex(q => q.id === quiz.id);
            if (quizIndex >= 0 && quizIndex < 500) {
                categoryStats['FARMACOLOGIA_1'].total++;
            } else if (quizIndex >= 500 && quizIndex < 1000) {
                categoryStats['FARMACOLOGIA_2'].total++;
            } else if (quizIndex >= 1000 && quizIndex < 1500) {
                categoryStats['FARMACOLOGIA_3'].total++;
            } else if (quizIndex >= 1500) {
                categoryStats['FARMACOLOGIA_4'].total++;
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
                        
                        // Conta anche per le sottocategorie di FARMACOLOGIA
                        if (category === 'FARMACOLOGIA') {
                            const farmacologiaQuizzes = allQuizzes.filter(q => q.category === 'FARMACOLOGIA').sort((a, b) => a.id - b.id);
                            const quizIndex = farmacologiaQuizzes.findIndex(q => q.id === detail.questionId);
                            
                            if (quizIndex >= 0 && quizIndex < 500) {
                                categoryStats['FARMACOLOGIA_1'] = categoryStats['FARMACOLOGIA_1'] || { correct: 0, total: 0 };
                                categoryStats['FARMACOLOGIA_1'].correct++;
                            } else if (quizIndex >= 500 && quizIndex < 1000) {
                                categoryStats['FARMACOLOGIA_2'] = categoryStats['FARMACOLOGIA_2'] || { correct: 0, total: 0 };
                                categoryStats['FARMACOLOGIA_2'].correct++;
                            } else if (quizIndex >= 1000 && quizIndex < 1500) {
                                categoryStats['FARMACOLOGIA_3'] = categoryStats['FARMACOLOGIA_3'] || { correct: 0, total: 0 };
                                categoryStats['FARMACOLOGIA_3'].correct++;
                            } else if (quizIndex >= 1500) {
                                categoryStats['FARMACOLOGIA_4'] = categoryStats['FARMACOLOGIA_4'] || { correct: 0, total: 0 };
                                categoryStats['FARMACOLOGIA_4'].correct++;
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
    const statsElements = document.querySelectorAll('.category-stats');
    
    console.log('Statistiche calcolate:', categoryStats);
    console.log('Elementi trovati:', statsElements.length);
    
    if (statsElements.length === 0) {
        console.warn('Nessun elemento .category-stats trovato');
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

// Gestisce la sincronizzazione tra categoria padre e sottocategorie
function syncParentSubcategories() {
    const farmacologiaCheckbox = document.querySelector('input[type="checkbox"][value="FARMACOLOGIA"]');
    const subcategoryCheckboxes = [
        document.querySelector('input[type="checkbox"][value="FARMACOLOGIA_1"]'),
        document.querySelector('input[type="checkbox"][value="FARMACOLOGIA_2"]'),
        document.querySelector('input[type="checkbox"][value="FARMACOLOGIA_3"]'),
        document.querySelector('input[type="checkbox"][value="FARMACOLOGIA_4"]')
    ].filter(cb => cb !== null);
    
    if (!farmacologiaCheckbox) return;
    
    // Se FARMACOLOGIA è spuntata, spunta tutte le sottocategorie
    if (farmacologiaCheckbox.checked) {
        subcategoryCheckboxes.forEach(sub => {
            if (!sub.checked) {
                sub.checked = true;
            }
        });
    } else {
        // Se una sottocategoria è deselezionata, deseleziona FARMACOLOGIA
        const allSubcategoriesChecked = subcategoryCheckboxes.every(sub => sub.checked);
        if (!allSubcategoriesChecked && farmacologiaCheckbox.checked) {
            farmacologiaCheckbox.checked = false;
        }
    }
}

// Salva le categorie selezionate nel localStorage
function saveSelectedCategories() {
    // Sincronizza categoria padre e sottocategorie
    syncParentSubcategories();
    
    const selectedCategories = Array.from(categoryCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    localStorage.setItem('selectedCategories', JSON.stringify(selectedCategories));
    
    // Aggiorna i pulsanti delle quantità
    updateQuestionCountButtons();
    
    // Aggiorna le statistiche (potrebbero essere cambiate dopo un quiz)
    updateCategoryStats();
}

// Carica le categorie all'avvio
loadSelectedCategories();

// Salva quando cambia una selezione
categoryCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
        const checkboxValue = e.target.value;
        
        // Gestione sincronizzazione FARMACOLOGIA e sottocategorie
        const subcategoryCheckboxes = [
            document.querySelector('input[type="checkbox"][value="FARMACOLOGIA_1"]'),
            document.querySelector('input[type="checkbox"][value="FARMACOLOGIA_2"]'),
            document.querySelector('input[type="checkbox"][value="FARMACOLOGIA_3"]'),
            document.querySelector('input[type="checkbox"][value="FARMACOLOGIA_4"]')
        ].filter(cb => cb !== null);
        
        const farmacologiaCheckbox = document.querySelector('input[type="checkbox"][value="FARMACOLOGIA"]');
        
        if (checkboxValue === 'FARMACOLOGIA') {
            // Se viene spuntata FARMACOLOGIA, spunta tutte le sottocategorie
            if (e.target.checked) {
                subcategoryCheckboxes.forEach(sub => {
                    sub.checked = true;
                });
            } else {
                // Se viene deselezionata FARMACOLOGIA, deseleziona tutte le sottocategorie
                subcategoryCheckboxes.forEach(sub => {
                    sub.checked = false;
                });
            }
        } else if (checkboxValue.startsWith('FARMACOLOGIA_')) {
            // Se viene deselezionata una sottocategoria, deseleziona FARMACOLOGIA
            if (!e.target.checked && farmacologiaCheckbox && farmacologiaCheckbox.checked) {
                farmacologiaCheckbox.checked = false;
            }
            
            // Se tutte le sottocategorie sono spuntate, spunta FARMACOLOGIA
            if (e.target.checked) {
                const allChecked = subcategoryCheckboxes.every(sub => sub.checked);
                if (allChecked && farmacologiaCheckbox && !farmacologiaCheckbox.checked) {
                    farmacologiaCheckbox.checked = true;
                }
            }
        }
        
        saveSelectedCategories();
    });
});

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
        // Aggiorna i pulsanti in base alle categorie caricate
        updateQuestionCountButtons();
        // Aggiorna anche le statistiche ora che i quiz sono caricati
        updateCategoryStats();
    }
}

// Avvia l'inizializzazione quando il DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

