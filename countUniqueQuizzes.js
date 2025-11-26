const fs = require('fs');
const path = require('path');

// Funzione per normalizzare il testo di una domanda per il confronto
function normalizeQuestionText(text) {
    if (!text || typeof text !== 'string') return '';
    return text.trim()
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Rimuove punteggiatura
        .replace(/\s+/g, ' ') // Sostituisce spazi multipli con uno solo
        .substring(0, 150); // Prende i primi 150 caratteri
}

// Lista di tutti i file JSON da analizzare
const jsonFiles = [
    { name: 'quiz-data.json', priority: 1 },
    { name: 'new-quiz-data.json', priority: 2 },
    { name: 'modello3-quiz-data.json', priority: 3 },
    { name: 'modello4-quiz-data.json', priority: 4 },
    { name: 'modello5-quiz-data.json', priority: 5 },
    { name: 'modello6-quiz-data.json', priority: 6 },
    { name: 'modello7-quiz-data.json', priority: 7 }
];

const baseDir = __dirname;
const allQuizzes = [];
const fileStats = {};

console.log('📚 Analisi dei file JSON per contare le domande uniche...\n');

// Carica tutti i file JSON
for (const fileInfo of jsonFiles) {
    const fileName = fileInfo.name;
    const filePath = path.join(baseDir, fileName);
    
    try {
        if (fs.existsSync(filePath)) {
            const rawData = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(rawData);
            if (data.quizzes && Array.isArray(data.quizzes)) {
                fileStats[fileName] = {
                    total: data.quizzes.length,
                    loaded: 0
                };
                
                // Aggiungi i quiz con informazioni sul file di origine
                data.quizzes.forEach(quiz => {
                    allQuizzes.push({
                        ...quiz,
                        sourceFile: fileName,
                        priority: fileInfo.priority
                    });
                    fileStats[fileName].loaded++;
                });
                
                console.log(`✅ ${fileName}: ${data.quizzes.length} quiz`);
            } else {
                console.log(`⚠️  ${fileName}: struttura dati non valida`);
                fileStats[fileName] = { total: 0, loaded: 0 };
            }
        } else {
            console.log(`⚠️  ${fileName}: file non trovato`);
            fileStats[fileName] = { total: 0, loaded: 0 };
        }
    } catch (error) {
        console.error(`❌ Errore nel caricamento di ${fileName}:`, error.message);
        fileStats[fileName] = { total: 0, loaded: 0, error: error.message };
    }
}

console.log(`\n📊 Totale quiz caricati: ${allQuizzes.length}\n`);

// Rimuovi duplicati mantenendo la priorità (quiz-data.json ha priorità più alta)
console.log('🔄 Analisi duplicati...\n');

const seen = new Map(); // Map<normalizedText, quiz>
const uniqueQuizzes = [];
const duplicatesByFile = {};

for (const quiz of allQuizzes) {
    const normalizedText = normalizeQuestionText(quiz.question);
    
    if (!normalizedText) {
        continue;
    }
    
    if (!seen.has(normalizedText)) {
        // Prima volta che vediamo questa domanda, aggiungila
        seen.set(normalizedText, quiz);
        uniqueQuizzes.push(quiz);
    } else {
        // Duplicato trovato
        const existingQuiz = seen.get(normalizedText);
        const duplicateFile = quiz.sourceFile;
        
        if (!duplicatesByFile[duplicateFile]) {
            duplicatesByFile[duplicateFile] = [];
        }
        duplicatesByFile[duplicateFile].push({
            id: quiz.id,
            question: quiz.question.substring(0, 100) + '...',
            duplicateOf: existingQuiz.sourceFile,
            duplicateOfId: existingQuiz.id
        });
    }
}

// Statistiche per categoria
const categoryStats = {};
uniqueQuizzes.forEach(quiz => {
    const category = quiz.category || 'ALTRO';
    categoryStats[category] = (categoryStats[category] || 0) + 1;
});

// Statistiche per file (solo quiz unici)
const uniqueByFile = {};
uniqueQuizzes.forEach(quiz => {
    const file = quiz.sourceFile;
    uniqueByFile[file] = (uniqueByFile[file] || 0) + 1;
});

console.log('📊 RISULTATI:\n');
console.log('='.repeat(60));
console.log(`Totale quiz caricati: ${allQuizzes.length}`);
console.log(`Totale quiz unici (senza duplicati): ${uniqueQuizzes.length}`);
console.log(`Totale duplicati rimossi: ${allQuizzes.length - uniqueQuizzes.length}`);
console.log('='.repeat(60));

console.log('\n📋 Quiz unici per file:');
for (const fileInfo of jsonFiles) {
    const fileName = fileInfo.name;
    const unique = uniqueByFile[fileName] || 0;
    const total = fileStats[fileName]?.total || 0;
    const duplicates = total - unique;
    console.log(`   ${fileName}:`);
    console.log(`      - Totali: ${total}`);
    console.log(`      - Unici: ${unique}`);
    console.log(`      - Duplicati: ${duplicates}`);
}

console.log('\n📋 Quiz unici per categoria:');
const sortedCategories = Object.entries(categoryStats).sort((a, b) => b[1] - a[1]);
for (const [category, count] of sortedCategories) {
    console.log(`   ${category}: ${count}`);
}

if (Object.keys(duplicatesByFile).length > 0) {
    console.log('\n⚠️  Duplicati trovati per file:');
    for (const [file, duplicates] of Object.entries(duplicatesByFile)) {
        console.log(`   ${file}: ${duplicates.length} duplicati`);
        if (duplicates.length <= 5) {
            duplicates.forEach(dup => {
                console.log(`      - ID ${dup.id}: duplicato di ${dup.duplicateOf} (ID ${dup.duplicateOfId})`);
            });
        }
    }
}

console.log('\n✅ Analisi completata!\n');

