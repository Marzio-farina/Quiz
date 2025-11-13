// Script del renderer process - Home page
const { ipcRenderer } = require('electron');
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
    
    console.log(`Tema cambiato: ${isDark ? 'Scuro' : 'Chiaro'}`);
}

// Inizializza il tema all'avvio
initTheme();

// Gestione click sul toggle tema
document.getElementById('themeToggle').addEventListener('click', toggleTheme);

// Carica i quiz dal JSON
async function loadQuizData() {
    try {
        const dataPath = path.join(__dirname, 'quiz-data.json');
        const rawData = fs.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(rawData);
        allQuizzes = data.quizzes;
        console.log(`✅ Caricati ${allQuizzes.length} quiz dal database`);
        return true;
    } catch (error) {
        console.error('❌ Errore nel caricamento dei quiz:', error);
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
    console.log(`📊 Quiz disponibili per le categorie selezionate: ${availableQuizCount}`);
    
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
        console.log(`⚠️ Selezione ridotta a ${selectedQuestionCount} (massimo disponibile)`);
    }
    
    // Se la selezione corrente non è tra i pulsanti disponibili, seleziona il più vicino
    if (!buttonsToShow.includes(selectedQuestionCount)) {
        selectedQuestionCount = maxAvailable;
    }
    
    // Ottieni il contenitore dei pulsanti
    const container = document.querySelector('.question-count-options');
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
            console.log(`Numero di domande selezionato: ${selectedQuestionCount}`);
        });
        
        container.appendChild(button);
    });
}

// I pulsanti vengono ora gestiti dinamicamente da updateQuestionCountButtons()

// Gestione checkbox Random
document.getElementById('randomCheck').addEventListener('change', (e) => {
    isRandomMode = e.target.checked;
    console.log(`Modalità Random: ${isRandomMode ? 'Attiva' : 'Disattiva'}`);
});

// Riferimento ai checkbox delle categorie (definito qui per essere usato dopo)
let categoryCheckboxes;

// Gestione pulsante Inizia Quiz
document.getElementById('startBtn').addEventListener('click', () => {
    console.log('=== Avvio Quiz ===');
    console.log(`Domande: ${selectedQuestionCount}`);
    console.log(`Random: ${isRandomMode}`);
    
    // Ottieni le categorie selezionate
    const selectedCategories = Array.from(categoryCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    
    console.log(`Categorie selezionate: ${selectedCategories.join(', ')}`);
    
    // Salva le impostazioni e carica la pagina quiz
    const settings = {
        count: selectedQuestionCount,
        random: isRandomMode,
        categories: selectedCategories
    };
    
    // Passa le impostazioni al main process
    ipcRenderer.send('load-quiz-page', settings);
});

// Gestione pulsante Statistiche
document.getElementById('statsBtn').addEventListener('click', () => {
    console.log('📊 Apertura pagina statistiche');
    // Naviga alla pagina statistiche
    window.location.href = 'pages/statistics/statistics.html';
});

// Gestione dialog categorie
const categoriesDialog = document.getElementById('categoriesDialog');
const optionsBtn = document.getElementById('optionsBtn');
const closeDialogBtn = document.getElementById('closeDialogBtn');
categoryCheckboxes = document.querySelectorAll('.category-checkbox input[type="checkbox"]');

// Gestione pulsante Opzioni - Toggle dialog
optionsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    console.log('⚙️ Toggle dialog categorie');
    categoriesDialog.classList.toggle('hidden');
});

// Chiudi dialog con pulsante X
closeDialogBtn.addEventListener('click', () => {
    console.log('Chiusura dialog categorie');
    categoriesDialog.classList.add('hidden');
});

// Chiudi dialog quando si clicca fuori
document.addEventListener('click', (e) => {
    if (!categoriesDialog.contains(e.target) && e.target !== optionsBtn) {
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
    console.log('Categorie salvate:', selectedCategories);
    
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
document.getElementById('selectAllBtn').addEventListener('click', () => {
    categoryCheckboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
    saveSelectedCategories();
    updateQuestionCountButtons();
    console.log('Tutte le categorie selezionate');
});

// Pulsante "Deseleziona Tutto"
document.getElementById('deselectAllBtn').addEventListener('click', () => {
    categoryCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    saveSelectedCategories();
    updateQuestionCountButtons();
    console.log('Tutte le categorie deselezionate');
});

// Inizializzazione all'avvio
async function init() {
    // Carica i quiz
    const loaded = await loadQuizData();
    if (loaded) {
        // Aggiorna i pulsanti in base alle categorie caricate
        updateQuestionCountButtons();
    }
}

// Avvia l'inizializzazione
init();

// Log di conferma caricamento
console.log('Home page caricata correttamente');

