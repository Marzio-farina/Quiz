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
let isAnswerHighlighted = false; // Traccia se l'evidenziazione è già stata mostrata per la domanda corrente
let highlightedQuestions = new Set(); // Traccia quali domande hanno già mostrato l'evidenziazione
let lastViewedQuestionIndex = -1; // Traccia l'ultima domanda visualizzata
let lastNonDisabledQuestionIndex = -1; // Traccia l'ultima domanda non disabilitata (a cui si può ancora rispondere)

// Timer
let quizStartTime = null;
let timerInterval = null;
let elapsedSeconds = 0;
let isPaused = false;
let pausedTime = 0;
let pauseStartTime = 0;

// Carica il tema salvato (mantiene il tema scelto nella home)
function initTheme() {
    try {
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        }
    } catch (error) {
        // Se localStorage non è disponibile, usa il tema di default
        console.warn('Impossibile caricare il tema salvato:', error);
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
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
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
}

function exitQuizFromPause() {
    hidePauseDialog();
    exitQuiz();
}

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
    initQuiz();
});

// Carica i quiz da tutti i file JSON disponibili
async function loadQuizData() {
    try {
        // Determina la directory base per i file JSON
        let baseDir;
        
        // Prova a ottenere il percorso tramite IPC (più affidabile)
        try {
            const dataPath = ipcRenderer.sendSync('get-quiz-data-path');
            // Estrai la directory base dal percorso (rimuovi il nome del file)
            baseDir = path.dirname(dataPath);
            console.log(`📁 Directory base da IPC: ${baseDir}`);
        } catch (ipcError) {
            // Se IPC fallisce, usa il percorso diretto
            if (process.resourcesPath) {
                // App distribuita: i file JSON sono in resources/
                baseDir = process.resourcesPath;
                console.log(`📁 Directory base (produzione): ${baseDir}`);
            } else {
                // Sviluppo: i file JSON sono nella root del progetto
                baseDir = path.join(__dirname, '..', '..');
                console.log(`📁 Directory base (sviluppo): ${baseDir}`);
            }
        }
        
        // Lista di tutti i file JSON da caricare
        const jsonFiles = [
            'quiz-data.json',
            'new-quiz-data.json',
            'modello3-quiz-data.json',
            'modello4-quiz-data.json',
            'modello5-quiz-data.json',
            'modello6-quiz-data.json',
            'modello7-quiz-data.json'
        ];
        
        // Carica tutti i file JSON e unisci i quiz
        allQuizzes = [];
        let loadedCount = 0;
        
        console.log(`\n📚 Inizio caricamento quiz da ${jsonFiles.length} file...`);
        
        for (const fileName of jsonFiles) {
            try {
                const filePath = path.join(baseDir, fileName);
                console.log(`🔍 Tentativo di caricare: ${filePath}`);
                
                if (fs.existsSync(filePath)) {
                    const rawData = fs.readFileSync(filePath, 'utf8');
                    const data = JSON.parse(rawData);
                    if (data.quizzes && Array.isArray(data.quizzes)) {
                        const previousCount = allQuizzes.length;
                        allQuizzes = allQuizzes.concat(data.quizzes);
                        loadedCount++;
                        console.log(`✅ Caricato ${fileName}: ${data.quizzes.length} quiz (totale: ${allQuizzes.length})`);
                    } else {
                        console.warn(`⚠️  ${fileName}: struttura dati non valida (manca 'quizzes' o non è un array)`);
                    }
                } else {
                    console.log(`⚠️  File non trovato: ${filePath}`);
                }
            } catch (fileError) {
                console.error(`❌ Errore nel caricamento di ${fileName}:`, fileError.message);
                console.error(`   Stack:`, fileError.stack);
                // Continua con gli altri file anche se uno fallisce
            }
        }
        
        if (allQuizzes.length === 0) {
            console.error('❌ Nessun quiz caricato da nessun file JSON');
            alert('Errore nel caricamento dei quiz. Verifica che almeno uno dei file JSON esista.');
            return false;
        }
        
        console.log(`\n✅ CARICAMENTO COMPLETATO:`);
        console.log(`   - File caricati: ${loadedCount}/${jsonFiles.length}`);
        console.log(`   - Totale quiz: ${allQuizzes.length}`);
        console.log(`   - Directory: ${baseDir}\n`);
        
        return true;
    } catch (error) {
        console.error('❌ Errore generale nel caricamento dei quiz:', error);
        console.error('   Stack:', error.stack);
        // Fallback: prova a caricare almeno quiz-data.json
        try {
            const fallbackPath = process.resourcesPath 
                ? path.join(__dirname, '..', '..', 'quiz-data.json')
                : path.join(process.resourcesPath || __dirname, 'quiz-data.json');
            console.log(`🔄 Tentativo fallback: ${fallbackPath}`);
            if (fs.existsSync(fallbackPath)) {
                const rawData = fs.readFileSync(fallbackPath, 'utf8');
                const data = JSON.parse(rawData);
                allQuizzes = data.quizzes || [];
                console.log(`⚠️  Caricato solo quiz-data.json come fallback: ${allQuizzes.length} quiz`);
                if (allQuizzes.length === 0) {
                    alert('Errore nel caricamento dei quiz. Verifica che il file quiz-data.json esista.');
                    return false;
                }
                return true;
            } else {
                console.error(`❌ Anche il file fallback non esiste: ${fallbackPath}`);
            }
        } catch (fallbackError) {
            console.error('❌ Errore anche nel fallback:', fallbackError);
        }
        alert('Errore nel caricamento dei quiz. Verifica che almeno uno dei file JSON esista.');
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

// Sistema di tracciamento stato domande per modalità Studio
// Stato: 'passed' (superata), 'unanswered' (non risposta), 'wrong' (errata), null (mai vista)

// Migra le chiavi numeriche in stringhe per consistenza
function migrateStudyModeStatus() {
    try {
        const studyStatus = JSON.parse(localStorage.getItem('studyModeStatus') || '{}');
        let migrated = false;
        const migratedStatus = {};
        
        Object.keys(studyStatus).forEach(key => {
            // Se la chiave è un numero (non una stringa numerica), migra
            const numKey = Number(key);
            if (!isNaN(numKey) && key !== String(numKey)) {
                // Chiave numerica, converti in stringa
                migratedStatus[String(numKey)] = studyStatus[key];
                migrated = true;
            } else {
                // Già stringa, mantieni
                migratedStatus[key] = studyStatus[key];
            }
        });
        
        if (migrated) {
            localStorage.setItem('studyModeStatus', JSON.stringify(migratedStatus));
            console.log('[STUDY MODE] Migrazione chiavi completata');
        }
    } catch (error) {
        console.error('[STUDY MODE] Errore nella migrazione:', error);
    }
}

// Esegui la migrazione all'avvio
migrateStudyModeStatus();

// Ottieni lo stato di una domanda in modalità Studio
// IMPORTANTE: Le chiavi vengono lette come STRINGHE per consistenza con JSON
function getQuestionStudyStatus(questionId) {
    try {
        const studyStatus = JSON.parse(localStorage.getItem('studyModeStatus') || '{}');
        const id = Number(questionId);
        if (isNaN(id)) return null;
        // Leggi come stringa per consistenza
        const idStr = String(id);
        return studyStatus[idStr] || null;
    } catch (error) {
        return null;
    }
}

// Aggiorna lo stato di una domanda in modalità Studio
// IMPORTANTE: Le chiavi vengono salvate come STRINGHE per consistenza con JSON
function updateQuestionStudyStatus(questionId, status) {
    try {
        const studyStatus = JSON.parse(localStorage.getItem('studyModeStatus') || '{}');
        const id = Number(questionId);
        if (!isNaN(id)) {
            // Salva come stringa per consistenza (JSON converte le chiavi numeriche in stringhe)
            const idStr = String(id);
            studyStatus[idStr] = status;
            localStorage.setItem('studyModeStatus', JSON.stringify(studyStatus));
        }
    } catch (error) {
        // Errore silenzioso
        console.error('Errore nell\'aggiornamento dello stato:', error);
    }
}

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
        
        return wrongIds;
    } catch (error) {
        console.error('Errore nel recupero dei quiz sbagliati:', error);
        return new Set();
    }
}

