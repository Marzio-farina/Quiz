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
    
    const filtered = allQuizzes.filter(quiz => 
        selectedCategories.includes(quiz.category)
    );
    
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
const optionsBtn = document.getElementById('optionsBtn');
const closeDialogBtn = document.getElementById('closeDialogBtn');
categoryCheckboxes = document.querySelectorAll('.category-checkbox input[type="checkbox"]');

// Gestione pulsante Opzioni - Toggle dialog
if (optionsBtn) {
    optionsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (categoriesDialog) {
            categoriesDialog.classList.toggle('hidden');
        }
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
    if (categoriesDialog && !categoriesDialog.contains(e.target) && e.target !== optionsBtn) {
        if (!categoriesDialog.classList.contains('hidden')) {
            categoriesDialog.classList.add('hidden');
        }
    }
});

// Carica le categorie selezionate dal localStorage
function loadSelectedCategories() {
    const savedCategories = localStorage.getItem('selectedCategories');
    if (savedCategories) {
        const categories = JSON.parse(savedCategories);
        categoryCheckboxes.forEach(checkbox => {
            checkbox.checked = categories.includes(checkbox.value);
        });
    }
}

// Salva le categorie selezionate nel localStorage
function saveSelectedCategories() {
    const selectedCategories = Array.from(categoryCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    localStorage.setItem('selectedCategories', JSON.stringify(selectedCategories));
    
    // Aggiorna i pulsanti delle quantità
    updateQuestionCountButtons();
}

// Carica le categorie all'avvio
loadSelectedCategories();

// Salva quando cambia una selezione
categoryCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', saveSelectedCategories);
});

// Pulsante "Seleziona Tutto"
const selectAllBtn = document.getElementById('selectAllBtn');
if (selectAllBtn) {
    selectAllBtn.addEventListener('click', () => {
        categoryCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
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
        saveSelectedCategories();
        updateQuestionCountButtons();
    });
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
    }
}

// Avvia l'inizializzazione quando il DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

