const fs = require('fs');
const path = require('path');

/**
 * Script per confrontare le domande di ssfo-quiz-modello6.pdf
 * con tutti i file esistenti
 */

const existingQuizPath = path.join(__dirname, 'quiz-data.json');
const newQuizPath = path.join(__dirname, 'new-quiz-data.json');
const modello3QuizPath = path.join(__dirname, 'modello3-quiz-data.json');
const modello4QuizPath = path.join(__dirname, 'modello4-quiz-data.json');
const modello5QuizPath = path.join(__dirname, 'modello5-quiz-data.json');
const modello6QuizPath = path.join(__dirname, 'modello6-quiz-data.json');
const outputPath = path.join(__dirname, 'comparison-modello6-report.json');

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

const modello5Data = JSON.parse(fs.readFileSync(modello5QuizPath, 'utf8'));
const modello5Quizzes = modello5Data.quizzes || [];
console.log(`✅ Caricati ${modello5Quizzes.length} quiz da modello5-quiz-data.json`);

// Carica i quiz del modello6 (se esiste)
let modello6Quizzes = [];
if (fs.existsSync(modello6QuizPath)) {
    const modello6Data = JSON.parse(fs.readFileSync(modello6QuizPath, 'utf8'));
    modello6Quizzes = modello6Data.quizzes || [];
    console.log(`✅ Caricati ${modello6Quizzes.length} quiz da modello6-quiz-data.json`);
} else {
    console.log(`⚠️  File modello6-quiz-data.json non trovato. Esegui prima extractModello6Quizzes.js`);
}

// Crea un indice delle domande esistenti
const allExistingQuestionsIndex = new Map();

// Aggiungi tutti i file esistenti
[existingQuizzes, newQuizzes, modello3Quizzes, modello4Quizzes, modello5Quizzes].forEach((quizzes, index) => {
    const sources = ['quiz-data.json', 'new-quiz-data.json', 'modello3-quiz-data.json', 'modello4-quiz-data.json', 'modello5-quiz-data.json'];
    quizzes.forEach(quiz => {
        const normalized = normalizeForComparison(quiz.question);
        if (!allExistingQuestionsIndex.has(normalized)) {
            allExistingQuestionsIndex.set(normalized, []);
        }
        allExistingQuestionsIndex.get(normalized).push({
            id: quiz.id,
            question: quiz.question,
            category: quiz.category,
            source: sources[index]
        });
    });
});

// Confronta le domande del modello6
function compareQuizzes() {
    if (modello6Quizzes.length === 0) {
        console.log('\n⚠️  Nessuna domanda del modello6 da confrontare.');
        console.log('   Esegui prima: node extractModello6Quizzes.js');
        return;
    }
    
    const comparison = {
        source: 'ssfo-quiz-modello6.pdf',
        totalModello6Questions: modello6Quizzes.length,
        totalExistingQuestions: existingQuizzes.length,
        totalNewQuestions: newQuizzes.length,
        totalModello3Questions: modello3Quizzes.length,
        totalModello4Questions: modello4Quizzes.length,
        totalModello5Questions: modello5Quizzes.length,
        duplicates: [],
        unique: []
    };
    
    console.log('\n🔍 Confronto delle domande...\n');
    
    modello6Quizzes.forEach((q) => {
        const normalized = normalizeForComparison(q.question);
        const existingMatches = allExistingQuestionsIndex.get(normalized) || [];
        
        if (existingMatches.length > 0) {
            comparison.duplicates.push({
                modello6Id: q.id,
                modello6Question: q.question.substring(0, 150),
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
    console.log(`Totale domande in modello6: ${comparison.totalModello6Questions}`);
    console.log(`Totale domande in quiz-data.json: ${comparison.totalExistingQuestions}`);
    console.log(`Totale domande in new-quiz-data.json: ${comparison.totalNewQuestions}`);
    console.log(`Totale domande in modello3-quiz-data.json: ${comparison.totalModello3Questions}`);
    console.log(`Totale domande in modello4-quiz-data.json: ${comparison.totalModello4Questions}`);
    console.log(`Totale domande in modello5-quiz-data.json: ${comparison.totalModello5Questions}`);
    console.log(`\nDuplicati trovati: ${comparison.duplicates.length}`);
    console.log(`Domande uniche (nuove): ${comparison.unique.length}`);
    console.log('='.repeat(60));
    console.log(`\n📄 Report salvato in: ${outputPath}`);
}

// Esegui il confronto
compareQuizzes();

