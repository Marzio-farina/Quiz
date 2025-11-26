const fs = require('fs');
const path = require('path');

/**
 * Script per confrontare le domande di ssfo-quiz-modello3.pdf
 * con quiz-data.json e new-quiz-data.json
 * 
 * Questo script può leggere da un file di testo se il PDF è scansionato
 */

const existingQuizPath = path.join(__dirname, 'quiz-data.json');
const newQuizPath = path.join(__dirname, 'new-quiz-data.json');
const textInputPath = path.join(__dirname, 'Ulteriori quiz', 'ssfo-quiz-modello3.txt');
const outputPath = path.join(__dirname, 'comparison-modello3-report.json');

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
console.log(`✅ Caricati ${existingQuizzes.length} quiz da quiz-data.json`);

// Carica i nuovi quiz
console.log('📖 Caricamento nuovi quiz...');
const newData = JSON.parse(fs.readFileSync(newQuizPath, 'utf8'));
const newQuizzes = newData.quizzes || [];
console.log(`✅ Caricati ${newQuizzes.length} quiz da new-quiz-data.json`);

// Crea un indice delle domande esistenti (quiz-data.json)
const existingQuestionsIndex = new Map();
existingQuizzes.forEach(quiz => {
    const normalized = normalizeForComparison(quiz.question);
    if (!existingQuestionsIndex.has(normalized)) {
        existingQuestionsIndex.set(normalized, []);
    }
    existingQuestionsIndex.get(normalized).push({
        id: quiz.id,
        question: quiz.question,
        category: quiz.category,
        source: 'quiz-data.json'
    });
});

// Crea un indice delle domande nuove (new-quiz-data.json)
const newQuestionsIndex = new Map();
newQuizzes.forEach(quiz => {
    const normalized = normalizeForComparison(quiz.question);
    if (!newQuestionsIndex.has(normalized)) {
        newQuestionsIndex.set(normalized, []);
    }
    newQuestionsIndex.get(normalized).push({
        id: quiz.id,
        question: quiz.question,
        category: quiz.category,
        source: 'new-quiz-data.json'
    });
});