// Ottieni tutte le domande non risposte (stato 'unanswered' o non presenti in studyModeStatus)
function getUnansweredQuestionIds(allQuizIds) {
    try {
        const studyStatus = JSON.parse(localStorage.getItem('studyModeStatus') || '{}');
        const unansweredIds = new Set();
        
        // Aggiungi tutti i quiz che non sono presenti in studyModeStatus
        allQuizIds.forEach(quizId => {
            const idStr = String(quizId);
            if (!studyStatus[idStr]) {
                unansweredIds.add(quizId);
            } else if (studyStatus[idStr] === 'unanswered') {
                unansweredIds.add(quizId);
            }
        });
        
        return unansweredIds;
    } catch (error) {
        return new Set();
    }
}

// Funzioni legacy mantenute per compatibilità (non più usate in modalità Studio)
function getCompletedQuizIds() {
    try {
        const stats = JSON.parse(localStorage.getItem('quizStatistics') || '{"history": []}');
        const completedIds = new Set();
        
        stats.history.forEach(quiz => {
            if (quiz.details && Array.isArray(quiz.details)) {
                quiz.details.forEach(detail => {
                    if (detail.questionId !== undefined && detail.questionId !== null) {
                        const id = Number(detail.questionId);
                        if (!isNaN(id)) {
                            completedIds.add(id);
                        }
                    }
                });
            }
        });
        
        return completedIds;
    } catch (error) {
        return new Set();
    }
}

