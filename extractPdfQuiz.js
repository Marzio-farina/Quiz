const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

/**
 * Script per estrarre quiz dal PDF "Banca dati unisa farmacia ospedaliera"
 * 
 * Struttura del PDF:
 * Domanda[testo domanda]
 * [risposta 1]
 * [risposta 2]
 * [risposta 3]
 * [risposta 4]
 * [risposta 5]
 * Risposta esatta
 * [lettera corretta]
 * A
 * B
 * C
 * D
 * E
 * N°[numero]
 */

// Percorsi dei file
const pdfPath = path.join(__dirname, 'Banca dati unisa farmacia ospedaliera.pdf');
const outputPath = path.join(__dirname, 'quiz-data.json');

/**
 * Funzione per pulire il testo
 */
function cleanText(text) {
    return text.trim().replace(/\s+/g, ' ');
}

/**
 * Funzione principale per estrarre i quiz
 */
function extractQuizzes(text) {
    const quizzes = [];
    
    // Dividi il testo usando "Domanda" come separatore
    const sections = text.split(/(?=Domanda)/);
    
    let quizNumber = 1;
    
    for (const section of sections) {
        if (section.trim().length < 20) continue;
        
        try {
            const quiz = parseQuizSection(section, quizNumber);
            if (quiz) {
                quizzes.push(quiz);
                quizNumber++;
            }
        } catch (error) {
            console.error(`Errore nel parsing del quiz ${quizNumber}:`, error.message);
        }
    }
    
    return quizzes;
}

/**
 * Funzione per parsare una singola sezione di quiz
 */
function parseQuizSection(section, quizNumber) {
    // Pulisci e dividi in linee
    const lines = section
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    if (lines.length < 5) {
        return null;
    }
    
    // Trova gli indici chiave
    let questionStartIndex = -1;
    let correctAnswerIndex = -1;
    let numberIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.startsWith('Domanda')) {
            questionStartIndex = i;
        } else if (/^Risposta\s+esatta$/i.test(line)) {
            correctAnswerIndex = i;
        } else if (/^N°\d+$/.test(line)) {
            numberIndex = i;
        }
    }
    
    // Verifica che abbiamo trovato tutti gli elementi necessari
    if (questionStartIndex === -1 || correctAnswerIndex === -1) {
        return null;
    }
    
    // Estrai la domanda
    // La domanda inizia dopo "Domanda" e finisce quando iniziano le risposte
    // Le risposte sono tra la domanda e "Risposta esatta"
    let questionText = lines[questionStartIndex].replace(/^Domanda/, '').trim();
    
    // Se la domanda è su più righe, continua fino a trovare le risposte
    let answerStartIndex = questionStartIndex + 1;
    
    // La domanda può continuare su più linee fino alle risposte
    // Le risposte sono le 5 linee prima di "Risposta esatta"
    const answerEndIndex = correctAnswerIndex;
    
    // Trova dove iniziano le risposte (5 linee prima di "Risposta esatta")
    answerStartIndex = correctAnswerIndex - 5;
    
    if (answerStartIndex <= questionStartIndex) {
        answerStartIndex = questionStartIndex + 1;
    }
    
    // Raccogli il resto della domanda (se su più linee)
    for (let i = questionStartIndex + 1; i < answerStartIndex; i++) {
        const line = lines[i];
        // Non includere le lettere singole A, B, C, D, E nella domanda
        if (!/^[A-E]$/.test(line)) {
            questionText += ' ' + line;
        }
    }
    
    questionText = cleanText(questionText);
    
    // Estrai le 5 risposte
    const answers = [];
    for (let i = 0; i < 5 && (answerStartIndex + i) < correctAnswerIndex; i++) {
        const answerText = lines[answerStartIndex + i];
        // Salta le linee che sono solo lettere singole
        if (!/^[A-E]$/.test(answerText) && answerText.length > 1) {
            answers.push({
                letter: String.fromCharCode(65 + answers.length), // A=65, B=66, etc.
                text: cleanText(answerText)
            });
        }
    }
    
    // Se non abbiamo esattamente 5 risposte, proviamo un altro approccio
    if (answers.length !== 5) {
        answers.length = 0;
        // Le risposte sono le linee tra la domanda e "Risposta esatta"
        // escludendo le linee molto corte o che sono solo lettere
        for (let i = questionStartIndex + 1; i < correctAnswerIndex; i++) {
            const line = lines[i];
            if (line.length > 2 && !/^[A-E]$/.test(line) && answers.length < 5) {
                // Non è la domanda
                const isPartOfQuestion = questionText.includes(line);
                if (!isPartOfQuestion) {
                    answers.push({
                        letter: String.fromCharCode(65 + answers.length),
                        text: cleanText(line)
                    });
                }
            }
        }
    }
    
    // Se ancora non abbiamo 5 risposte, ricostruisci la domanda e le risposte
    if (answers.length < 5) {
        // Metodo alternativo: tutto tra "Domanda" e "Risposta esatta"
        const contentLines = lines.slice(questionStartIndex + 1, correctAnswerIndex)
            .filter(l => l.length > 2 && !/^[A-E]$/.test(l));
        
        if (contentLines.length >= 6) {
            // La prima è la domanda (o le prime linee)
            questionText = contentLines[0];
            answers.length = 0;
            
            // Le ultime 5 sono le risposte
            for (let i = contentLines.length - 5; i < contentLines.length; i++) {
                if (i >= 0) {
                    answers.push({
                        letter: String.fromCharCode(65 + answers.length),
                        text: cleanText(contentLines[i])
                    });
                }
            }
        }
    }
    
    // Estrai la risposta corretta
    let correctAnswer = '';
    if (correctAnswerIndex + 1 < lines.length) {
        const nextLine = lines[correctAnswerIndex + 1];
        if (/^[A-E]$/.test(nextLine)) {
            correctAnswer = nextLine;
        }
    }
    
    // Validazione
    if (!questionText || questionText.length < 10) {
        console.warn(`Quiz ${quizNumber}: domanda troppo corta o mancante`);
        return null;
    }
    
    if (answers.length !== 5) {
        console.warn(`Quiz ${quizNumber}: trovate ${answers.length} risposte invece di 5`);
        // Continua comunque se abbiamo almeno 2 risposte
        if (answers.length < 2) {
            return null;
        }
    }
    
    if (!correctAnswer) {
        console.warn(`Quiz ${quizNumber}: risposta corretta non trovata`);
    }
    
    return {
        id: quizNumber,
        question: questionText,
        answers: answers,
        correctAnswer: correctAnswer || 'NON_TROVATA'
    };
}

