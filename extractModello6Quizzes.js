const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

/**
 * Script per estrarre quiz dal PDF ssfo-quiz-modello6.pdf
 * Estrae domande, risposte e risposte corrette, e applica categorizzazione automatica
 */

const pdfPath = path.join(__dirname, 'Ulteriori quiz', 'ssfo-quiz-modello6.pdf');
const textPath = path.join(__dirname, 'Ulteriori quiz', 'ssfo-quiz-modello6.txt');
const outputPath = path.join(__dirname, 'modello6-quiz-data.json');
const correctAnswersPath = path.join(__dirname, 'correct-answers-ssfo-modello6.json');

// Carica le risposte corrette note (se esiste il file)
let knownCorrectAnswers = {};
try {
    if (fs.existsSync(correctAnswersPath)) {
        const correctAnswersData = JSON.parse(fs.readFileSync(correctAnswersPath, 'utf8'));
        knownCorrectAnswers = correctAnswersData.correctAnswers || {};
        console.log(`📋 Caricate ${Object.keys(knownCorrectAnswers).length} risposte corrette note`);
    }
} catch (error) {
    console.log('⚠️  Impossibile caricare le risposte corrette note');
}

// Copia la funzione di categorizzazione da extractPdfQuiz.js (stessa logica)
// (Uso la stessa funzione di extractModello5Quizzes.js)
function categorizeQuiz(questionText, answersText) {
    const fullText = (questionText + ' ' + answersText).toLowerCase();
    
    // Definizione delle categorie e relative parole chiave (stesso di extractPdfQuiz.js)
    const categories = {
        'FARMACOLOGIA': [
            'farmaco', 'farmaci', 'meccanismo', 'azione', 'recettori', 'recettore',
            'antagonista', 'agonista', 'blocca', 'bloccante', 'inibisce', 'inibitore',
            'stimola', 'stimolante', 'effetto', 'effetti', 'collaterali', 'avversi',
            'terapia', 'terapeutico', 'trattamento', 'somministrazione', 'dose', 'dosi',
            'farmacodinamica', 'farmacocinetica', 'metabolismo', 'eliminazione',
            'assorbimento', 'distribuzione', 'biodisponibilità', 'emivita',
            'antipertensivo', 'antineoplastico', 'ansiolitico', 'antidepressivo',
            'antibiotico', 'antinfiammatorio', 'analgesico', 'antidolorifico',
            'vasodilatatore', 'diuretico', 'anticoagulante', 'broncodilatatore',
            'adrenergic', 'colinergic', 'dopaminergic', 'serotoninergic',
            'interazioni farmacologiche', 'interazione', 'associazione farmacologica',
            'fans', 'lipossigenasi', 'citocromo p450', 'fosfolipasi a2', 'nfkb',
            'amp ciclico', 'adenilato ciclasi', 'protein chinasi a', 'pka',
            'protein chinasi c', 'azatioprina', 'timidilato sintetasi', 'pirimidine',
            'inosino-monofosfato deidrogenasi', 'calcineurina', 'sirolimus',
            'daclizumab', 'ciclosporina', 'corticosteroidi', 'cortisolo',
            'desametasone', 'prednisone', 'metilprednisolone', 'betametasone',
            'caffeina', 'apnea', 'neonati prematuri', 'beclometasone dipropionato',
            'glucocorticoide', 'mineralcorticoide', 'clembuterolo', 'beta 2-adrenergici',
            'roflumilast', 'fosfodiesterasi', 'omalizumab', 'asma allergica',
            'anticorpo monoclonale', 'ig e', 'esomeprazolo', 'omeprazolo',
            'pompa protonica', 'k+/h+-atpasi', 'ulcera gastrica', 'reflusso gastroesofageo',
            'pantoprazolo', 'betaistina', 'recettori h2', 'recettori h3', 'vertigine',
            'cimetidina', 'insulina', 'finasteride', 'cancro alla prostata',
            'corticosteroidi', 'ritenzione idrica', 'ipertensione', 'ipoglicemia',
            'sulfanilurea', 'tolazamide', 'acetoesamide', 'clorpropamide',
            'glipizide', 'tolbutamide', 'statine', 'epatotossicità', 'calcoli biliari',
            'cotrimossazolo', 'sulfametossazolo', 'trimetoprim', 'tiabendazolo',
            'beta-lattamasi', 'sulbactam', 'acido clavulanico', 'tazobactam',
            'carbapenam', 'fluorochinoloni', 'topoisomerasi', 'gaba', 'vancomicina',
            'glicopeptide', 'angiotensina', 'vasocostrizione', 'ace', 'sartani',
            'nitroglicerina', 'fenilalchilamine', 'calcio antagonisti',
            'hmg-coa reduttasi', 'metildopa', 'alfa-2-adrenergici', 'diazossido',
            'nesiritide', 'renina-aldosterone', 'fludrocortisone', 'noradrenalina',
            'serotonina', 'sert', 'net', 'dat', 'claritromicina', 'eritromicina',
            'trastuzumab', 'gefitinib', 'egfr', 'rash cutaneo'
        ],
        'FARMACEUTICA': [
            'compressa', 'compresse', 'capsula', 'capsule', 'forma farmaceutica',
            'eccipiente', 'eccipienti', 'gastroresistente', 'gastroresistenza',
            'rilascio', 'formulazione', 'preparazione galenica', 'galenico',
            'viscosità', 'tensione superficiale', 'solubilità', 'scioglimento',
            'disgregazione', 'disintegrazione', 'rivestimento', 'coating',
            'granulazione', 'liofilizzazione', 'essicazione', 'polvere',
            'sospensione', 'emulsione', 'soluzione', 'sciroppo', 'gocce',
            'supposta', 'supposte', 'ovuli', 'unguento', 'crema', 'gel',
            'cerotto', 'transdermico', 'parenterale', 'endovenosa',
            'sorbitano', 'span', 'hlb', 'tensioattivi', 'polisorbati', 'tween',
            'emulsioni o/a', 'assorbimento transdermico', 'strato corneo',
            'dotti piliferi', 'coefficiente di ripartizione', 'biossido di titanio',
            'additivo', 'colorante', 'eritrosina', 'e 127', 'diluizioni omeopatiche',
            'dh', 'ch'
        ],
        'CHIMICA_FARMACEUTICA': [
            'struttura', 'molecola', 'molecolare', 'atomo', 'carbonio',
            'isomeria', 'isomero', 'stereoisomeria', 'enantiomero', 'chirale',
            'asimmetrico', 'configurazione', 'conformazione',
            'gruppo funzionale', 'radicale', 'catena', 'anello', 'aromatico',
            'sintesi', 'reazione', 'ossidazione', 'riduzione', 'idrolisi',
            'acido', 'base', 'sale', 'estere', 'ammide', 'chetone', 'aldeide',
            'alcool', 'fenolo', 'ammina', 'carbossil', 'idrossil',
            'solfo', 'azoto', 'ossigeno', 'alogenio', 'cloro', 'fluoro',
            'ph', 'pka', 'ionizzazione', 'tampone', 'equilibrio',
            'log p', 'coefficiente ripartizione', 'lipofila', 'idrofila',
            'amminoacidi', 'ramificato', 'bioisosteri', 'isosteri',
            'nucleo biciclico', 'penem', 'penam', 'cefem', 'carbapenem', 'clavam'
        ],
        'LEGISLAZIONE': [
            'ricetta', 'prescrizione', 'prescrivere', 'registri', 'registro',
            'legge', 'normativa', 'decreto', 'regolamento', 'dlgs', 'dpr',
            'aifa', 'ministero', 'autorizzazione', 'aic', 'prontuario',
            'classe', 'classificazione', 'tabella', 'stupefacenti', 'psicotropi',
            'ricettario', 'validità', 'ripetibile', 'non ripetibile',
            'ssn', 'servizio sanitario', 'ticket', 'mutuabile',
            'etichetta', 'etichettatura', 'foglietto illustrativo', 'bugiardino',
            'dispositivo medico', 'marcatura ce', 'lotto', 'scadenza',
            'farmacovigilanza', 'reazione avversa', 'segnalazione',
            'deontologia', 'codice deontologico', 'farmacista', 'camice',
            'ordine', 'albo', 'professionale', 'titolare', 'direttore',
            'responsabile', 'ispezione', 'vigilanza', 'sanzione'
        ],
        'MICROBIOLOGIA': [
            'batterio', 'batteri', 'batteric', 'microbio', 'microbiologia',
            'gram-positiv', 'gram-negativ', 'gram positiv', 'gram negativ',
            'stafilococco', 'streptococco', 'enterococco', 'pneumococco',
            'escherichia', 'e. coli', 'salmonella', 'pseudomonas',
            'klebsiella', 'proteus', 'mycobacterium', 'micobatter',
            'tubercolosi', 'tbc', 'lebbra', 'hansen',
            'parete cellulare', 'peptidoglicano', 'lipopolisaccaride', 'lps',
            'acidi micolici', 'capsula', 'flagello', 'pilo',
            'antibiotico', 'antibatterico', 'antimicrobico', 'antisettico',
            'disinfettante', 'battericida', 'batteriostatico',
            'resistenza', 'resistente', 'sensibile', 'sensibilità',
            'beta-lattamasi', 'penicillinasi', 'betalattamina', 'beta-lattamin',
            'penicillina', 'cefalosporina', 'chinolone', 'fluorochinolone',
            'tetracicline', 'macrolidi', 'amminoglicosidi', 'sulfamidici',
            'infezione', 'infettivo', 'setticemia', 'endocardite', 'meningite',
            'coltura', 'antibiogramma', 'mic', 'sterilizzazione', 'asettico'
        ],
        'ECONOMIA_FARMACEUTICA': [
            'prezzo', 'prezzi', 'costo', 'tariffa', 'margine', 'sconto',
            'rimborso', 'rimborsabilità', 'compartecipazione', 'ticket',
            'prontuario', 'classe a', 'classe c', 'classe h',
            'ddd', 'defined daily dose', 'dose definita giornaliera',
            'equivalente', 'generico', 'biosimilare', 'farmaco equivalente',
            'asl', 'regione', 'regionale', 'convenzione', 'convenzionato',
            'grossista', 'distribuzione', 'acquisto', 'approvvigionamento',
            'gestione magazzino', 'stock', 'inventario', 'rotazione',
            'farmacoeconomia', 'cost-effectiveness', 'budget', 'spesa',
            'appropriatezza prescrittiva', 'consumo', 'utilizzazione'
        ]
    };
    
    // Calcola il punteggio per ogni categoria
    const scores = {};
    
    for (const [category, keywords] of Object.entries(categories)) {
        let score = 0;
        for (const keyword of keywords) {
            const regex = new RegExp(keyword, 'gi');
            const matches = fullText.match(regex);
            if (matches) {
                score += matches.length;
            }
        }
        scores[category] = score;
    }
    
    // Trova la categoria con il punteggio più alto
    let maxScore = 0;
    let bestCategory = 'ALTRO';
    
    for (const [category, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            bestCategory = category;
        }
    }
    
    if (maxScore < 1) {
        bestCategory = 'ALTRO';
    }
    
    // Calcola la sottocategoria (semplificato per ora)
    let bestSubcategory = null;
    
    return {
        category: bestCategory,
        subcategory: bestSubcategory
    };
}