function getPassedQuizIds() {
    return getPassedQuestionIds();
}

// Seleziona i quiz in base alle impostazioni
function selectQuizzes() {
    // Filtra i quiz in base alle categorie selezionate
    let filteredQuizzes = allQuizzes;
    
    if (quizSettings.categories && quizSettings.categories.length > 0) {
        filteredQuizzes = allQuizzes.filter(quiz => {
            // Priorità 1: Se una sottocategoria è selezionata, usa solo quella
            // (questo ha priorità perché se selezioni solo alcune sottocategorie,
            // la categoria padre viene deselezionata automaticamente)
            if (quiz.subcategory && quizSettings.categories.includes(quiz.subcategory)) {
                return true;
            }
            
            // Priorità 2: Se la categoria principale è selezionata (senza sottocategorie specifiche),
            // includi tutti i quiz di quella categoria
            // Nota: se ci sono sottocategorie selezionate, la categoria padre non dovrebbe essere selezionata
            // grazie alla sincronizzazione automatica, ma controlliamo comunque per sicurezza
            if (quizSettings.categories.includes(quiz.category)) {
                // Verifica che non ci siano sottocategorie selezionate per questa categoria
                // Se ci sono, significa che vogliamo solo quelle sottocategorie specifiche
                const hasSubcategoriesForThisCategory = quizSettings.categories.some(cat => 
                    cat.startsWith(quiz.category + '_') && cat !== quiz.category
                );
                
                // Se non ci sono sottocategorie selezionate per questa categoria, includi tutti i quiz
                if (!hasSubcategoriesForThisCategory) {
                    return true;
                }
            }
            
            return false;
        });
    }
    
    // Filtra i quiz in base alla modalità Studio e alle esclusioni
    // IMPORTANTE: In modalità Studio, SEMPRE escludi i quiz superati (passed)
    if (quizSettings.studyMode === 'study') {
        const passedIds = getPassedQuestionIds();
        const allQuizIds = filteredQuizzes.map(quiz => Number(quiz.id)).filter(id => !isNaN(id));
        const wrongIds = getWrongQuestionIds();
        const unansweredIds = getUnansweredQuestionIds(allQuizIds);
        
        if (quizSettings.excludeMode === 'answered') {
            // Opzione "risposti": mostra solo i quiz sbagliati (wrong)
            // Escludi: superati (passed) + non risposti (unanswered)
            filteredQuizzes = filteredQuizzes.filter(quiz => {
                const quizId = Number(quiz.id);
                if (isNaN(quizId)) return false;
                // Escludi quelli superati
                if (passedIds.has(quizId)) return false;
                // Includi solo quelli sbagliati
                return wrongIds.has(quizId);
            });
        } else {
            // Opzione "Non risposti" o default: mostra quiz sbagliati (wrong) + non risposti (unanswered)
            // Escludi solo: superati (passed)
            filteredQuizzes = filteredQuizzes.filter(quiz => {
                const quizId = Number(quiz.id);
                if (isNaN(quizId)) return false;
                // PRIMA: escludi quelli superati (priorità massima)
                if (passedIds.has(quizId)) return false;
                // POI: includi solo quelli sbagliati o non risposti
                return wrongIds.has(quizId) || unansweredIds.has(quizId);
            });
        }
    }
    
    // Se non ci sono quiz disponibili dopo il filtro, usa tutti i quiz come fallback
    if (filteredQuizzes.length === 0) {
        // Fallback: usa tutti i quiz se non ce ne sono disponibili
        filteredQuizzes = allQuizzes;
    }
    
    let selected;
    
    if (quizSettings.random) {
        // Modalità random: mescola e prendi i primi N
        selected = shuffleArray(filteredQuizzes).slice(0, quizSettings.count);
    } else {
        // Modalità sequenziale: prendi i primi N
        selected = filteredQuizzes.slice(0, quizSettings.count);
    }
    
    return selected;
}

