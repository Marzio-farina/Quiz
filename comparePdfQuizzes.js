const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

/**
 * Script per confrontare le domande tra due PDF
 * Confronta ssfo-quiz-modello2.pdf con Banca dati unisa farmacia ospedaliera.pdf
 */

const existingQuizPath = path.join(__dirname, 'quiz-data.json');
const newPdfPath = path.join(__dirname, 'Ulteriori quiz', 'ssfo-quiz-modello2.pdf');
const outputPath = path.join(__dirname, 'comparison-report.json');

// Funzione per normalizzare il testo per il confronto
function normalizeForComparison(text) {
    return text.trim()
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .substring(0, 150);
}

// Carica i quiz esistenti
console.log('📖 Caricamento quiz esistenti...');
const existingData = JSON.parse(fs.readFileSync(existingQuizPath, 'utf8'));
const existingQuizzes = existingData.quizzes || [];
console.log(`✅ Caricati ${existingQuizzes.length} quiz esistenti`);

// Crea un indice delle domande esistenti
const existingQuestionsIndex = new Map();
existingQuizzes.forEach(quiz => {
    const normalized = normalizeForComparison(quiz.question);
    if (!existingQuestionsIndex.has(normalized)) {
        existingQuestionsIndex.set(normalized, []);
    }
    existingQuestionsIndex.get(normalized).push({
        id: quiz.id,
        question: quiz.question,
        category: quiz.category
    });
});

// Estrai le domande dal nuovo PDF
async function extractQuestionsFromNewPdf() {
    console.log('📄 Estrazione domande dal nuovo PDF...');
    
    const dataBuffer = fs.readFileSync(newPdfPath);
    const data = await pdf(dataBuffer);
    
    const text = data.text;
    // Dividi per righe e pulisci
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    
    console.log(`📝 Totale righe estratte: ${lines.length}`);
    console.log(`📄 Prime 20 righe:`);
    lines.slice(0, 20).forEach((line, i) => console.log(`  ${i + 1}: ${line.substring(0, 80)}`));
    
    const questions = [];
    let currentQuestion = null;
    let currentAnswers = [];
    let questionNumber = 0;
    let expectingAnswers = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Rileva inizio di una nuova domanda (numero seguito da punto)
        const questionMatch = line.match(/^(\d+)\.\s*(.+)/);
        if (questionMatch) {
            // Salva la domanda precedente se ha almeno 1 risposta (alcune potrebbero avere meno risposte)
            if (currentQuestion && currentAnswers.length >= 1) {
                questions.push({
                    number: questionNumber,
                    question: currentQuestion.trim(),
                    answers: currentAnswers.slice(0, 5).map(a => a.trim()).filter(a => a.length > 0)
                });
            }
            
            // Inizia una nuova domanda
            questionNumber = parseInt(questionMatch[1]);
            currentQuestion = questionMatch[2].trim();
            currentAnswers = [];
            expectingAnswers = false;
        } 
        // Rileva risposte con lettera (A, B, C, D, E) - vari formati
        else if (currentQuestion) {
            // Formato: A) testo, A. testo, A testo (con spazio dopo la lettera)
            // Prova prima con parentesi/punto
            if (/^[A-E][\)\.]\s/.test(line)) {
                const answerText = line.replace(/^[A-E][\)\.]\s*/, '').trim();
                if (answerText.length > 0) {
                    currentAnswers.push(answerText);
                    expectingAnswers = true;
                }
            }
            // Poi prova con solo lettera e spazio seguito da testo
            else if (/^[A-E]\s+[A-Za-z0-9]/.test(line)) {
                const answerText = line.replace(/^[A-E]\s+/, '').trim();
                if (answerText.length > 0) {
                    currentAnswers.push(answerText);
                    expectingAnswers = true;
                }
            }
            // Prova anche con lettera minuscola
            else if (/^[a-e][\)\.]\s/.test(line)) {
                const answerText = line.replace(/^[a-e][\)\.]\s*/, '').trim();
                if (answerText.length > 0) {
                    currentAnswers.push(answerText);
                    expectingAnswers = true;
                }
            }
            // Continua la domanda se non abbiamo ancora risposte e non è un numero di domanda
            else if (!expectingAnswers && currentAnswers.length === 0 && line.length > 3 && !/^[A-E]$/.test(line) && !/^\d+\./.test(line) && !/^[A-E]\s/.test(line)) {
                currentQuestion += ' ' + line;
            }
            // Se abbiamo risposte e la riga non è una lettera singola o nuova domanda, potrebbe essere continuazione di una risposta
            else if (expectingAnswers && currentAnswers.length > 0 && currentAnswers.length < 5 && line.length > 2 && !/^[A-E]$/.test(line) && !/^[A-E][\)\.]/.test(line) && !/^[A-E]\s[A-Z]/.test(line) && !/^\d+\./.test(line)) {
                // Aggiungi alla risposta precedente
                const lastIndex = currentAnswers.length - 1;
                if (currentAnswers[lastIndex]) {
                    currentAnswers[lastIndex] = currentAnswers[lastIndex] + ' ' + line;
                }
            }
        }
    }
    
    // Aggiungi l'ultima domanda se ha almeno 1 risposta
    if (currentQuestion && currentAnswers.length >= 1) {
        questions.push({
            number: questionNumber,
            question: currentQuestion.trim(),
            answers: currentAnswers.slice(0, 5).map(a => a.trim()).filter(a => a.length > 0)
        });
    }
    
    // Verifica se ci sono domande mancanti
    const extractedNumbers = questions.map(q => q.number).sort((a, b) => a - b);
    const missingNumbers = [];
    for (let i = 1; i <= 70; i++) {
        if (!extractedNumbers.includes(i)) {
            missingNumbers.push(i);
        }
    }
    
    if (missingNumbers.length > 0) {
        console.log(`⚠️  Domande mancanti: ${missingNumbers.join(', ')}`);
    }
    
    console.log(`✅ Estratte ${questions.length} domande dal nuovo PDF`);
    if (questions.length > 0) {
        console.log(`📋 Esempio prima domanda:`);
        console.log(`   Domanda: ${questions[0].question.substring(0, 100)}...`);
        console.log(`   Risposte: ${questions[0].answers.length}`);
    } else {
        console.log(`⚠️  Nessuna domanda estratta. Stato finale:`);
        console.log(`   currentQuestion: ${currentQuestion ? currentQuestion.substring(0, 50) + '...' : 'null'}`);
        console.log(`   currentAnswers: ${currentAnswers.length}`);
        console.log(`   questionNumber: ${questionNumber}`);
    }
    return questions;
}

