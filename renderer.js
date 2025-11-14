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
}

// Inizializza il tema all'avvio
initTheme();

// Gestione click sul toggle tema
document.getElementById('themeToggle').addEventListener('click', toggleTheme);

// Gestione pulsante minimizza applicazione
document.getElementById('minimizeAppBtn').addEventListener('click', () => {
    ipcRenderer.send('minimize-window');
});

// Gestione pulsante chiudi applicazione
document.getElementById('closeAppBtn').addEventListener('click', () => {
    window.close();
});

// Carica i quiz dal JSON
async function loadQuizData() {
    try {
        const dataPath = path.join(__dirname, 'quiz-data.json');
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

// I pulsanti vengono ora gestiti dinamicamente da updateQuestionCountButtons()

// Gestione checkbox Random
document.getElementById('randomCheck').addEventListener('change', (e) => {
    isRandomMode = e.target.checked;
});

// Riferimento ai checkbox delle categorie (definito qui per essere usato dopo)
let categoryCheckboxes;

// Gestione pulsante Inizia Quiz
document.getElementById('startBtn').addEventListener('click', () => {
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

// Gestione pulsante Statistiche
document.getElementById('statsBtn').addEventListener('click', () => {
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
    categoriesDialog.classList.toggle('hidden');
});

// Chiudi dialog con pulsante X
closeDialogBtn.addEventListener('click', () => {
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
});

// Pulsante "Deseleziona Tutto"
document.getElementById('deselectAllBtn').addEventListener('click', () => {
    categoryCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    saveSelectedCategories();
    updateQuestionCountButtons();
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

// Gestione versione applicazione
ipcRenderer.on('app-version', (event, version) => {
    const versionElement = document.getElementById('appVersion');
    if (versionElement) {
        versionElement.textContent = version;
    }
});

// Gestione aggiornamenti
const updateDialog = document.getElementById('updateDialog');
const updateVersion = document.getElementById('updateVersion');
const downloadProgress = document.getElementById('downloadProgress');
const progressFill = document.getElementById('progressFill');
const progressPercent = document.getElementById('progressPercent');
const downloadBtn = document.getElementById('downloadBtn');
const installBtn = document.getElementById('installBtn');
const laterBtn = document.getElementById('laterBtn');

// Quando c'è un aggiornamento disponibile
ipcRenderer.on('update-available', (event, info) => {
    console.log('📦 Nuova versione disponibile:', info.version);
    updateVersion.textContent = info.version;
    updateDialog.style.display = 'flex';
    document.body.classList.add('dialog-open');
});

// Progresso download
ipcRenderer.on('download-progress', (event, percent) => {
    downloadProgress.style.display = 'block';
    progressFill.style.width = `${percent}%`;
    progressPercent.textContent = Math.round(percent);
});

// Download completato
ipcRenderer.on('update-downloaded', () => {
    downloadProgress.style.display = 'none';
    downloadBtn.style.display = 'none';
    installBtn.style.display = 'block';
});

// Pulsante "Scarica Ora"
downloadBtn.addEventListener('click', () => {
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Download in corso...';
    ipcRenderer.send('download-update');
});

// Pulsante "Installa e Riavvia"
installBtn.addEventListener('click', () => {
    ipcRenderer.send('install-update');
});

// Pulsante "Più tardi"
laterBtn.addEventListener('click', () => {
    updateDialog.style.display = 'none';
    document.body.classList.remove('dialog-open');
});