// Calcola le dimensioni minime necessarie per il contenitore
// Disabilitato per layout frameless - le dimensioni sono gestite tramite CSS
function calculateMinContentSize() {
    // Non calcoliamo più nulla - tutto gestito tramite CSS con width e height al 100%
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
    
    // Verifica che ci siano quiz selezionati
    if (currentQuizzes.length === 0) {
        alert('Nessun quiz disponibile con i filtri selezionati. Torna alla home e modifica le impostazioni.');
        window.location.href = '../../index.html';
        return;
    }
    
    currentQuestionIndex = 0;
    userAnswers = new Array(currentQuizzes.length).fill(null);
    lastViewedQuestionIndex = -1; // Reset dell'ultima domanda visualizzata
    lastNonDisabledQuestionIndex = -1; // Reset dell'ultima domanda non disabilitata
    
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
        
        // Aggiungi event listener per aprire il dialog quando si clicca sull'immagine
        imageElement.style.cursor = 'pointer';
        imageElement.onclick = () => showImageDialog(imagePath);
    } else {
        imageContainer.style.display = 'none';
        imageElement.onclick = null;
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
        
        // Se l'evidenziazione è già stata mostrata per questa domanda (in modalità Studio), disabilita il click
        const canChangeAnswer = !(quizSettings.studyMode === 'study' && highlightedQuestions.has(index));
        
        if (canChangeAnswer) {
            answerDiv.style.cursor = 'pointer';
            answerDiv.addEventListener('click', () => selectAnswer(index, answer.letter));
        } else {
            answerDiv.style.cursor = 'not-allowed';
            answerDiv.style.opacity = '0.7';
        }
        
        answersContainer.appendChild(answerDiv);
    });
    
    // Aggiorna stati dei button di navigazione
    document.getElementById('prevBtn').disabled = index === 0;
    document.getElementById('nextBtn').textContent = 
        index === currentQuizzes.length - 1 ? 'Termina Quiz' : 'Prossima →';
    
    // Verifica se si sta tornando indietro (l'indice è minore dell'ultima domanda visualizzata)
    const isGoingBackward = lastViewedQuestionIndex !== -1 && index < lastViewedQuestionIndex;
    
    // Aggiorna l'ultima domanda visualizzata
    lastViewedQuestionIndex = index;
    
    // Se siamo in modalità Studio, mostra automaticamente l'evidenziazione se:
    // 1. C'è già una risposta, OPPURE
    // 2. Non c'è risposta E si sta tornando indietro E non è l'ultima domanda non disabilitata
    if (quizSettings.studyMode === 'study') {
        const hasAnswer = userAnswers[index] !== null && userAnswers[index] !== undefined;
        const isNotLastNonDisabled = lastNonDisabledQuestionIndex !== -1 && index !== lastNonDisabledQuestionIndex;
        
        if (hasAnswer || (!hasAnswer && isGoingBackward && isNotLastNonDisabled)) {
            // Piccolo delay per assicurarsi che il DOM sia aggiornato
            setTimeout(() => {
                highlightAnswers(index);
                isAnswerHighlighted = true;
                if (hasAnswer) {
                    highlightedQuestions.add(index); // Marca come evidenziata solo se c'è risposta
                }
            }, 50);
        } else {
            // Reset dello stato di evidenziazione per la nuova domanda
            isAnswerHighlighted = false;
        }
        
        // Aggiorna l'ultima domanda non disabilitata (quella a cui si può ancora rispondere)
        if (!highlightedQuestions.has(index)) {
            lastNonDisabledQuestionIndex = index;
        }
    } else {
        // Reset dello stato di evidenziazione per la nuova domanda
        isAnswerHighlighted = false;
    }
}

