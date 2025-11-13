// Script per la pagina del quiz
const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');

// Stato del quiz
let allQuizzes = [];
let currentQuizzes = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let quizSettings = {};

// Timer
let quizStartTime = null;
let timerInterval = null;
let elapsedSeconds = 0;
let isPaused = false;
let pausedTime = 0;

// Carica il tema salvato (mantiene il tema scelto nella home)
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
}

// Inizializza il tema all'avvio
initTheme();

// Funzioni Timer
function startTimer() {
    quizStartTime = Date.now();
    elapsedSeconds = 0;
    isPaused = false;
    pausedTime = 0;
    
    timerInterval = setInterval(() => {
        if (!isPaused) {
            elapsedSeconds = Math.floor((Date.now() - quizStartTime - pausedTime) / 1000);
            updateTimerDisplay();
        }
    }, 1000);
    
    console.log('⏱️ Timer avviato');
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        console.log(`⏱️ Timer fermato - Tempo totale: ${formatTime(elapsedSeconds)}`);
    }
}

function togglePauseTimer() {
    const timerElement = document.querySelector('.quiz-timer');
    
    if (isPaused) {
        // Se già in pausa, non fare nulla (la ripresa avviene dal dialog)
        return;
    } else {
        // Metti in pausa il timer
        isPaused = true;
        pauseStartTime = Date.now();
        timerElement.classList.add('paused');
        showPauseDialog();
        console.log('⏸️ Timer in pausa');
    }
}

function showPauseDialog() {
    const dialog = document.getElementById('pauseDialog');
    dialog.style.display = 'flex';
}

function hidePauseDialog() {
    const dialog = document.getElementById('pauseDialog');
    dialog.style.display = 'none';
}

function resumeQuiz() {
    const timerElement = document.querySelector('.quiz-timer');
    
    // Riprendi il timer
    isPaused = false;
    const resumeTime = Date.now();
    pausedTime += resumeTime - pauseStartTime;
    timerElement.classList.remove('paused');
    hidePauseDialog();
    console.log('▶️ Timer ripreso');
}

function exitQuizFromPause() {
    hidePauseDialog();
    exitQuiz();
}

let pauseStartTime = 0;