// Confronta le domande
async function compareQuizzes() {
    const newQuestions = await extractQuestionsFromNewPdf();
    
    const comparison = {
        totalNewQuestions: newQuestions.length,
        totalExistingQuestions: existingQuizzes.length,
        duplicates: [],
        unique: []
    };
    
    console.log('\n🔍 Confronto delle domande...\n');
    
    newQuestions.forEach((newQ) => {
        const normalized = normalizeForComparison(newQ.question);
        const existingMatches = existingQuestionsIndex.get(normalized) || [];
        
        if (existingMatches.length > 0) {
            comparison.duplicates.push({
                newQuestionNumber: newQ.number,
                newQuestion: newQ.question.substring(0, 150),
                existingMatches: existingMatches.map(m => ({
                    id: m.id,
                    question: m.question.substring(0, 150),
                    category: m.category
                }))
            });
            console.log(`⚠️  Domanda ${newQ.number}: DUPLICATO (ID esistenti: ${existingMatches.map(m => m.id).join(', ')})`);
        } else {
            comparison.unique.push({
                number: newQ.number,
                question: newQ.question,
                answers: newQ.answers
            });
            console.log(`✅ Domanda ${newQ.number}: UNICA`);
        }
    });
    
    // Salva il report
    fs.writeFileSync(outputPath, JSON.stringify(comparison, null, 2), 'utf8');
    
    console.log('\n📊 RISULTATI DEL CONFRONTO:');
    console.log('='.repeat(60));
    console.log(`Totale domande nel nuovo PDF: ${comparison.totalNewQuestions}`);
    console.log(`Totale domande esistenti: ${comparison.totalExistingQuestions}`);
    console.log(`Domande duplicate: ${comparison.duplicates.length}`);
    console.log(`Domande uniche (nuove): ${comparison.unique.length}`);
    console.log('='.repeat(60));
    console.log(`\n📄 Report salvato in: ${outputPath}`);
}

// Esegui il confronto
compareQuizzes().catch(console.error);