// Evidenzia i bordi delle risposte (verde per corretta, rosso per sbagliata)
function highlightAnswers(questionIndex) {
    const quiz = currentQuizzes[questionIndex];
    const userAnswer = userAnswers[questionIndex];
    const correctAnswer = quiz.correctAnswer;
    
    // Rimuovi tutte le evidenziazioni precedenti
    const answerOptions = document.querySelectorAll('.answer-option');
    answerOptions.forEach(option => {
        option.classList.remove('answer-correct', 'answer-wrong');
    });
    
    // Evidenzia la risposta corretta in verde
    const correctOption = document.querySelector(`.answer-option[data-letter="${correctAnswer}"]`);
    if (correctOption) {
        correctOption.classList.add('answer-correct');
    }
    
    // Se l'utente ha dato una risposta sbagliata, evidenzia anche quella in rosso
    if (userAnswer && userAnswer !== correctAnswer) {
        const wrongOption = document.querySelector(`.answer-option[data-letter="${userAnswer}"]`);
        if (wrongOption) {
            wrongOption.classList.add('answer-wrong');
        }
    }
}

// Seleziona una risposta
function selectAnswer(questionIndex, letter) {
    // Se l'evidenziazione è già stata mostrata per questa domanda (in modalità Studio), non permettere di cambiare risposta
    if (quizSettings.studyMode === 'study' && highlightedQuestions.has(questionIndex)) {
        return;
    }
    
    // Salva la risposta
    userAnswers[questionIndex] = letter;
    
    // Rimuovi evidenziazioni precedenti
    const answerOptions = document.querySelectorAll('.answer-option');
    answerOptions.forEach(option => {
        option.classList.remove('selected', 'answer-correct', 'answer-wrong');
        if (option.dataset.letter === letter) {
            option.classList.add('selected');
        }
    });
    
    // Reset dello stato di evidenziazione quando si cambia risposta
    isAnswerHighlighted = false;
    highlightedQuestions.delete(questionIndex); // Rimuovi dal Set se si cambia risposta
}

// Mostra dialog conferma uscita
function showExitDialog() {
    // Calcola larghezza scrollbar e blocca lo scroll del body
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
    document.body.classList.add('dialog-open');
    
    const dialog = document.getElementById('exitDialog');
    dialog.style.display = 'flex';
}

// Nascondi dialog conferma uscita
function hideExitDialog() {
    const dialog = document.getElementById('exitDialog');
    dialog.style.display = 'none';
    
    // Riabilita lo scroll del body
    document.body.classList.remove('dialog-open');
}

// Esci dal quiz (chiamata dal dialog)
function exitQuiz() {
    // Ferma il timer
    stopTimer();
    
    // Riabilita lo scroll del body prima di uscire
    document.body.classList.remove('dialog-open');
    
    window.location.href = '../../index.html';
}

// Cleanup quando la pagina viene scaricata
window.addEventListener('beforeunload', () => {
    stopTimer();
});