// Estrai le domande dal file di testo (se disponibile) o usa il contenuto fornito
function extractQuestionsFromText() {
    console.log('\n📄 Estrazione domande da file di testo...');
    
    let text = '';
    
    // Prova a leggere da file di testo
    if (fs.existsSync(textInputPath)) {
        console.log(`📖 Lettura da file: ${textInputPath}`);
        text = fs.readFileSync(textInputPath, 'utf8');
    } else {
        console.log(`⚠️  File di testo non trovato: ${textInputPath}`);
        console.log(`💡 Suggerimento: Estrai il testo dal PDF usando un tool OCR o copia-incolla`);
        console.log(`   e salvalo come: ${textInputPath}`);
        return [];
    }
    
    // Dividi per righe
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    console.log(`📝 Totale righe: ${lines.length}`);
    
    const questions = [];
    let currentQuestion = null;
    let currentAnswers = [];
    let questionNumber = 0;
    let expectingAnswers = false;
    
    // Pattern per identificare domande
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Pattern 1: "Anteprima quesito 1101" o "# Anteprima quesito 1101"
        const previewMatch = line.match(/(?:#\s*)?Anteprima\s+quesito\s+(\d+)/i);
        if (previewMatch) {
            // Salva la domanda precedente se ha almeno 1 risposta
            if (currentQuestion && currentAnswers.length >= 1) {
                questions.push({
                    number: questionNumber,
                    question: currentQuestion.trim(),
                    answers: currentAnswers.slice(0, 5).map(a => a.trim()).filter(a => a.length > 0)
                });
            }
            
            questionNumber = parseInt(previewMatch[1]);
            currentQuestion = null;
            currentAnswers = [];
            expectingAnswers = false;
            continue;
        }
        
        // Pattern 2: Domanda che inizia con "## " (markdown header) - potrebbe essere la domanda stessa
        if (line.startsWith('## ')) {
            const questionText = line.replace(/^##\s*/, '').trim();
            if (questionText.length > 10) {
                // Se abbiamo già una domanda, salvala
                if (currentQuestion && currentAnswers.length >= 1) {
                    questions.push({
                        number: questionNumber,
                        question: currentQuestion.trim(),
                        answers: currentAnswers.slice(0, 5).map(a => a.trim()).filter(a => a.length > 0)
                    });
                }
                // Se non abbiamo ancora una domanda o numero, usa questa come domanda
                if (currentQuestion === null || questionNumber === 0) {
                    // Prova a estrarre il numero dalla riga precedente o usa un numero incrementale
                    if (questionNumber === 0) {
                        questionNumber = questions.length > 0 ? questions[questions.length - 1].number + 1 : 1101;
                    }
                    currentQuestion = questionText;
                } else {
                    // Altrimenti aggiungi alla domanda corrente
                    currentQuestion += ' ' + questionText;
                }
                currentAnswers = [];
                expectingAnswers = false;
            }
            continue;
        }
        
        // Pattern 3: Domanda che inizia con numero seguito da punto
        const questionMatch = line.match(/^(\d+)\.\s*(.+)/);
        if (questionMatch) {
            if (currentQuestion && currentAnswers.length >= 1) {
                questions.push({
                    number: questionNumber,
                    question: currentQuestion.trim(),
                    answers: currentAnswers.slice(0, 5).map(a => a.trim()).filter(a => a.length > 0)
                });
            }
            
            questionNumber = parseInt(questionMatch[1]);
            currentQuestion = questionMatch[2].trim();
            currentAnswers = [];
            expectingAnswers = false;
            continue;
        }
        
        // Se abbiamo una domanda corrente, cerca risposte
        if (currentQuestion !== null) {
            // Pattern per risposte: A), B), C), D), E) o A. B. C. D. E.
            const answerMatch = line.match(/^([A-E])[\)\.]\s*(.+)/i);
            if (answerMatch) {
                const answerText = answerMatch[2].trim();
                if (answerText.length > 0) {
                    currentAnswers.push(answerText);
                    expectingAnswers = true;
                }
                continue;
            }
            
            // Pattern per risposte con checkbox: ☐ o ✓
            if (/^[☐✓]\s/.test(line) || /^[☐✓]/.test(line)) {
                const answerText = line.replace(/^[☐✓]\s*/, '').trim();
                if (answerText.length > 0) {
                    currentAnswers.push(answerText);
                    expectingAnswers = true;
                }
                continue;
            }
            
            // Pattern per risposte senza lettere (solo testo, dopo la domanda)
            // Se la riga non è vuota, non è un separatore, non è una nuova domanda, e abbiamo già una domanda
            if (line.length > 5 && !line.startsWith('---') && !line.startsWith('#') && 
                !/^\d+\./.test(line) && currentAnswers.length < 5) {
                // Se sembra una risposta (non inizia con caratteri speciali di domanda)
                if (!/^[A-E][\)\.]/.test(line) && !/^[☐✓]/.test(line)) {
                    // Potrebbe essere una risposta senza lettera
                    currentAnswers.push(line);
                    expectingAnswers = true;
                    continue;
                }
            }
            
            // Se la riga inizia con "---" potrebbe essere un separatore
            if (line.startsWith('---')) {
                if (currentQuestion && currentAnswers.length >= 1) {
                    questions.push({
                        number: questionNumber,
                        question: currentQuestion.trim(),
                        answers: currentAnswers.slice(0, 5).map(a => a.trim()).filter(a => a.length > 0)
                    });
                }
                currentQuestion = null;
                currentAnswers = [];
                expectingAnswers = false;
                continue;
            }
            
            // Continua la domanda se non abbiamo ancora risposte
            if (!expectingAnswers && currentAnswers.length === 0 && line.length > 5 && 
                !/^[A-E]$/i.test(line) && !/^\d+\./.test(line) && !line.startsWith('---')) {
                currentQuestion += ' ' + line;
            }
            // Se abbiamo risposte e la riga non è una lettera singola, potrebbe essere continuazione
            else if (expectingAnswers && currentAnswers.length > 0 && currentAnswers.length < 5 && 
                     line.length > 2 && !/^[A-E]$/i.test(line) && !/^[A-E][\)\.]/.test(line) && 
                     !/^[☐✓]/.test(line) && !/^\d+\./.test(line) && !line.startsWith('---')) {
                const lastIndex = currentAnswers.length - 1;
                if (currentAnswers[lastIndex]) {
                    currentAnswers[lastIndex] = currentAnswers[lastIndex] + ' ' + line;
                }
            }
        }
        // Se non abbiamo ancora una domanda ma la riga sembra essere una domanda
        else if (currentQuestion === null && line.length > 20 && !/^\d+\./.test(line) && 
                 !/^[A-E][\)\.]/.test(line) && !line.startsWith('---') && !line.startsWith('Anteprima')) {
            currentQuestion = line;
            currentAnswers = [];
            expectingAnswers = false;
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
    
    console.log(`✅ Estratte ${questions.length} domande dal file di testo`);
    if (questions.length > 0) {
        console.log(`📋 Esempio prima domanda:`);
        console.log(`   Numero: ${questions[0].number}`);
        console.log(`   Domanda: ${questions[0].question.substring(0, 100)}...`);
        console.log(`   Risposte: ${questions[0].answers.length}`);
    }
    
    return questions;
}

