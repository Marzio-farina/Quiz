// Script del renderer process - Home page
const { ipcRenderer } = require('electron');

// Stato dell'applicazione
let selectedQuestionCount = 10;
let isRandomMode = false;

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

// Log di conferma caricamento
console.log('Home page caricata correttamente');