// Navigazione quiz
function previousQuestion() {
    // Se siamo in modalità Studio, applica la logica di evidenziazione
    if (quizSettings.studyMode === 'study') {
        // Se l'evidenziazione è già stata mostrata, cambia domanda
        if (isAnswerHighlighted) {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                displayQuestion(currentQuestionIndex);
                isAnswerHighlighted = false; // Reset per la nuova domanda
            }
        } else {
            // Se c'è già una risposta, mostra l'evidenziazione
            // Altrimenti torna semplicemente alla domanda precedente
            const hasAnswer = userAnswers[currentQuestionIndex] !== null && userAnswers[currentQuestionIndex] !== undefined;
            
            if (hasAnswer) {
                // Mostra l'evidenziazione solo se c'è una risposta
                highlightAnswers(currentQuestionIndex);
                isAnswerHighlighted = true;
                highlightedQuestions.add(currentQuestionIndex); // Marca questa domanda come già evidenziata
            } else {
                // Se non c'è risposta, torna semplicemente alla domanda precedente
                if (currentQuestionIndex > 0) {
                    currentQuestionIndex--;
                    displayQuestion(currentQuestionIndex);
                    isAnswerHighlighted = false; // Reset per la nuova domanda
                }
            }
        }
    } else {
        // Comportamento normale per modalità Quiz
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            displayQuestion(currentQuestionIndex);
        }
    }
}

// Variabile globale per gestire il listener del feedback
let currentFeedbackKeydownHandler = null;

// Mostra feedback in modalità Studio
// goBackward: true se si sta tornando indietro, false se si sta andando avanti
function showStudyFeedback(goBackward = false) {
    const currentQuiz = currentQuizzes[currentQuestionIndex];
    const userAnswer = userAnswers[currentQuestionIndex];
    const correctAnswer = currentQuiz.correctAnswer;

    // Rimuovi listener precedente se esiste
    if (currentFeedbackKeydownHandler) {
        document.removeEventListener('keydown', currentFeedbackKeydownHandler);
        currentFeedbackKeydownHandler = null;
    }
    
    // Calcola larghezza scrollbar e blocca lo scroll del body
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
    document.body.classList.add('dialog-open');
    
    const dialog = document.getElementById('studyFeedbackDialog');
    const header = document.getElementById('studyFeedbackHeader');
    const title = document.getElementById('studyFeedbackTitle');
    
    // Nascondi tutti i tipi di feedback
    document.getElementById('studyFeedbackCorrect').style.display = 'none';
    document.getElementById('studyFeedbackWrong').style.display = 'none';
    document.getElementById('studyFeedbackUnanswered').style.display = 'none';
    
    // Funzione per chiudere il feedback e procedere
    const closeFeedback = () => {
        dialog.style.display = 'none';
        document.body.classList.remove('dialog-open');
        if (currentFeedbackKeydownHandler) {
            document.removeEventListener('keydown', currentFeedbackKeydownHandler);
            currentFeedbackKeydownHandler = null;
        }
        if (goBackward) {
            proceedToPreviousQuestion();
        } else {
            proceedToNextQuestion();
        }
    };
    
    // Determina il tipo di feedback
    if (userAnswer === null || userAnswer === undefined) {
        // Non risposta
        header.style.background = 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)';
        title.textContent = '⚠️ Risposta Mancante';
        
        document.getElementById('studyFeedbackUnanswered').style.display = 'block';
        document.getElementById('studyFeedbackUnansweredQuestionText').textContent = currentQuiz.question;
        
        // Trova il testo della risposta corretta
        const correctAnswerObj = currentQuiz.answers.find(a => a.letter === correctAnswer);
        const correctAnswerText = correctAnswerObj ? `${correctAnswerObj.letter}) ${correctAnswerObj.text}` : correctAnswer;
        document.getElementById('studyFeedbackUnansweredCorrectAnswer').textContent = correctAnswerText;
        
        // Mostra il dialog
        dialog.style.display = 'flex';
        
        // Chiudi il dialog quando si clicca fuori
        dialog.onclick = (e) => {
            if (e.target === dialog) {
                closeFeedback();
            }
        };
        
        // Listener per tasti
        currentFeedbackKeydownHandler = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                closeFeedback();
            }
        };
        document.addEventListener('keydown', currentFeedbackKeydownHandler);
        
    } else if (userAnswer === correctAnswer) {
        // Risposta corretta
        header.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
        title.textContent = '✅ Risposta Esatta!';
        
        document.getElementById('studyFeedbackCorrect').style.display = 'block';
        
        // Mostra il dialog
        dialog.style.display = 'flex';
        
        // Chiudi automaticamente dopo 2 secondi
        setTimeout(() => {
            closeFeedback();
        }, 2000);
        
    } else {
        // Risposta sbagliata
        header.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
        title.textContent = '❌ Risposta Errata';
        
        document.getElementById('studyFeedbackWrong').style.display = 'block';
        document.getElementById('studyFeedbackQuestionText').textContent = currentQuiz.question;
        
        // Trova il testo delle risposte
        const userAnswerObj = currentQuiz.answers.find(a => a.letter === userAnswer);
        const correctAnswerObj = currentQuiz.answers.find(a => a.letter === correctAnswer);
        
        const userAnswerText = userAnswerObj ? `${userAnswerObj.letter}) ${userAnswerObj.text}` : userAnswer;
        const correctAnswerText = correctAnswerObj ? `${correctAnswerObj.letter}) ${correctAnswerObj.text}` : correctAnswer;
        
        document.getElementById('studyFeedbackUserAnswer').textContent = userAnswerText;
        document.getElementById('studyFeedbackCorrectAnswer').textContent = correctAnswerText;
        
        // Mostra il dialog
        dialog.style.display = 'flex';
        
        // Chiudi il dialog quando si clicca fuori
        dialog.onclick = (e) => {
            if (e.target === dialog) {
                closeFeedback();
            }
        };
        
        // Listener per tasti
        currentFeedbackKeydownHandler = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                closeFeedback();
            }
        };
        document.addEventListener('keydown', currentFeedbackKeydownHandler);
    }
}