// Confronta le domande
function compareQuizzes() {
    const modello3Questions = extractQuestionsFromText();
    
    if (modello3Questions.length === 0) {
        console.log('\n⚠️  Nessuna domanda estratta. Impossibile procedere con il confronto.');
        console.log(`\n💡 Per estrarre il testo dal PDF scansionato, puoi:`);
        console.log(`   1. Usare un tool OCR online (es: https://www.onlineocr.net/)`);
        console.log(`   2. Usare Adobe Acrobat Reader per esportare come testo`);
        console.log(`   3. Copiare il testo manualmente dal PDF`);
        console.log(`\n   Salva il testo come: ${textInputPath}`);
        return;
    }
    
    const comparison = {
        source: 'ssfo-quiz-modello3.pdf',
        totalModello3Questions: modello3Questions.length,
        totalExistingQuestions: existingQuizzes.length,
        totalNewQuestions: newQuizzes.length,
        duplicatesWithExisting: [],
        duplicatesWithNew: [],
        unique: []
    };
    
    console.log('\n🔍 Confronto delle domande...\n');
    
    modello3Questions.forEach((q) => {
        const normalized = normalizeForComparison(q.question);
        const existingMatches = existingQuestionsIndex.get(normalized) || [];
        const newMatches = newQuestionsIndex.get(normalized) || [];
        
        const isDuplicateWithExisting = existingMatches.length > 0;
        const isDuplicateWithNew = newMatches.length > 0;
        
        if (isDuplicateWithExisting || isDuplicateWithNew) {
            if (isDuplicateWithExisting) {
                comparison.duplicatesWithExisting.push({
                    modello3Number: q.number,
                    modello3Question: q.question.substring(0, 150),
                    existingMatches: existingMatches.map(m => ({
                        id: m.id,
                        question: m.question.substring(0, 150),
                        category: m.category,
                        source: m.source
                    }))
                });
                console.log(`⚠️  Domanda ${q.number}: DUPLICATO con quiz-data.json (ID: ${existingMatches.map(m => m.id).join(', ')})`);
            }
            
            if (isDuplicateWithNew) {
                comparison.duplicatesWithNew.push({
                    modello3Number: q.number,
                    modello3Question: q.question.substring(0, 150),
                    newMatches: newMatches.map(m => ({
                        id: m.id,
                        question: m.question.substring(0, 150),
                        category: m.category,
                        source: m.source
                    }))
                });
                console.log(`⚠️  Domanda ${q.number}: DUPLICATO con new-quiz-data.json (ID: ${newMatches.map(m => m.id).join(', ')})`);
            }
        } else {
            comparison.unique.push({
                number: q.number,
                question: q.question,
                answers: q.answers
            });
            console.log(`✅ Domanda ${q.number}: UNICA`);
        }
    });
    
    // Salva il report
    fs.writeFileSync(outputPath, JSON.stringify(comparison, null, 2), 'utf8');
    
    console.log('\n📊 RISULTATI DEL CONFRONTO:');
    console.log('='.repeat(60));
    console.log(`Totale domande in modello3: ${comparison.totalModello3Questions}`);
    console.log(`Totale domande in quiz-data.json: ${comparison.totalExistingQuestions}`);
    console.log(`Totale domande in new-quiz-data.json: ${comparison.totalNewQuestions}`);
    console.log(`\nDuplicati con quiz-data.json: ${comparison.duplicatesWithExisting.length}`);
    console.log(`Duplicati con new-quiz-data.json: ${comparison.duplicatesWithNew.length}`);
    console.log(`Domande uniche (nuove): ${comparison.unique.length}`);
    console.log('='.repeat(60));
    console.log(`\n📄 Report salvato in: ${outputPath}`);
}

// Esegui il confronto
compareQuizzes();

