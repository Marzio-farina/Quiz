const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

/**
 * Script per estrarre quiz dal PDF ssfo-quiz-modello7.pdf
 * Estrae domande, risposte e risposte corrette, e applica categorizzazione automatica
 */

const pdfPath = path.join(__dirname, 'Ulteriori quiz', 'ssfo-quiz-modello7.pdf');
const textPath = path.join(__dirname, 'Ulteriori quiz', 'ssfo-quiz-modello7.txt');
const outputPath = path.join(__dirname, 'modello7-quiz-data.json');
const correctAnswersPath = path.join(__dirname, 'correct-answers-ssfo-modello7.json');

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

// Copia la funzione di categorizzazione (stessa logica di extractModello6Quizzes.js)
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
            'infliximab', 'anticorpo monoclonale', 'umanizzato', 'chimerico', 'murino',
            'etoricoxib', 'cox-2', 'tocilizumab', 'ilr10', 'ilr2', 'artrite reumatoide',
            'sirolimus', 'calcineurina', 'serina/treonina chinasi', 'tirosina chinasi',
            'ustekinumab', 'psoriasi', 'interleuchina', 'il-12', 'il-21', 'golimumab',
            'spondilite anchilosante', 'metimazolo', 'funzione tiroidea', 'acth',
            'ormone proteico', 'adenoipofisi', 'repaglinide', 'insulina', 'diabete',
            'glinidi', 'acido benzoico', 'somatostatina', 'recettori proteine g',
            'zidovudina', 'antivirale', 'alofantrina', 'chirale', 'enantiomero',
            'antitubercolare', 'isoniazide', 'moxifloxacina', 'pirazinamide', 'rifapentina',
            'claritromicina', 'beta-lattamine', 'transpeptidasi', 'parete batterica',
            'macrolidi', 'peptidoglicano', 'ribosoma', 'amminoglicosidi', 'ototossicità',
            'tamoxifene', 'androgeni', 'estrogeni', 'topotecan', 'bee', 'topoisomerasi',
            'irinotecan', 'saponi', 'tensioattivi', 'hlb', 'somministrazione sottocutanea',
            'lansoprazolo', 'eszopiclone', 'gabaa', 'bifosfonati', 'osteonecrosi',
            'benzodiazepine', 'farmacoforo', 'eliminazione farmaci idrofili',
            'biotrasformazione', 'endotelio capillare', 'antagonisti antidopaminergici',
            'dopaminergico', 'nitroprussiato sodico', 'vasodilatatore', 'vasocostrittore',
            'reazioni ossidative', 'tetraetilammonio', 'isoflurano', 'anestetico',
            'coefficiente maneggevolezza', 'dobutamina', 'miocardio', 'amiodarone',
            'antiaritmico', 'recettori alfa1', 'anticoagulanti cumarinici', 'vitamina k',
            'iperlipidemia', 'colestiramina', 'colesevelam', 'ezetimibe', 'rosuvastatina',
            'cromoglicato sodio', 'mastociti', 'ipertensione gravidanza', 'ace-inibitori',
            'sartani', 'antagonisti aldosterone', 'eclampsia', 'bronchi', 'asma',
            'adrenalina', 'terbutalina', 'nedocromile', 'salbutamolo', 'teofillina'
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
            'saponi', 'tensioattivi', 'hlb', 'saponi molli', 'saponi anionici',
            'molecole anfipatiche', 'miscela tensioattivi', 'via somministrazione',
            'somministrazione sottocutanea', 'somministrazione intramuscolare',
            'somministrazione endovenosa', 'somministrazione orale'
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
            'alofantrina', 'atomo c chirale', 'gruppo amminico', 'gruppo carbossilico',
            'benzodiazepine', 'farmacoforo', '5-fenil-1,4-benzodiazepina',
            'benzodiazepin-2-one', 'enzopiclone', 'enantiomero s', 'enantiomero r'
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
            'coltura', 'antibiogramma', 'mic', 'sterilizzazione', 'asettico',
            'antitubercolare', 'isoniazide', 'moxifloxacina', 'pirazinamide',
            'rifapentina', 'beta-lattamine', 'transpeptidasi', 'idrolasi batteriche',
            'macrolidi glucosidici', 'ribosoma batterico', 'subunità 50s',
            'amminoglicosidi', 'subunità 70s', 'membrana plasmatica batterio'
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
    
    return {
        category: bestCategory,
        subcategory: null
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
        
        // Pattern per domande che iniziano con "Quale", "Indicare", "L'", "La ", "Il ", ecc.
        // O domande che terminano con ":" o "?" e hanno almeno 10 caratteri
        // O domande che iniziano con minuscola ma terminano con ":" o "?" (es. "glinidi sono:", "recettori della somatostatina sono:")
        // O domande che iniziano con "Qualeli" (typo di "Quale/i")
        const isQuestionStart = line.length > 5 && 
            (line.startsWith('Quale') || line.startsWith('Indicare') || line.startsWith('Quali') ||
             line.startsWith('Qualeli') || line.startsWith('La ') || line.startsWith('Il ') || line.startsWith('L\'') ||
             line.startsWith('Nel ') || line.startsWith('Tra ') || line.startsWith('Le ') ||
             line.startsWith('Gli ') || line.startsWith('I ') || line.startsWith('Principale') ||
             line.startsWith('Si ') || line.startsWith('Ustekinumab') || line.startsWith('Golimumab') ||
             line.startsWith('L\'ACTH') || line.startsWith('LACTH') || line.startsWith('L\'alofantrina') ||
             line.startsWith('Cosa') || line.startsWith('Che') || line.startsWith('Quando') ||
             line.startsWith('Infliximab') || line.startsWith('Tocilizumab') || line.startsWith('Sirolimus') ||
             line.startsWith('Golimumab') || line.startsWith('glinidi') || line.startsWith('recettori') ||
             line.startsWith('profarmaci') || line.startsWith('Un DPI') || line.startsWith('Una micella') ||
             line.startsWith('Con il termine') || line.startsWith('La vaselina') || line.startsWith('Il rivestimento') ||
             line.startsWith('Qual è') || line.startsWith('Che cosa') || line.startsWith('In relazione') ||
             line.startsWith('seguenti composti') || line.startsWith('macrolidi') || line.startsWith('tamoxifene') ||
             line.startsWith('topotecan') || line.startsWith('processo di liofilizzazione') ||
             line.startsWith('dipende da') || line.startsWith('usato nel trattamento') ||
             line.startsWith('glicosidi cardioattivi') || line.startsWith('tranne') ||
             line.startsWith('principali effetti avversi') || line.startsWith('passaggio dei farmaci') ||
             line.startsWith('cromoglicato di sodio') || line.startsWith('farmaci che possono dilatare') ||
             line.startsWith('agisce') || line.startsWith('propanololo') ||
             line.startsWith('II ') || line.startsWith('II\n') || line.startsWith('L\'irinotecan') ||
             line.startsWith('Amiodarone') || line.startsWith('L\'isoflurano') ||
             line.startsWith('Qualeli') || line.startsWith('Quale dei parametri') ||
             line.startsWith('Con il termine') || line.startsWith('Il rivestimento') ||
             line.startsWith('Cosa sono') || line.startsWith('Quale delle seguenti affermazioni è errata') ||
             line.startsWith('propanololo non') || line.startsWith('In una miscela') ||
             // Domande che terminano con ":" e iniziano con minuscola (es. "tamoxifene:", "topotecan:")
             (line.match(/^[a-z]+.*:$/) && line.length > 5 && !line.match(/^[a-e]\s*$/i)) ||
             // Domande che iniziano con maiuscola e terminano con ":" o "?"
             (line.match(/^[A-Z][a-z]+/) && (line.includes('?') || line.endsWith(':')) && line.length > 10) ||
             // Domande che iniziano con minuscola e terminano con ":" o "?"
             (line.match(/^[a-z]+/) && (line.includes('?') || line.endsWith(':')) && line.length > 10 && 
              !line.match(/^[a-e]\s*$/i) && !line.match(/^[a-e]\s+/i) && !line.match(/^[a-e]\./i)) ||
             // Domande su più righe: riga che termina con ":" o "?" dopo una riga che potrebbe essere parte della domanda
             (i > 0 && (line.endsWith(':') || line.endsWith('?')) && line.length > 10 &&
              !line.match(/^[A-E]\s+/i) && !line.match(/^[A-E]\./i) && 
              lines[i-1] && lines[i-1].length > 5 && !lines[i-1].match(/^[A-E]\s+/i) &&
              !lines[i-1].match(/Risposta/i) && !lines[i-1].match(/^===/)) ||
             // Domande su più righe: se la riga precedente inizia con "Qualeli", "Quale dei parametri", "Con il termine", "Il rivestimento", "Cosa sono", "Quale delle seguenti affermazioni è errata", "propanololo non", "In una miscela"
             (i > 0 && lines[i-1] && (
                 lines[i-1].startsWith('Qualeli') || lines[i-1].startsWith('Quale dei parametri') ||
                 lines[i-1].startsWith('Con il termine') || lines[i-1].startsWith('Il rivestimento') ||
                 lines[i-1].startsWith('Cosa sono') || lines[i-1].startsWith('Quale delle seguenti affermazioni è errata') ||
                 lines[i-1].startsWith('propanololo non') || lines[i-1].startsWith('In una miscela') ||
                 lines[i-1].startsWith('Quale tra') || lines[i-1].startsWith('Che cosa sono')
             ) && line.length > 5 && !line.match(/^[A-E]\s+/i) && !line.match(/^[A-E]\./i) && 
             !line.match(/^\d+$/))); // Non è un numero solo
        
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
        // O solo lettera A-E su riga separata (la risposta sarà sulla riga successiva)
        const answerMatch = line.match(/^([A-E])\s+(.+)/i);
        if (answerMatch && currentQuestion) {
            const answerText = answerMatch[2].trim();
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
        
        // Pattern per risposte che iniziano con "1" o "0" (errori OCR) invece di "A"
        // Se la riga inizia con "1" o "0" seguito da testo e abbiamo una domanda, potrebbe essere una risposta A
        const answerWithNumberMatch = line.match(/^([10])\s+(.+)/);
        if (answerWithNumberMatch && currentQuestion && currentAnswers.length === 0) {
            // Probabilmente è la risposta A con OCR errato
            const answerText = answerWithNumberMatch[2].trim();
            if (answerText.length > 0) {
                currentAnswers.push(answerText);
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
                             line.match(/^[10]\s+/); // OCR error: "1" o "0" invece di "A"
            const isCorrectAnswer = line.match(/^#+\s*Risposta|^#+\s*Riposta|^Risposta|^Riposta/i);
            const isNewQuestion = isQuestionStart;
            
            // Se la riga precedente non termina con ":" o "?" e la riga corrente inizia con minuscola,
            // potrebbe essere continuazione della domanda
            if (!isAnswer && !isCorrectAnswer && !isNewQuestion && line.length > 0) {
                // Se la domanda corrente non termina con ":" o "?" e la riga non inizia con A-E, aggiungila
                if (!currentQuestion.endsWith(':') && !currentQuestion.endsWith('?') && 
                    !line.match(/^[A-E]\s*$/i) && !line.match(/^[A-E]\./i) && !line.match(/^[10]\s+/) &&
                    !line.match(/^===/)) {
                    currentQuestion += ' ' + line;
                } else if (line.length < 150 && !line.match(/^[0-9]/) && !line.match(/^===/) &&
                           !line.match(/^[A-E]\s+/i) && !line.match(/^\d+$/)) {
                    // Righe medie potrebbero essere continuazione (ma non numeri, separatori o risposte)
                    // Specialmente se la domanda precedente non è completa o contiene "Quale", "B ha valore", ecc.
                    // Se la riga contiene "Quale", "HLB", "valore", "?", ":" o inizia con minuscola, è continuazione
                    if (currentQuestion.length < 150 || line.match(/^[a-z]/) || 
                        line.includes('Quale') || line.includes('HLB') || line.includes('valore') ||
                        line.includes('?') || line.includes(':')) {
                        currentQuestion += ' ' + line;
                    }
                }
            }
            continue;
        }
        
        // Se abbiamo risposte e la riga non è una nuova domanda o risposta, potrebbe essere continuazione
        if (currentQuestion && currentAnswers.length > 0 && currentAnswers.length < 5) {
            const isAnswer = line.match(/^[A-E]\s+/i) || line.match(/^[A-E]\./i) || line.match(/^[A-E]\s*$/i) ||
                             line.match(/^[10]\s+/); // OCR error: "1" o "0" invece di "A"
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
                sourceFile: 'ssfo-quiz-modello7.pdf',
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