// Procede alla domanda successiva dopo il feedback
function proceedToNextQuestion() {
    if (currentQuestionIndex < currentQuizzes.length - 1) {
        currentQuestionIndex++;
        displayQuestion(currentQuestionIndex);
    } else {
        // Fine quiz
        finishQuiz();
    }
}

// Procede alla domanda precedente dopo il feedback
// Nota: l'indice è già stato decrementato prima di chiamare showStudyFeedback
function proceedToPreviousQuestion() {
    // L'indice è già stato decrementato, quindi mostra direttamente la domanda
    displayQuestion(currentQuestionIndex);
}

function nextQuestion() {
    // Se siamo in modalità Studio, applica la logica di evidenziazione
    if (quizSettings.studyMode === 'study') {
        // Se l'evidenziazione è già stata mostrata, cambia domanda
        if (isAnswerHighlighted) {
            if (currentQuestionIndex < currentQuizzes.length - 1) {
                currentQuestionIndex++;
                displayQuestion(currentQuestionIndex);
                isAnswerHighlighted = false; // Reset per la nuova domanda
            } else {
                // Fine quiz
                finishQuiz();
            }
        } else {
            // Altrimenti mostra l'evidenziazione
            highlightAnswers(currentQuestionIndex);
            isAnswerHighlighted = true;
            highlightedQuestions.add(currentQuestionIndex); // Marca questa domanda come già evidenziata
        }
    } else {
        // Comportamento normale per modalità Quiz
        if (currentQuestionIndex < currentQuizzes.length - 1) {
            currentQuestionIndex++;
            displayQuestion(currentQuestionIndex);
        } else {
            // Fine quiz
            finishQuiz();
        }
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
        category: quiz.category,
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
        studyMode: quizSettings.studyMode || 'quiz', // 'study' o 'quiz' - distingue le sessioni
        details: quizDetails
    });
    
    // Salva nel localStorage
    localStorage.setItem('quizStatistics', JSON.stringify(stats));
    
    // Se siamo in modalità Studio, aggiorna lo stato delle domande
    // IMPORTANTE: Questo aggiorna solo studyModeStatus, non lo storico
    // Lo stato finale di ogni quiz è quello dell'ultima sessione di studio
    if (quizSettings.studyMode === 'study') {
        try {
            updateStudyModeStatus();
            // Debug: verifica che lo stato sia stato aggiornato
            const studyStatus = JSON.parse(localStorage.getItem('studyModeStatus') || '{}');
            const passedCount = Object.keys(studyStatus).filter(id => studyStatus[id] === 'passed').length;
            const wrongCount = Object.keys(studyStatus).filter(id => studyStatus[id] === 'wrong').length;
            console.log('[STUDY MODE] Stato aggiornato - Passed:', passedCount, 'Wrong:', wrongCount);
        } catch (error) {
            console.error('[STUDY MODE] Errore nell\'aggiornamento dello stato:', error);
        }
    }
}