function updateTimerDisplay() {
    const display = document.getElementById('timerDisplay');
    if (display) {
        display.textContent = formatTime(elapsedSeconds);
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Ricevi le impostazioni dalla pagina home
ipcRenderer.on('start-quiz', (event, settings) => {
    quizSettings = settings;
    console.log('Impostazioni ricevute:', settings);
    initQuiz();
});

// Carica i quiz dal JSON
async function loadQuizData() {
    try {
        // Path relativo dalla cartella pages/quiz alla root
        const dataPath = path.join(__dirname, '..', '..', 'quiz-data.json');
        const rawData = fs.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(rawData);
        allQuizzes = data.quizzes;
        console.log(`✅ Caricati ${allQuizzes.length} quiz dal database`);
        return true;
    } catch (error) {
        console.error('❌ Errore nel caricamento dei quiz:', error);
        alert('Errore nel caricamento dei quiz. Verifica che il file quiz-data.json esista.');
        return false;
    }
}

// Funzione per mescolare un array (Fisher-Yates shuffle)
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Seleziona i quiz in base alle impostazioni
function selectQuizzes() {
    // Filtra i quiz in base alle categorie selezionate
    let filteredQuizzes = allQuizzes;
    
    if (quizSettings.categories && quizSettings.categories.length > 0) {
        filteredQuizzes = allQuizzes.filter(quiz => 
            quizSettings.categories.includes(quiz.category)
        );
        console.log(`📂 Filtrati ${filteredQuizzes.length} quiz dalle categorie selezionate:`, quizSettings.categories);
    }
    
    // Se non ci sono quiz dopo il filtro, usa tutti i quiz
    if (filteredQuizzes.length === 0) {
        console.warn('⚠️ Nessun quiz trovato per le categorie selezionate, uso tutti i quiz');
        filteredQuizzes = allQuizzes;
    }
    
    // Log se ci sono meno quiz del richiesto
    if (filteredQuizzes.length < quizSettings.count) {
        console.warn(`⚠️ Richieste ${quizSettings.count} domande ma sono disponibili solo ${filteredQuizzes.length} domande per le categorie selezionate`);
    }
    
    let selected;
    
    if (quizSettings.random) {
        // Modalità random: mescola e prendi i primi N
        selected = shuffleArray(filteredQuizzes).slice(0, quizSettings.count);
    } else {
        // Modalità sequenziale: prendi i primi N
        selected = filteredQuizzes.slice(0, quizSettings.count);
    }
    
    console.log(`✅ Selezionati ${selected.length} quiz`);
    return selected;
}

// Calcola le dimensioni minime necessarie per il contenitore
function calculateMinContentSize() {
    const quizContainer = document.querySelector('.quiz-container');
    const quizContent = document.querySelector('.quiz-content');
    let maxHeight = 0;
    let maxWidth = 0;
    
    // Salva il contenuto originale
    const originalContent = quizContent.innerHTML;
    
    // Rimuovi temporaneamente max-width per misurare la larghezza naturale
    const originalMaxWidth = quizContainer.style.maxWidth;
    quizContainer.style.maxWidth = 'none';
    
    // Per ogni domanda, renderizzala temporaneamente e misura le dimensioni
    currentQuizzes.forEach((quiz, index) => {
        // Renderizza la domanda temporaneamente
        renderQuestionContent(quiz, index);
        
        // Aspetta che le immagini siano caricate per misurare correttamente
        // Misura l'altezza e larghezza del contenuto
        const currentHeight = quizContent.scrollHeight;
        const currentWidth = quizContent.scrollWidth;
        
        if (currentHeight > maxHeight) {
            maxHeight = currentHeight;
        }
        if (currentWidth > maxWidth) {
            maxWidth = currentWidth;
        }
    });
    
    // Ripristina max-width originale
    quizContainer.style.maxWidth = originalMaxWidth;
    
    // Ripristina il contenuto originale
    quizContent.innerHTML = originalContent;
    
    // Imposta le dimensioni minime
    if (maxHeight > 0) {
        quizContent.style.minHeight = `${maxHeight}px`;
    }
    
    // Imposta la larghezza del contenitore in base alla larghezza massima del contenuto
    // Mantieni il limite di 900px ma usa la larghezza massima trovata
    if (maxWidth > 0) {
        const containerWidth = Math.min(maxWidth + 60, 900); // +60 per padding laterale
        quizContainer.style.width = `${containerWidth}px`;
        console.log(`📏 Dimensioni calcolate - Larghezza: ${containerWidth}px, Altezza: ${maxHeight}px`);
    }
}

// Renderizza il contenuto di una domanda (senza aggiornare progresso e navigazione)
function renderQuestionContent(quiz, index) {
    const questionText = document.getElementById('questionText');
    const answersContainer = document.getElementById('answersContainer');
    const imageContainer = document.getElementById('quizImage');
    const imageElement = document.getElementById('quizImageElement');
    
    // Mostra domanda
    questionText.textContent = quiz.question;
    
    // Controlla se c'è un'immagine
    const imagePath = getQuizImage(quiz.id);
    if (imagePath) {
        imageElement.src = imagePath;
        imageContainer.style.display = 'block';
    } else {
        imageContainer.style.display = 'none';
    }
    
    // Mostra risposte - rimuove solo le risposte precedenti, non il badge categoria
    const existingAnswers = answersContainer.querySelectorAll('.answer-option');
    existingAnswers.forEach(answer => answer.remove());
    
    quiz.answers.forEach((answer) => {
        const answerDiv = document.createElement('div');
        answerDiv.className = 'answer-option';
        answerDiv.textContent = `${answer.letter}) ${answer.text}`;
        answerDiv.dataset.letter = answer.letter;
        
        if (userAnswers[index] === answer.letter) {
            answerDiv.classList.add('selected');
        }
        
        answersContainer.appendChild(answerDiv);
    });
}

// Inizializza il quiz
async function initQuiz() {
    // Carica i quiz se non già caricati
    if (allQuizzes.length === 0) {
        const loaded = await loadQuizData();
        if (!loaded) {
            window.location.href = '../../index.html';
            return;
        }
    }
    
    // Seleziona i quiz
    currentQuizzes = selectQuizzes();
    currentQuestionIndex = 0;
    userAnswers = new Array(currentQuizzes.length).fill(null);
    
    console.log(`Quiz avviato: ${currentQuizzes.length} domande, Random: ${quizSettings.random}`);
    
    // Calcola le dimensioni minime necessarie
    calculateMinContentSize();
    
    // Mostra prima domanda
    displayQuestion(0);
    
    // Avvia il timer
    startTimer();
}

// Controlla se esiste un'immagine per il quiz
function getQuizImage(quizId) {
    // Ogni pagina ha circa 2 quiz
    const pageNumber = Math.ceil(quizId / 2) + 1;
    
    // Path relativo dalla cartella pages/quiz alla root
    const basePath = path.join(__dirname, '..', '..');
    
    // Prova diversi pattern di nomi file
    const possibleImages = [
        `quiz-images/page_${String(pageNumber).padStart(4, '0')}_img_01.jpeg`,
        `quiz-images/page_${String(pageNumber).padStart(4, '0')}_img_01.png`,
        `quiz-images/page_${String(pageNumber).padStart(4, '0')}_img_02.jpeg`,
        `quiz-images/page_${String(pageNumber).padStart(4, '0')}_img_02.png`,
    ];
    
    for (const imagePath of possibleImages) {
        const fullPath = path.join(basePath, imagePath);
        if (fs.existsSync(fullPath)) {
            // Ritorna path relativo per l'HTML
            return `../../${imagePath}`;
        }
    }
    
    return null;
}

// Mostra una domanda
function displayQuestion(index) {
    const quiz = currentQuizzes[index];
    
    // Aggiorna progress
    document.getElementById('currentQuestion').textContent = index + 1;
    document.getElementById('totalQuestions').textContent = currentQuizzes.length;
    
    // Mostra domanda
    document.getElementById('questionText').textContent = quiz.question;
    
    // Controlla se c'è un'immagine
    const imagePath = getQuizImage(quiz.id);
    const imageContainer = document.getElementById('quizImage');
    const imageElement = document.getElementById('quizImageElement');
    
    if (imagePath) {
        imageElement.src = imagePath;
        imageContainer.style.display = 'block';
    } else {
        imageContainer.style.display = 'none';
    }
    
    // Mostra risposte - rimuove solo le risposte precedenti, non il badge categoria
    const answersContainer = document.getElementById('answersContainer');
    const existingAnswers = answersContainer.querySelectorAll('.answer-option');
    existingAnswers.forEach(answer => answer.remove());
    
    quiz.answers.forEach((answer) => {
        const answerDiv = document.createElement('div');
        answerDiv.className = 'answer-option';
        answerDiv.textContent = `${answer.letter}) ${answer.text}`;
        answerDiv.dataset.letter = answer.letter;
        
        // Se l'utente aveva già selezionato una risposta
        if (userAnswers[index] === answer.letter) {
            answerDiv.classList.add('selected');
        }
        
        answerDiv.addEventListener('click', () => selectAnswer(index, answer.letter));
        
        answersContainer.appendChild(answerDiv);
    });
    
    // Aggiorna stati dei button di navigazione
    document.getElementById('prevBtn').disabled = index === 0;
    document.getElementById('nextBtn').textContent = 
        index === currentQuizzes.length - 1 ? 'Termina Quiz' : 'Prossima →';
}

// Seleziona una risposta
function selectAnswer(questionIndex, letter) {
    // Salva la risposta
    userAnswers[questionIndex] = letter;
    
    // Aggiorna UI
    const answerOptions = document.querySelectorAll('.answer-option');
    answerOptions.forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.letter === letter) {
            option.classList.add('selected');
        }
    });
}

