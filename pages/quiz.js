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

// Ricevi le impostazioni dalla pagina home
ipcRenderer.on('start-quiz', (event, settings) => {
    quizSettings = settings;
    console.log('Impostazioni ricevute:', settings);
    initQuiz();
});

// Carica i quiz dal JSON
async function loadQuizData() {
    try {
        // Path relativo dalla cartella pages alla root
        const dataPath = path.join(__dirname, '..', 'quiz-data.json');
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
    let selected;
    
    if (quizSettings.random) {
        // Modalità random: mescola e prendi i primi N
        selected = shuffleArray(allQuizzes).slice(0, quizSettings.count);
    } else {
        // Modalità sequenziale: prendi i primi N
        selected = allQuizzes.slice(0, quizSettings.count);
    }
    
    return selected;
}

// Inizializza il quiz
async function initQuiz() {
    // Carica i quiz se non già caricati
    if (allQuizzes.length === 0) {
        const loaded = await loadQuizData();
        if (!loaded) {
            window.location.href = '../index.html';
            return;
        }
    }
    
    // Seleziona i quiz
    currentQuizzes = selectQuizzes();
    currentQuestionIndex = 0;
    userAnswers = new Array(currentQuizzes.length).fill(null);
    
    console.log(`Quiz avviato: ${currentQuizzes.length} domande, Random: ${quizSettings.random}`);
    
    // Mostra prima domanda
    displayQuestion(0);
}

// Controlla se esiste un'immagine per il quiz
function getQuizImage(quizId) {
    // Ogni pagina ha circa 2 quiz
    const pageNumber = Math.ceil(quizId / 2) + 1;
    
    // Path relativo dalla cartella pages alla root
    const basePath = path.join(__dirname, '..');
    
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
            return `../${imagePath}`;
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
    
    // Mostra risposte
    const answersContainer = document.getElementById('answersContainer');
    answersContainer.innerHTML = '';
    
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

// Esci dal quiz
function exitQuiz() {
    if (confirm('Sei sicuro di voler uscire dal quiz? I progressi andranno persi.')) {
        window.location.href = '../index.html';
    }
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

// Termina il quiz e mostra i risultati
function finishQuiz() {
    let correctCount = 0;
    
    for (let i = 0; i < currentQuizzes.length; i++) {
        if (userAnswers[i] === currentQuizzes[i].correctAnswer) {
            correctCount++;
        }
    }
    
    const percentage = ((correctCount / currentQuizzes.length) * 100).toFixed(1);
    
    alert(`Quiz completato!\n\nRisposte corrette: ${correctCount}/${currentQuizzes.length}\nPercentuale: ${percentage}%`);
    
    // Torna alla home
    window.location.href = '../index.html';
}

// Event Listeners
document.getElementById('exitQuizBtn').addEventListener('click', exitQuiz);
document.getElementById('prevBtn').addEventListener('click', previousQuestion);
document.getElementById('nextBtn').addEventListener('click', nextQuestion);

// Log di conferma caricamento
console.log('Quiz page caricata correttamente');