// Aggiorna lo stato delle domande in modalità Studio
// IMPORTANTE: Lo stato viene aggiornato con priorità: passed > wrong > unanswered
// Se una domanda è già 'passed', non può tornare a 'wrong' o 'unanswered'
// Se una domanda è 'wrong' e viene risposta correttamente, diventa 'passed'
function updateStudyModeStatus() {
    currentQuizzes.forEach((quiz, index) => {
        const questionId = Number(quiz.id);
        const userAnswer = userAnswers[index];
        
        if (isNaN(questionId)) return;
        
        // Ottieni lo stato attuale
        const currentStatus = getQuestionStudyStatus(questionId);
        
        // Se è già 'passed', non aggiornare (una volta superata, rimane superata)
        if (currentStatus === 'passed') {
            return;
        }
        
        // Determina il nuovo stato
        let newStatus;
        if (userAnswer === null || userAnswer === undefined) {
            // Domanda non risposta → stato 'unanswered' (verrà riproposta)
            // Ma solo se non è già 'wrong' (se è già wrong, mantieni wrong)
            if (currentStatus === 'wrong') {
                newStatus = 'wrong'; // Mantieni wrong se era già sbagliata
            } else {
                newStatus = 'unanswered';
            }
        } else if (userAnswer === quiz.correctAnswer) {
            // Domanda risposta correttamente → stato 'passed' (non verrà più riproposta)
            // Questo sovrascrive qualsiasi stato precedente (wrong o unanswered)
            newStatus = 'passed';
        } else {
            // Domanda sbagliata → stato 'wrong' (verrà riproposta)
            // Ma solo se non è già 'passed' (se è già passed, mantieni passed)
            if (currentStatus === 'passed') {
                newStatus = 'passed'; // Non tornare indietro da passed
            } else {
                newStatus = 'wrong';
            }
        }
        
        // Aggiorna solo se il nuovo stato è diverso o migliore
        updateQuestionStudyStatus(questionId, newStatus);
    });
}

// Mostra dialog completamento quiz
function showCompletionDialog(correctCount, totalQuestions, percentage, timeSpent) {
    // Calcola larghezza scrollbar e blocca lo scroll del body
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
    document.body.classList.add('dialog-open');
    
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
        document.body.classList.remove('dialog-open');
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

// Mostra dialog immagine ingrandita
function showImageDialog(imagePath) {
    const dialog = document.getElementById('imageDialog');
    const enlargedImage = document.getElementById('enlargedImage');
    
    enlargedImage.src = imagePath;
    dialog.style.display = 'flex';
    document.body.classList.add('dialog-open');
}

// Nascondi dialog immagine ingrandita
function hideImageDialog() {
    const dialog = document.getElementById('imageDialog');
    dialog.style.display = 'none';
    document.body.classList.remove('dialog-open');
}

// Event Listeners
// Pulsante minimize applicazione
const minimizeAppBtn = document.getElementById('minimizeAppBtn');
if (minimizeAppBtn) {
    minimizeAppBtn.addEventListener('click', () => {
        ipcRenderer.send('minimize-window');
    });
}

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

// Event Listeners per il dialog immagine
document.getElementById('closeImageDialogBtn').addEventListener('click', hideImageDialog);
document.getElementById('imageDialog').addEventListener('click', (e) => {
    if (e.target.id === 'imageDialog') {
        hideImageDialog();
    }
});