// Mostra dialog conferma uscita
function showExitDialog() {
    const dialog = document.getElementById('exitDialog');
    dialog.style.display = 'flex';
}

// Nascondi dialog conferma uscita
function hideExitDialog() {
    const dialog = document.getElementById('exitDialog');
    dialog.style.display = 'none';
}

// Esci dal quiz (chiamata dal dialog)
function exitQuiz() {
    // Ferma il timer
    stopTimer();
    
    window.location.href = '../../index.html';
}

// Navigazione quiz
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion(currentQuestionIndex);
    }
}

function nextQuestion() {
    if (currentQuestionIndex < currentQuizzes.length - 1) {
        currentQuestionIndex++;
        displayQuestion(currentQuestionIndex);
    } else {
        // Fine quiz
        finishQuiz();
    }
}

// Salva le statistiche del quiz
function saveStatistics(correctCount, totalQuestions, percentage, timeSpent) {
    // Carica le statistiche esistenti
    const stats = JSON.parse(localStorage.getItem('quizStatistics') || '{"completed": 0, "history": []}');
    
    // Aggiungi il nuovo risultato
    stats.completed = (stats.completed || 0) + 1;
    stats.history = stats.history || [];
    
    // Prepara i dettagli delle risposte
    const quizDetails = currentQuizzes.map((quiz, index) => ({
        questionId: quiz.id,
        question: quiz.question,
        userAnswer: userAnswers[index],
        correctAnswer: quiz.correctAnswer,
        isCorrect: userAnswers[index] === quiz.correctAnswer,
        answers: quiz.answers
    }));
    
    stats.history.push({
        date: new Date().toISOString(),
        correctAnswers: correctCount,
        totalQuestions: totalQuestions,
        percentage: parseFloat(percentage),
        random: quizSettings.random || false,
        timeSpent: timeSpent,
        details: quizDetails // Aggiungo i dettagli delle risposte
    });
    
    // Salva nel localStorage
    localStorage.setItem('quizStatistics', JSON.stringify(stats));
    console.log('✅ Statistiche salvate:', stats);
}