/**
 * Funzione principale
 */
async function main() {
    try {
        console.log('📖 Lettura del PDF in corso...');
        
        // Leggi il file PDF
        const dataBuffer = fs.readFileSync(pdfPath);
        
        console.log('🔍 Parsing del PDF...');
        
        // Parsa il PDF
        const data = await pdf(dataBuffer);
        
        console.log(`📄 Pagine trovate: ${data.numpages}`);
        console.log(`📝 Caratteri totali: ${data.text.length}`);
        
        // Estrai i quiz
        console.log('\n🎯 Estrazione quiz in corso...');
        const quizzes = extractQuizzes(data.text);
        
        console.log(`✅ Quiz estratti: ${quizzes.length}`);
        
        // Mostra un riepilogo
        console.log('\n📊 Riepilogo:');
        console.log(`   - Quiz totali: ${quizzes.length}`);
        console.log(`   - Quiz validi: ${quizzes.filter(q => q.correctAnswer !== 'NON_TROVATA').length}`);
        console.log(`   - Quiz senza risposta: ${quizzes.filter(q => q.correctAnswer === 'NON_TROVATA').length}`);
        console.log(`   - Quiz con 5 risposte: ${quizzes.filter(q => q.answers.length === 5).length}`);
        
        // Salva il JSON
        const jsonOutput = {
            metadata: {
                sourceFile: 'Banca dati unisa farmacia ospedaliera.pdf',
                extractionDate: new Date().toISOString(),
                totalQuizzes: quizzes.length,
                pdfPages: data.numpages
            },
            quizzes: quizzes
        };
        
        fs.writeFileSync(outputPath, JSON.stringify(jsonOutput, null, 2), 'utf8');
        
        console.log(`\n💾 File salvato: ${outputPath}`);
        console.log('\n✨ Estrazione completata!');
        
        // Mostra i primi 3 quiz come esempio
        if (quizzes.length > 0) {
            console.log('\n📋 Esempio (primi 3 quiz):');
            quizzes.slice(0, 3).forEach(quiz => {
                console.log(`\n--- Quiz ${quiz.id} ---`);
                console.log(`Domanda: ${quiz.question.substring(0, 80)}${quiz.question.length > 80 ? '...' : ''}`);
                console.log(`Risposte (${quiz.answers.length}):`);
                quiz.answers.forEach(ans => {
                    console.log(`  ${ans.letter}) ${ans.text.substring(0, 60)}${ans.text.length > 60 ? '...' : ''}`);
                });
                console.log(`Risposta corretta: ${quiz.correctAnswer}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Errore durante l\'estrazione:', error);
        process.exit(1);
    }
}

// Esegui lo script
main();
