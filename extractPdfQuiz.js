const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

/**
 * Script migliorato per estrarre quiz dal PDF "Banca dati unisa farmacia ospedaliera"
 * 
 * Struttura del PDF:
 * Domanda[testo domanda]
 * [risposta 1 - può essere su più linee]
 * [risposta 2 - può essere su più linee]
 * [risposta 3 - può essere su più linee]
 * [risposta 4 - può essere su più linee]
 * [risposta 5 - può essere su più linee]
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
 * Funzione per categorizzare automaticamente una domanda
 * in base alle parole chiave presenti nel testo
 */
function categorizeQuiz(questionText, answersText) {
    const fullText = (questionText + ' ' + answersText).toLowerCase();
    
    // Definizione delle categorie e relative parole chiave
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
            'interazioni farmacologiche', 'interazione', 'associazione farmacologica'
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
            'stabilità', 'conservazione', 'scadenza', 'shelf-life',
            'lattosio', 'cellulosa', 'stearato', 'magnesio stearato',
            'silice', 'talco', 'amido', 'gelatina', 'glicerina'
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
            'ph', 'pka', 'ionizzazione', 'tampone', 'equilibrio'
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
        'CHIMICA_ANALITICA': [
            'analisi', 'analytic', 'dosaggio', 'titolazione', 'spettroscopia',
            'spettrofotometria', 'cromatografia', 'hplc', 'gc-ms', 'tlc',
            'elettroforesi', 'risonanza magnetica', 'nmr', 'infrarosso', 'ir',
            'massa', 'spettrometria', 'uv', 'visibile', 'fluorescenza',
            'tac', 'tomografia', 'radiazioni', 'raggi x', 'radioattiv',
            'frequenza', 'lunghezza d\'onda', 'energia', 'fotone',
            'concentrazione', 'molarità', 'normalità', 'diluizione',
            'standard', 'calibrazione', 'curva', 'linearità',
            'limiti di rivelabilità', 'sensibilità', 'specificità',
            'validazione', 'metodo analitico', 'controllo qualità'
        ],
        'FARMACOGNOSIA': [
            'pianta', 'piante', 'droga', 'droghe vegetali', 'fitoterapia',
            'estratto', 'estratti', 'tintura madre', 'macerato', 'infuso',
            'decotto', 'oleolito', 'omeopati', 'omeopatico', 'diluizione',
            'dinamizzazione', 'centesimale', 'decimale', 'korsakoviana',
            'alcaloide', 'alcaloidi', 'glucoside', 'glucosidi', 'tannin',
            'flavonoide', 'flavonoidi', 'terpene', 'oli essenziali',
            'resina', 'gomma', 'mucillagine', 'saponina', 'principio attivo naturale',
            'botanica', 'specie', 'genere', 'famiglia', 'nomenclatura',
            'coltivazione', 'raccolta', 'essicazione', 'conservazione',
            'guar', 'ginseng', 'valeriana', 'camomilla', 'echinacea',
            'digitale', 'belladonna', 'segale cornuta', 'oppio', 'china'
        ],
        'COSMETOLOGIA': [
            'cosmetico', 'cosmetici', 'cosmetica', 'dermocosmetico',
            'crema viso', 'crema mani', 'lozione', 'shampoo', 'balsamo',
            'trucco', 'makeup', 'smalto', 'profumo', 'deodorante',
            'solare', 'protezione solare', 'spf', 'filtro solare',
            'idratante', 'emolliente', 'nutriente', 'antiage', 'antirughe',
            'schiarente', 'depigmentante', 'idrochinone', 'acido glicolico',
            'conservante', 'parabeni', 'profumazione', 'colorante',
            'tensioattivo', 'emulsionante', 'addensante', 'umettante',
            'legge 713', '713/86', 'allegato', 'proibito', 'ammesso',
            'concentrazione massima', 'etichettatura cosmetica',
            'pao', 'period after opening', 'nickel tested', 'dermatologicamente',
            'bambini', 'età inferiore', 'tre anni', 'pelle sensibile'
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
            // Conta le occorrenze della parola chiave
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
    let bestCategory = 'ALTRO'; // Categoria di default
    
    for (const [category, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            bestCategory = category;
        }
    }
    
    // Se nessuna categoria ha un punteggio significativo (>= 1), usa 'ALTRO'
    if (maxScore < 1) {
        bestCategory = 'ALTRO';
    }
    
    return bestCategory;
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
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.startsWith('Domanda')) {
            questionStartIndex = i;
        } else if (/^Risposta\s+esatta$/i.test(line)) {
            correctAnswerIndex = i;
            break;
        }
    }
    
    // Verifica che abbiamo trovato tutti gli elementi necessari
    if (questionStartIndex === -1 || correctAnswerIndex === -1) {
        return null;
    }
    
    // Estrai la risposta corretta (la linea dopo "Risposta esatta")
    let correctAnswer = '';
    if (correctAnswerIndex + 1 < lines.length) {
        const nextLine = lines[correctAnswerIndex + 1];
        if (/^[A-E]$/.test(nextLine)) {
            correctAnswer = nextLine;
        }
    }
    
    // Trova le 5 lettere dopo "Risposta esatta" (servono per capire dove finiscono le risposte)
    const letterIndices = [];
    for (let i = correctAnswerIndex + 1; i < Math.min(correctAnswerIndex + 7, lines.length); i++) {
        if (/^[A-E]$/.test(lines[i])) {
            letterIndices.push(i);
        }
    }
    
    // Estrai tutte le linee tra "Domanda" e "Risposta esatta", escludendo le lettere finali
    let allContentLines = lines.slice(questionStartIndex, correctAnswerIndex);
    
    // Rimuovi le lettere singole dalla fine (le 5 lettere A, B, C, D, E)
    while (allContentLines.length > 0 && /^[A-E]$/.test(allContentLines[allContentLines.length - 1])) {
        allContentLines.pop();
    }
    
    if (allContentLines.length < 6) { // Almeno domanda + 5 risposte
        console.warn(`Quiz ${quizNumber}: contenuto insufficiente`);
        return null;
    }
    
    // La prima linea contiene "Domanda" + inizio della domanda
    let questionText = allContentLines[0].replace(/^Domanda/, '').trim();
    let questionEndIndex = 0;
    let firstLineComplete = false;
    
    // Cerca dove finisce la domanda
    // Pattern di fine domanda: "?", "TRANNE", ":", o inizio lista risposte
    for (let i = 0; i < allContentLines.length; i++) {
        const line = allContentLines[i];
        if (i === 0) {
            // Prima linea
            if (line.includes('?')) {
                questionEndIndex = 0;
                // Estrai solo la parte fino al "?"
                const qIndex = line.indexOf('?');
                questionText = line.substring(0, qIndex + 1).replace(/^Domanda/, '').trim();
                firstLineComplete = true;
                break;
            }
            // Controlla se finisce con "TRANNE"
            if (/TRANNE\s*$/i.test(line)) {
                questionEndIndex = 0;
                const tranneMatch = line.match(/(.*?TRANNE)\s*/i);
                if (tranneMatch) {
                    questionText = tranneMatch[1].replace(/^Domanda/, '').trim();
                }
                firstLineComplete = true;
                break;
            }
            // Controlla se finisce con ":"
            if (line.endsWith(':')) {
                questionEndIndex = 0;
                questionText = line.replace(/^Domanda/, '').trim();
                firstLineComplete = true;
                break;
            }
            // Se la prima linea è già abbastanza lunga (>40 caratteri) e sembra completa,
            // potrebbe non avere bisogno di continuare
            if (questionText.length > 40) {
                firstLineComplete = true;
            }
        } else {
            // Linee successive
            if (line.includes('?')) {
                questionText += ' ' + line.substring(0, line.indexOf('?') + 1);
                questionEndIndex = i;
                break;
            }
            // Controlla se contiene "TRANNE"
            if (/TRANNE/i.test(line)) {
                const tranneIndex = line.search(/TRANNE/i);
                questionText += ' ' + line.substring(0, tranneIndex + 6); // +6 per "TRANNE"
                questionEndIndex = i;
                break;
            }
            // Controlla se finisce con ":"
            if (line.endsWith(':')) {
                questionText += ' ' + line;
                questionEndIndex = i;
                break;
            }
            // Euristica per rilevare l'inizio delle risposte senza marcatori espliciti
            if (questionEndIndex === 0) {
                // Se la prima linea sembrava completa e questa linea inizia con minuscola
                // o è molto corta, è probabilmente una risposta
                if (firstLineComplete && (/^[a-z]/.test(line) || line.length < 30)) {
                    questionEndIndex = 0;
                    break;
                }
                
                // Se la linea inizia con minuscola e non è troppo lunga, potrebbe essere continuazione
                if (/^[a-z]/.test(line) && !firstLineComplete) {
                    questionText += ' ' + line;
                }
                // Se abbiamo già una domanda di lunghezza ragionevole (>50 caratteri)
                // e questa linea sembra una risposta (parole lowercase separate)
                else if (questionText.length > 50) {
                    // Pattern tipici di risposte: parole tutte minuscole separate da spazi
                    // Esempio: "enalapril tetraciclina cloridrato ampicillina"
                    const wordsInLine = line.split(/\s+/);
                    const lowercaseWords = wordsInLine.filter(w => /^[a-z]/.test(w)).length;
                    
                    // Se la maggior parte delle parole sono lowercase (non inizio frase)
                    // è probabilmente l'inizio delle risposte
                    if (lowercaseWords >= wordsInLine.length * 0.6 && wordsInLine.length >= 2) {
                        questionEndIndex = i - 1;
                        break;
                    } else {
                        questionText += ' ' + line;
                    }
                } else {
                    // Domanda ancora corta, continua
                    questionText += ' ' + line;
                }
            }
        }
    }
    
    questionText = cleanText(questionText);
    
    // Le risposte sono tutto dopo la domanda
    const answerLines = allContentLines.slice(questionEndIndex + 1);
    
    if (answerLines.length < 5) {
        console.warn(`Quiz ${quizNumber}: linee di risposte insufficienti (${answerLines.length})`);
        return null;
    }
    
    // Strategia migliorata: raggruppa le linee in 5 risposte
    // Assumiamo che ci siano esattamente 5 risposte
    // Dividiamo le linee in modo intelligente
    
    const answers = [];
    const totalLines = answerLines.length;
    
    // Caso semplice: se abbiamo esattamente 5 linee
    if (totalLines === 5) {
        for (let i = 0; i < 5; i++) {
            answers.push({
                letter: String.fromCharCode(65 + i),
                text: cleanText(answerLines[i])
            });
        }
    } 
    // Se abbiamo più di 5 linee, alcune risposte sono su più linee
    else {
        // Strategia: cerca pattern di nuove risposte
        // Una nuova risposta di solito inizia con maiuscola ed è abbastanza lunga
        // oppure è significativamente diversa dalla linea precedente
        
        let currentAnswer = '';
        let answerCount = 0;
        
        for (let i = 0; i < answerLines.length && answerCount < 5; i++) {
            const line = answerLines[i];
            
            // Calcola quante linee mancano e quante risposte mancano
            const linesLeft = answerLines.length - i;
            const answersLeft = 5 - answerCount;
            
            // Determina se questa linea è l'inizio di una nuova risposta
            let shouldStartNew = false;
            
            if (answerCount === 0) {
                // Prima risposta - inizia sempre
                shouldStartNew = true;
            } else if (linesLeft === answersLeft) {
                // Se il numero di linee rimanenti = numero di risposte rimanenti,
                // ogni linea deve essere una risposta
                shouldStartNew = true;
            } else if (currentAnswer.length > 0) {
                // Se la linea corrente è molto corta (< 15 caratteri),
                // è probabilmente una continuazione
                if (line.length < 15) {
                    shouldStartNew = false;
                }
                // Se la linea è più lunga e inizia con maiuscola, potrebbe essere una nuova risposta
                else if (/^[A-Z]/.test(line) && line.length > 20) {
                    shouldStartNew = true;
                }
            }
            
            if (shouldStartNew && currentAnswer.length > 0 && answerCount < 5) {
                answers.push({
                    letter: String.fromCharCode(65 + answerCount),
                    text: cleanText(currentAnswer)
                });
                answerCount++;
                currentAnswer = line;
            } else {
                if (currentAnswer.length === 0) {
                    currentAnswer = line;
                    if (answerCount === 0) answerCount = 1;
                } else {
                    currentAnswer += ' ' + line;
                }
            }
        }
        
        // Aggiungi l'ultima risposta
        if (currentAnswer.length > 0 && answerCount <= 5) {
            answers.push({
                letter: String.fromCharCode(65 + answerCount),
                text: cleanText(currentAnswer)
            });
        }
        
        // Se ancora non abbiamo 5 risposte, dividi le linee in modo uniforme
        if (answers.length < 5) {
            answers.length = 0;
            const linesPerAnswer = Math.floor(totalLines / 5);
            let currentIndex = 0;
            
            for (let i = 0; i < 5; i++) {
                const linesToTake = (i < 4) ? linesPerAnswer : (totalLines - currentIndex);
                const answerText = answerLines.slice(currentIndex, currentIndex + linesToTake).join(' ');
                answers.push({
                    letter: String.fromCharCode(65 + i),
                    text: cleanText(answerText)
                });
                currentIndex += linesToTake;
            }
        }
    }
    
    // Assicurati che le lettere siano corrette
    for (let i = 0; i < answers.length; i++) {
        answers[i].letter = String.fromCharCode(65 + i);
    }
    
    // Validazione
    if (!questionText || questionText.length < 10) {
        console.warn(`Quiz ${quizNumber}: domanda troppo corta o mancante`);
        return null;
    }
    
    if (answers.length !== 5) {
        console.warn(`Quiz ${quizNumber}: trovate ${answers.length} risposte invece di 5`);
        if (answers.length < 2) {
            return null;
        }
    }
    
    if (!correctAnswer) {
        console.warn(`Quiz ${quizNumber}: risposta corretta non trovata`);
    }
    
    // Categorizza il quiz in base al contenuto
    const answersText = answers.map(a => a.text).join(' ');
    const category = categorizeQuiz(questionText, answersText);
    
    return {
        id: quizNumber,
        question: questionText,
        category: category,
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
        
        // Statistiche per categoria
        console.log('\n📂 Distribuzione per categoria:');
        const categoryCount = {};
        quizzes.forEach(quiz => {
            categoryCount[quiz.category] = (categoryCount[quiz.category] || 0) + 1;
        });
        
        // Ordina le categorie per numero di quiz (decrescente)
        const sortedCategories = Object.entries(categoryCount)
            .sort((a, b) => b[1] - a[1]);
        
        sortedCategories.forEach(([category, count]) => {
            const percentage = ((count / quizzes.length) * 100).toFixed(1);
            console.log(`   - ${category}: ${count} quiz (${percentage}%)`);
        });
        
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
        
        // Mostra il quiz 59 come test
        const quiz59 = quizzes.find(q => q.id === 59);
        if (quiz59) {
            console.log('\n📋 Test - Quiz 59 (talco bambini):');
            console.log(`Categoria: ${quiz59.category}`);
            console.log(`Domanda: ${quiz59.question}`);
            console.log(`Risposte (${quiz59.answers.length}):`);
            quiz59.answers.forEach(ans => {
                console.log(`  ${ans.letter}) ${ans.text}`);
            });
            console.log(`Risposta corretta: ${quiz59.correctAnswer}`);
        }
        
        // Mostra i primi 3 quiz come esempio
        console.log('\n📋 Primi 3 quiz:');
        quizzes.slice(0, 3).forEach(quiz => {
            console.log(`\n--- Quiz ${quiz.id} ---`);
            console.log(`Categoria: ${quiz.category}`);
            console.log(`Domanda: ${quiz.question.substring(0, 80)}${quiz.question.length > 80 ? '...' : ''}`);
            console.log(`Risposte (${quiz.answers.length}):`);
            quiz.answers.forEach(ans => {
                console.log(`  ${ans.letter}) ${ans.text.substring(0, 60)}${ans.text.length > 60 ? '...' : ''}`);
            });
            console.log(`Risposta corretta: ${quiz.correctAnswer}`);
        });
        
    } catch (error) {
        console.error('❌ Errore durante l\'estrazione:', error);
        process.exit(1);
    }
}

// Esegui lo script
main();