// Mostra dialog completamento quiz
function showCompletionDialog(correctCount, totalQuestions, percentage, timeSpent) {
    const dialog = document.getElementById('completionDialog');
    
    // Aggiorna i dati nel dialog
    document.getElementById('completionScore').textContent = `${percentage}%`;
    document.getElementById('completionCorrect').textContent = `${correctCount}/${totalQuestions} risposte corrette`;
    document.getElementById('completionTime').textContent = `Tempo: ${formatTime(timeSpent)}`;
    
    // Mostra il dialog
    dialog.style.display = 'flex';
    
    // Chiudi automaticamente dopo 2 secondi e torna alla home
    setTimeout(() => {
        dialog.style.display = 'none';
        window.location.href = '../../index.html';
    }, 2000);
}

// Termina il quiz e mostra i risultati
function finishQuiz() {
    // Ferma il timer
    stopTimer();
    
    let correctCount = 0;
    
    for (let i = 0; i < currentQuizzes.length; i++) {
        if (userAnswers[i] === currentQuizzes[i].correctAnswer) {
            correctCount++;
        }
    }
    
    const percentage = ((correctCount / currentQuizzes.length) * 100).toFixed(1);
    
    // Salva le statistiche con il tempo impiegato
    saveStatistics(correctCount, currentQuizzes.length, percentage, elapsedSeconds);
    
    // Mostra dialog personalizzato invece di alert
    showCompletionDialog(correctCount, currentQuizzes.length, percentage, elapsedSeconds);
}

// Event Listeners
document.getElementById('exitQuizBtn').addEventListener('click', showExitDialog);
document.getElementById('prevBtn').addEventListener('click', previousQuestion);
document.getElementById('nextBtn').addEventListener('click', nextQuestion);

// Event Listener per il timer - pausa/riprendi
document.querySelector('.quiz-timer').addEventListener('click', togglePauseTimer);

// Event Listeners per il dialog uscita
document.getElementById('confirmExitBtn').addEventListener('click', exitQuiz);
document.getElementById('cancelExitBtn').addEventListener('click', hideExitDialog);

// Event Listeners per il dialog pausa
document.getElementById('resumeQuizBtn').addEventListener('click', resumeQuiz);
document.getElementById('cancelQuizFromPauseBtn').addEventListener('click', exitQuizFromPause);

// Chiudi dialog cliccando fuori dalla finestra
document.getElementById('exitDialog').addEventListener('click', (e) => {
    if (e.target.id === 'exitDialog') {
        hideExitDialog();
    }
});

// Non permettere chiusura del dialog pausa cliccando fuori
document.getElementById('pauseDialog').addEventListener('click', (e) => {
    // Il dialog pausa richiede una scelta esplicita
    e.stopPropagation();
});

// Log di conferma caricamento
console.log('Quiz page caricata correttamente');

