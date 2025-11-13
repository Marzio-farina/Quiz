// Script del renderer process - Home page
const { ipcRenderer } = require('electron');

// Stato dell'applicazione
let selectedQuestionCount = 10;
let isRandomMode = false;

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

// Gestione dei button per il numero di domande (comportamento radio)
const optionButtons = document.querySelectorAll('.option-btn');

optionButtons.forEach(button => {
    button.addEventListener('click', () => {
        optionButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        selectedQuestionCount = parseInt(button.dataset.count);
        console.log(`Numero di domande selezionato: ${selectedQuestionCount}`);
    });
});

// Gestione checkbox Random
document.getElementById('randomCheck').addEventListener('change', (e) => {
    isRandomMode = e.target.checked;
    console.log(`Modalità Random: ${isRandomMode ? 'Attiva' : 'Disattiva'}`);
});

// Gestione pulsante Inizia Quiz
document.getElementById('startBtn').addEventListener('click', () => {
    console.log('=== Avvio Quiz ===');
    console.log(`Domande: ${selectedQuestionCount}`);
    console.log(`Random: ${isRandomMode}`);
    
    // Salva le impostazioni e carica la pagina quiz
    const settings = {
        count: selectedQuestionCount,
        random: isRandomMode
    };
    
    // Passa le impostazioni al main process
    ipcRenderer.send('load-quiz-page', settings);
});

// Gestione pulsante Statistiche
document.getElementById('statsBtn').addEventListener('click', () => {
    console.log('📊 Statistiche cliccate - Funzionalità da implementare');
    // TODO: Implementare la visualizzazione delle statistiche
    alert('📊 Statistiche\n\nFunzionalità in arrivo!\nQui potrai vedere:\n- Quiz completati\n- Punteggio medio\n- Tempo medio\n- Storico risultati');
});

// Log di conferma caricamento
console.log('Home page caricata correttamente');