// Funzione per pulire il testo
function cleanText(text) {
    return text.trim().replace(/\s+/g, ' ');
}

// Estrai le domande dal file di testo
function extractQuestionsFromText() {
    console.log('📄 Estrazione quiz dal file di testo...');
    
    if (!fs.existsSync(textPath)) {
        console.log(`❌ File di testo non trovato: ${textPath}`);
        console.log(`💡 Esegui prima extract_text_from_pdf_ocr_easyocr.py per estrarre il testo dal PDF`);
        return [];
    }
    
    const text = fs.readFileSync(textPath, 'utf8');
    // Rimuovi i separatori di pagina
    const cleanedText = text.replace(/=== PAGINA \d+ ===/g, '');
    const lines = cleanedText.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    
    console.log(`📝 Totale righe estratte: ${lines.length}`);
    
    const questions = [];
    let currentQuestion = null;
    let currentAnswers = [];
    let questionNumber = 0;
    let correctAnswer = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Pattern per domande che iniziano con "Quale", "Indicare", ecc.
        // Migliorato per riconoscere più pattern, simile a modello7
        const isQuestionStart = line.length > 10 && 
            (line.startsWith('Quale') || line.startsWith('Indicare') || line.startsWith('Quali') ||
             line.startsWith('La ') || line.startsWith('Il ') || line.startsWith('L\'') ||
             line.startsWith('Nel ') || line.startsWith('Tra ') || line.startsWith('Le ') ||
             line.startsWith('Gli ') || line.startsWith('I ') || line.startsWith('Principale') ||
             line.startsWith('Roflumilast') || line.startsWith('Omalizumab') ||
             line.startsWith('Indicare la') || line.startsWith('Quale/i') ||
             line.startsWith('Quale dato') || line.startsWith('Due soluzioni') ||
             line.startsWith('Quali delle seguenti') || line.startsWith('Quale dei seguenti tensioattivi') ||
             line.startsWith('processo di diffusione') || line.startsWith('Quale caratteristica') ||
             line.startsWith('Un unguento') || line.startsWith('Secondo la legge di Stokes') ||
             line.startsWith('Cosa si intende') || line.startsWith('Qual è la funzione') ||
             line.startsWith('Cosa non possono') || line.startsWith('Qual è la via') ||
             line.startsWith('una combinazione') || line.startsWith('sotto riportati') ||
             line.startsWith('seguenti non fa parte') || line.startsWith('mucoadesiva') ||
             line.startsWith('preparazione delle forme') ||
             // Domande che iniziano con maiuscola e terminano con ":" o "?"
             (line.match(/^[A-Z][a-z]+/) && (line.includes('?') || line.endsWith(':')) && line.length > 10) ||
             // Domande che iniziano con minuscola e terminano con ":" o "?"
             (line.match(/^[a-z]+/) && (line.includes('?') || line.endsWith(':')) && line.length > 10 && 
              !line.match(/^[a-e]\s*$/i) && !line.match(/^[a-e]\s+/i) && !line.match(/^[a-e]\./i)) ||
             // Domande su più righe: se la riga precedente inizia con pattern noti
             (i > 0 && lines[i-1] && (
                 lines[i-1].startsWith('Quale dato') || lines[i-1].startsWith('sotto riportati') ||
                 lines[i-1].startsWith('seguenti non fa parte') || lines[i-1].startsWith('mucoadesiva') ||
                 lines[i-1].startsWith('Un unguento') || lines[i-1].startsWith('Secondo la legge') ||
                 lines[i-1].startsWith('preparazione delle forme')
             ) && line.length > 5 && !line.match(/^[A-E]\s+/i) && !line.match(/^[A-E]\./i) && 
             !line.match(/^\d+$/)));
        
        if (isQuestionStart && (!currentQuestion || currentAnswers.length >= 1)) {
            // Salva la domanda precedente
            if (currentQuestion && currentAnswers.length >= 1) {
                const categorization = categorizeQuiz(currentQuestion, currentAnswers.join(' '));
                const finalCorrectAnswer = knownCorrectAnswers[questionNumber] || correctAnswer;
                
                questions.push({
                    id: questionNumber || questions.length + 1,
                    question: cleanText(currentQuestion),
                    category: categorization.category,
                    subcategory: categorization.subcategory,
                    answers: currentAnswers.slice(0, 5)
                        .filter(answer => answer.trim().length > 0)
                        .map((answer, idx) => ({
                            letter: String.fromCharCode(65 + idx),
                            text: cleanText(answer)
                        })),
                    correctAnswer: finalCorrectAnswer
                });
            }
            
            // Inizia nuova domanda
            questionNumber = questions.length + 1;
            currentQuestion = line;
            currentAnswers = [];
            correctAnswer = null;
            continue;
        }
        
        // Pattern per risposte: A, B, C, D, E seguito da testo
        const answerMatch = line.match(/^([A-E])\s+(.+)/i);
        if (answerMatch && currentQuestion) {
            const answerText = answerMatch[2].trim();
            if (answerText.length > 0) {
                currentAnswers.push(answerText);
            }
            continue;
        }
        
        // Pattern per risposte che iniziano con "4" invece di "A" (errore OCR)
        const answerWithNumberMatch = line.match(/^([4])\s+(.+)/);
        if (answerWithNumberMatch && currentQuestion && currentAnswers.length === 0) {
            // Probabilmente è la risposta A con OCR errato
            const answerText = answerWithNumberMatch[2].trim();
            if (answerText.length > 0) {
                currentAnswers.push(answerText);
            }
            continue;
        }
        
        // Pattern per risposte: solo lettera A-E su riga separata
        const answerLetterOnlyMatch = line.match(/^([A-E])\s*$/i);
        if (answerLetterOnlyMatch && currentQuestion) {
            // La risposta è sulla riga successiva
            if (i + 1 < lines.length) {
                const nextLine = lines[i + 1];
                // Se la riga successiva non è una lettera o "Risposta", è il testo della risposta
                if (!nextLine.match(/^[A-E]\s*$/i) && !nextLine.match(/^#+\s*Risposta|^#+\s*Riposta|^Risposta|^Riposta/i) &&
                    !nextLine.match(/^===/) && !isQuestionStart) {
                    currentAnswers.push(nextLine.trim());
                    i++; // Salta la riga successiva
                }
            }
            continue;
        }
        
        // Pattern per "# Risposta X" o "## Risposta X" o "Risposta X" (senza #)
        const correctAnswerMatch = line.match(/^#+\s*Risposta\s+([A-E])/i) || 
                                    line.match(/^#+\s*Riposta\s+([A-E])/i) ||
                                    line.match(/^Risposta\s+([A-E])/i) ||
                                    line.match(/^Riposta\s+([A-E])/i);
        if (correctAnswerMatch && currentQuestion) {
            correctAnswer = correctAnswerMatch[1].toUpperCase();
            continue;
        }
        
        // Se abbiamo una domanda ma non ancora risposte, continua ad aggiungere alla domanda
        if (currentQuestion && currentAnswers.length === 0) {
            const isAnswer = line.match(/^[A-E]\s+/i) || line.match(/^[A-E]\./i) || line.match(/^[A-E]\s*$/i) ||
                             line.match(/^[4]\s+/); // OCR error: "4" invece di "A"
            const isCorrectAnswer = line.match(/^#+\s*Risposta|^#+\s*Riposta|^Risposta|^Riposta/i);
            const isNewQuestion = isQuestionStart;
            
            if (!isAnswer && !isCorrectAnswer && !isNewQuestion && line.length > 0) {
                // Se la domanda corrente non termina con ":" o "?" e la riga non inizia con A-E, aggiungila
                if (!currentQuestion.endsWith(':') && !currentQuestion.endsWith('?') && 
                    !line.match(/^[A-E]\s*$/i) && !line.match(/^[A-E]\./i) && !line.match(/^[4]\s+/) &&
                    !line.match(/^===/)) {
                    currentQuestion += ' ' + line;
                } else if (line.length < 100 && !line.match(/^[0-9]/) && !line.match(/^===/) &&
                           !line.match(/^[A-E]\s+/i)) {
                    // Righe medie potrebbero essere continuazione
                    currentQuestion += ' ' + line;
                }
            }
            continue;
        }
        
        // Se abbiamo risposte e la riga non è una nuova domanda o risposta, potrebbe essere continuazione
        if (currentQuestion && currentAnswers.length > 0 && currentAnswers.length < 5) {
            const isAnswer = line.match(/^[A-E]\s+/i) || line.match(/^[A-E]\./i) || line.match(/^[A-E]\s*$/i) ||
                             line.match(/^[4]\s+/); // OCR error: "4" invece di "A"
            const isCorrectAnswer = line.match(/^#+\s*Risposta|^#+\s*Riposta|^Risposta|^Riposta/i);
            const isNewQuestion = isQuestionStart;
            
            if (!isAnswer && !isCorrectAnswer && !isNewQuestion && line.length > 0) {
                // Aggiungi alla risposta precedente
                const lastIndex = currentAnswers.length - 1;
                if (currentAnswers[lastIndex]) {
                    currentAnswers[lastIndex] = currentAnswers[lastIndex] + ' ' + line;
                }
                continue;
            }
        }
    }
    
    // Aggiungi l'ultima domanda
    if (currentQuestion && currentAnswers.length >= 1) {
        const categorization = categorizeQuiz(currentQuestion, currentAnswers.join(' '));
        const finalCorrectAnswer = knownCorrectAnswers[questionNumber] || correctAnswer;
        
        questions.push({
            id: questionNumber,
            question: cleanText(currentQuestion),
            category: categorization.category,
            subcategory: categorization.subcategory,
            answers: currentAnswers.slice(0, 5)
                .filter(answer => answer.trim().length > 0)
                .map((answer, idx) => ({
                    letter: String.fromCharCode(65 + idx),
                    text: cleanText(answer)
                })),
            correctAnswer: finalCorrectAnswer
        });
    }
    
    console.log(`✅ Estratte ${questions.length} domande`);
    return questions;
}

// Funzione principale
async function main() {
    try {
        let quizzes = [];
        
        // Prova prima a estrarre dal PDF
        try {
            console.log('📄 Tentativo di estrazione dal PDF...');
            const dataBuffer = fs.readFileSync(pdfPath);
            const data = await pdf(dataBuffer);
            const text = data.text;
            
            if (text && text.trim().length > 100) {
                console.log('✅ Testo estratto dal PDF');
            } else {
                console.log('⚠️  PDF scansionato, uso file di testo');
                quizzes = extractQuestionsFromText();
            }
        } catch (error) {
            console.log('⚠️  Errore lettura PDF, uso file di testo');
            quizzes = extractQuestionsFromText();
        }
        
        // Se non abbiamo quiz dal PDF, usa il file di testo
        if (quizzes.length === 0) {
            quizzes = extractQuestionsFromText();
        }
        
        // Calcola statistiche
        let missingCorrectAnswers = 0;
        let foundCorrectAnswers = 0;
        
        for (let i = 0; i < quizzes.length; i++) {
            if (!quizzes[i].correctAnswer || !['A', 'B', 'C', 'D', 'E'].includes(quizzes[i].correctAnswer)) {
                missingCorrectAnswers++;
            } else {
                foundCorrectAnswers++;
            }
        }
        
        const output = {
            metadata: {
                sourceFile: 'ssfo-quiz-modello6.pdf',
                extractionDate: new Date().toISOString(),
                totalQuizzes: quizzes.length,
                note: missingCorrectAnswers > 0 ? `${missingCorrectAnswers} domande necessitano verifica manuale delle risposte corrette` : null
            },
            quizzes: quizzes
        };
        
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
        
        console.log(`\n✅ File salvato: ${outputPath}`);
        console.log(`📊 Totale quiz estratti: ${quizzes.length}`);
        console.log(`\n📋 Distribuzione per categoria:`);
        
        const categoryCount = {};
        quizzes.forEach(q => {
            categoryCount[q.category] = (categoryCount[q.category] || 0) + 1;
        });
        
        Object.entries(categoryCount).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
            console.log(`   ${cat}: ${count}`);
        });
        
        if (missingCorrectAnswers > 0) {
            console.log(`\n⚠️  Riepilogo risposte corrette:`);
            console.log(`   ✅ Identificate: ${foundCorrectAnswers}`);
            console.log(`   ⚠️  Da verificare: ${missingCorrectAnswers}`);
            console.log(`\n💡 Per aggiungere le risposte corrette mancanti, modifica il file:`);
            console.log(`   ${correctAnswersPath}`);
        }
        
    } catch (error) {
        console.error('❌ Errore:', error);
        process.exit(1);
    }
}

main();

