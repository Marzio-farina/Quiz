const fs = require('fs');
const path = require('path');

/**
 * Script per confrontare le domande di ssfo-quiz-modello5.pdf
 * con quiz-data.json, new-quiz-data.json, modello3-quiz-data.json e modello4-quiz-data.json
 */

const existingQuizPath = path.join(__dirname, 'quiz-data.json');
const newQuizPath = path.join(__dirname, 'new-quiz-data.json');
const modello3QuizPath = path.join(__dirname, 'modello3-quiz-data.json');
const modello4QuizPath = path.join(__dirname, 'modello4-quiz-data.json');
const modello5QuizPath = path.join(__dirname, 'modello5-quiz-data.json');
const outputPath = path.join(__dirname, 'comparison-modello5-report.json');

// Funzione per normalizzare il testo per il confronto
function normalizeForComparison(text) {
    return text.trim()
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .substring(0, 150);
}

// Carica tutti i quiz esistenti
console.log('📖 Caricamento quiz esistenti...');
const existingData = JSON.parse(fs.readFileSync(existingQuizPath, 'utf8'));
const existingQuizzes = existingData.quizzes || [];
console.log(`✅ Caricati ${existingQuizzes.length} quiz da quiz-data.json`);

const newData = JSON.parse(fs.readFileSync(newQuizPath, 'utf8'));
const newQuizzes = newData.quizzes || [];
console.log(`✅ Caricati ${newQuizzes.length} quiz da new-quiz-data.json`);

const modello3Data = JSON.parse(fs.readFileSync(modello3QuizPath, 'utf8'));
const modello3Quizzes = modello3Data.quizzes || [];
console.log(`✅ Caricati ${modello3Quizzes.length} quiz da modello3-quiz-data.json`);

const modello4Data = JSON.parse(fs.readFileSync(modello4QuizPath, 'utf8'));
const modello4Quizzes = modello4Data.quizzes || [];
console.log(`✅ Caricati ${modello4Quizzes.length} quiz da modello4-quiz-data.json`);

// Carica i quiz del modello5 (se esiste)
let modello5Quizzes = [];
if (fs.existsSync(modello5QuizPath)) {
    const modello5Data = JSON.parse(fs.readFileSync(modello5QuizPath, 'utf8'));
    modello5Quizzes = modello5Data.quizzes || [];
    console.log(`✅ Caricati ${modello5Quizzes.length} quiz da modello5-quiz-data.json`);
} else {
    console.log(`⚠️  File modello5-quiz-data.json non trovato. Esegui prima extractModello5Quizzes.js`);
}

// Crea un indice delle domande esistenti
const allExistingQuestionsIndex = new Map();

// Aggiungi quiz-data.json
existingQuizzes.forEach(quiz => {
    const normalized = normalizeForComparison(quiz.question);
    if (!allExistingQuestionsIndex.has(normalized)) {
        allExistingQuestionsIndex.set(normalized, []);
    }
    allExistingQuestionsIndex.get(normalized).push({
        id: quiz.id,
        question: quiz.question,
        category: quiz.category,
        source: 'quiz-data.json'
    });
});

// Aggiungi new-quiz-data.json
newQuizzes.forEach(quiz => {
    const normalized = normalizeForComparison(quiz.question);
    if (!allExistingQuestionsIndex.has(normalized)) {
        allExistingQuestionsIndex.set(normalized, []);
    }
    allExistingQuestionsIndex.get(normalized).push({
        id: quiz.id,
        question: quiz.question,
        category: quiz.category,
        source: 'new-quiz-data.json'
    });
});

// Aggiungi modello3-quiz-data.json
modello3Quizzes.forEach(quiz => {
    const normalized = normalizeForComparison(quiz.question);
    if (!allExistingQuestionsIndex.has(normalized)) {
        allExistingQuestionsIndex.set(normalized, []);
    }
    allExistingQuestionsIndex.get(normalized).push({
        id: quiz.id,
        question: quiz.question,
        category: quiz.category,
        source: 'modello3-quiz-data.json'
    });
});

// Aggiungi modello4-quiz-data.json
modello4Quizzes.forEach(quiz => {
    const normalized = normalizeForComparison(quiz.question);
    if (!allExistingQuestionsIndex.has(normalized)) {
        allExistingQuestionsIndex.set(normalized, []);
    }
    allExistingQuestionsIndex.get(normalized).push({
        id: quiz.id,
        question: quiz.question,
        category: quiz.category,
        source: 'modello4-quiz-data.json'
    });
});

// Confronta le domande del modello5
function compareQuizzes() {
    if (modello5Quizzes.length === 0) {
        console.log('\n⚠️  Nessuna domanda del modello5 da confrontare.');
        console.log('   Esegui prima: node extractModello5Quizzes.js');
        return;
    }
    
    const comparison = {
        source: 'ssfo-quiz-modello5.pdf',
        totalModello5Questions: modello5Quizzes.length,
        totalExistingQuestions: existingQuizzes.length,
        totalNewQuestions: newQuizzes.length,
        totalModello3Questions: modello3Quizzes.length,
        totalModello4Questions: modello4Quizzes.length,
        duplicates: [],
        unique: []
    };
    
    console.log('\n🔍 Confronto delle domande...\n');
    
    modello5Quizzes.forEach((q) => {
        const normalized = normalizeForComparison(q.question);
        const existingMatches = allExistingQuestionsIndex.get(normalized) || [];
        
        if (existingMatches.length > 0) {
            comparison.duplicates.push({
                modello5Id: q.id,
                modello5Question: q.question.substring(0, 150),
                existingMatches: existingMatches.map(m => ({
                    id: m.id,
                    question: m.question.substring(0, 150),
                    category: m.category,
                    source: m.source
                }))
            });
            console.log(`⚠️  Domanda ${q.id}: DUPLICATO (${existingMatches.map(m => `${m.source}:${m.id}`).join(', ')})`);
        } else {
            comparison.unique.push({
                id: q.id,
                question: q.question,
                category: q.category,
                subcategory: q.subcategory,
                answers: q.answers
            });
            console.log(`✅ Domanda ${q.id}: UNICA`);
        }
    });
    
    // Salva il report
    fs.writeFileSync(outputPath, JSON.stringify(comparison, null, 2), 'utf8');
    
    console.log('\n📊 RISULTATI DEL CONFRONTO:');
    console.log('='.repeat(60));
    console.log(`Totale domande in modello5: ${comparison.totalModello5Questions}`);
    console.log(`Totale domande in quiz-data.json: ${comparison.totalExistingQuestions}`);
    console.log(`Totale domande in new-quiz-data.json: ${comparison.totalNewQuestions}`);
    console.log(`Totale domande in modello3-quiz-data.json: ${comparison.totalModello3Questions}`);
    console.log(`Totale domande in modello4-quiz-data.json: ${comparison.totalModello4Questions}`);
    console.log(`\nDuplicati trovati: ${comparison.duplicates.length}`);
    console.log(`Domande uniche (nuove): ${comparison.unique.length}`);
    console.log('='.repeat(60));
    console.log(`\n📄 Report salvato in: ${outputPath}`);
}

// Esegui il confronto
compareQuizzes();

