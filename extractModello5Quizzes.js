const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

/**
 * Script per estrarre quiz dal PDF ssfo-quiz-modello5.pdf
 * Estrae domande, risposte e risposte corrette, e applica categorizzazione automatica
 */

const pdfPath = path.join(__dirname, 'Ulteriori quiz', 'ssfo-quiz-modello5.pdf');
const textPath = path.join(__dirname, 'Ulteriori quiz', 'ssfo-quiz-modello5.txt');
const outputPath = path.join(__dirname, 'modello5-quiz-data.json');
const correctAnswersPath = path.join(__dirname, 'correct-answers-ssfo-modello5.json');

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
            'volume di distribuzione', 'clearance', 'auc', 'tmax', 'cmax',
            'fase i', 'fase ii', 'metabolismo', 'biotrasformazione', 'citocromo',
            'cyp', 'p450', 'ossidazione', 'riduzione', 'idrolisi', 'coniugazione',
            'eliminazione renale', 'eliminazione biliare', 'acidificazione urina',
            'atc', 'classificazione', 'benzodiazepine', 'gaba', 'ansiolitico',
            'ipnotico', 'sedativo', 'miorilassante', 'anticonvulsivante',
            'farmacoforo', 'modulatore allosterico', 'proteine g', 'gtp',
            'pka', 'ionizzazione', 'solubilità', 'sulfamidici', 'ph',
            'furosemide', 'diuretico dell\'ansa', 'antiviral', 'retrovirus',
            'hiv', 'enfuvirtide', 'zidovudina', 'azt', 'sofosbuvir',
            'interferoni', 'integrasi', 'neuraminidasi', 'omeprazolo',
            'esomeprazolo', 'pantoprazolo', 'inibitori pompa protonica',
            'ciprofloxacina', 'carbenicillina', 'ph isoelettrico', 'morfina',
            'ketorolac', '5-fluorouracile', 'efedrina', 'idrolisi',
            'cetirizina', 'desloratadina', 'antazolina', 'antistaminico',
            'vinca', 'alcaloidi antitumorali', 'tubulina', 'dna'
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
            'stabilità', 'degradazione', 'precipitazione', 'reazione chimica',
            'soluzione acquosa', 'contenitore', 'plastica', 'tamponare ph'
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
            'zwitterionico', 'levorotatorio', 'configurazione assoluta',
            'anello aromatico', 'coplanari', 'gruppi elettron-attrattori',
            'ossidrile', 'alchile', 'ciclo triazolico', 'ponte epossidico',
            'rna interferente', 'acido folico', 'solco minore dna',
            'doppia elica dna', 'intercalazione', 'frammentazione dna',
            'basi dna', 'polimerizzazione', 'piperazinico', 'imidazolinico',
            'profarmaco', 'sostituente cloro', 'antagonista', 'antimuscarinica',
            'anestetica locale', 'analgesica oppioide', 'recettori h4'
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
    
    // Definizione delle sottocategorie (stessa logica di extractPdfQuiz.js)
    const subcategories = {
        'FARMACOLOGIA': {
            'FARMACOLOGIA_CARDIOVASCOLARE': [
                'antipertensivo', 'ipertensione', 'ace inibitore', 'enalapril', 'captopril', 'lisinopril',
                'sartano', 'losartan', 'valsartan', 'irbesartan', 'calcio-antagonista', 'amlodipina', 'nifedipina',
                'beta-bloccante', 'propranolol', 'atenolol', 'metoprolol', 'bisoprolol',
                'alfa-bloccante', 'doxazosina', 'prazosina', 'nitrati', 'nitroglicerina', 'isosorbide',
                'digitale', 'digitossina', 'digossina', 'antiaritmico', 'amiodarone', 'flecainide',
                'anticoagulante', 'warfarin', 'eparina', 'dabigatran', 'rivaroxaban', 'apixaban',
                'antiaggregante', 'clopidogrel', 'ticlopidina', 'dipiridamolo',
                'statine', 'atorvastatina', 'simvastatina', 'rosuvastatina', 'pravastatina',
                'colesterolo', 'trigliceridi', 'aterosclerosi', 'cardiaco', 'cuore', 'miocardio',
                'angina', 'antianginosa', 'ischemia', 'infarto', 'furosemide', 'diuretico dell\'ansa'
            ],
            'FARMACOLOGIA_ANTIBIOTICI': [
                'antibiotico', 'antibatterico', 'antimicrobico', 'battericida', 'batteriostatico',
                'penicillina', 'amoxicillina', 'ampicillina', 'benzilpenicillina', 'oxacillina',
                'cefalosporina', 'cefazolina', 'cefalexina', 'ceftriaxone', 'cefotaxima',
                'macrolidi', 'eritromicina', 'azitromicina', 'claritromicina', 'roxitromicina',
                'aminoglicosidi', 'gentamicina', 'amikacina', 'tobramicina', 'streptomicina',
                'chinoloni', 'ciprofloxacina', 'levofloxacina', 'moxifloxacina', 'norfloxacina',
                'tetracicline', 'doxiciclina', 'tetraciclina', 'minociclina',
                'sulfamidici', 'sulfametossazolo', 'trimetoprim', 'cotrimossazolo',
                'vancomicina', 'teicoplanina', 'linezolid', 'daptomicina',
                'metronidazolo', 'clindamicina', 'cloramfenicolo',
                'imipenem', 'meropenem', 'ertapenem', 'colistina',
                'resistenza antibiotica', 'betalattamasi', 'penicillinasi', 'mrsa', 'vrea',
                'carbenicillina'
            ],
            'FARMACOLOGIA_SISTEMA_NERVOSO': [
                'sistema nervoso', 'neurologico', 'neurotrasmettitore',
                'antidepressivo', 'ssri', 'fluoxetina', 'sertralina', 'paroxetina', 'citalopram',
                'ansiolitico', 'benzodiazepine', 'diazepam', 'lorazepam', 'alprazolam',
                'antipsicotico', 'neurolettico', 'aloperidolo', 'risperidone', 'olanzapina',
                'antiepilettico', 'anticonvulsivante', 'fenitoina', 'carbamazepina', 'valproato',
                'antiparkinson', 'levodopa', 'carbidopa', 'dopamina', 'dopaminergico',
                'atropina', 'scopolamina', 'anticolinergico', 'colinergico', 'buspirone',
                'moclobemide', 'mao', '5ht1a', '5ht2b', 'gaba', 'nmda', 'colinesterasi',
                'farmacoforo', 'benzodiazepinica', 'gabaa', 'ipnotico', 'sedativo',
                'miorilassante', 'anticonvulsivante', 'oxazepam', 'ciclo triazolico',
                'modulatore allosterico', 'proteine g', 'gtp'
            ],
            'FARMACOLOGIA_ANTINFIAMMATORI': [
                'antinfiammatorio', 'fans', 'ibuprofene', 'naprossene', 'ketoprofene',
                'diclofenac', 'indometacina', 'piroxicam', 'meloxicam', 'celecoxib',
                'cortisonico', 'corticosteroide', 'prednisone', 'prednisolone', 'idrocortisone',
                'betametasone', 'desametasone', 'metilprednisolone', 'triamcinolone',
                'analgesico', 'antidolorifico', 'paracetamolo', 'acetaminofene',
                'morfina', 'oppioidi', 'fentanyl', 'ossicodone', 'codeina', 'tramadolo',
                'antireumatico', 'metotrexato', 'sulfasalazina', 'leflunomide',
                'gotta', 'allopurinolo', 'colchicina', 'aspirina',
                'ketorolac'
            ]
        },
        'FARMACEUTICA': {
            'FARMACEUTICA_SOLIDE': [
                'forma farmaceutica solida', 'compressa', 'compresse', 'capsula', 'capsule',
                'granulato', 'polvere', 'pastiglie', 'lozenge', 'gastroresistente',
                'rivestimento', 'coating', 'film coating', 'enterico', 'disgregazione'
            ],
            'FARMACEUTICA_LIQUIDE': [
                'forma farmaceutica liquida', 'sciroppo', 'sospensione', 'emulsione',
                'soluzione', 'gocce', 'collirio', 'spray', 'aerosol', 'inalazione',
                'viscosità', 'tensione superficiale', 'solubilità', 'soluzione acquosa',
                'stabilità', 'degradazione', 'precipitazione', 'tamponare ph'
            ],
            'FARMACEUTICA_SEMISOLIDE': [
                'forma farmaceutica semisolida', 'crema', 'unguento', 'pomata', 'gel',
                'pasta', 'cerotto', 'transdermico', 'supposta', 'ovuli', 'pessari'
            ],
            'FARMACEUTICA_ECCIPIENTI': [
                'eccipienti', 'lattosio', 'cellulosa', 'stearato', 'magnesio stearato',
                'silice', 'talco', 'amido', 'gelatina', 'glicerina', 'conservanti',
                'stabilità', 'conservazione', 'scadenza', 'shelf-life', 'liofilizzazione',
                'contenitore', 'plastica', 'reazione chimica'
            ]
        },
        'CHIMICA_FARMACEUTICA': {
            'CHIMICA_FARMACEUTICA_STRUTTURA': [
                'struttura molecolare', 'molecola', 'atomo', 'carbonio', 'legame chimico',
                'gruppo funzionale', 'radicale', 'catena', 'anello', 'aromatico', 'benzene',
                'anello aromatico', 'coplanari', 'gruppi elettron-attrattori', 'ossidrile',
                'alchile', 'ciclo triazolico', 'ponte epossidico', 'farmacoforo',
                'benzodiazepinica', '5-fenil-1,4-benzodiazepina', 'benzodiazepin-2-one'
            ],
            'CHIMICA_FARMACEUTICA_ISOMERIA': [
                'isomeria', 'isomero', 'stereoisomeria', 'enantiomero', 'diastereoisomero',
                'chirale', 'asimmetrico', 'centro chirale', 'configurazione', 'conformazione',
                'racemo', 'enantiomero puro', 'bioisosteri', 'isosteri',
                'zwitterionico', 'levorotatorio', 'configurazione assoluta'
            ],
            'CHIMICA_FARMACEUTICA_SINTESI': [
                'sintesi', 'reazione', 'ossidazione', 'riduzione', 'idrolisi', 'esterificazione',
                'amidazione', 'sostituzione', 'addizione', 'eliminazione', 'catalisi'
            ],
            'CHIMICA_FARMACEUTICA_ACIDI_BASI': [
                'acido', 'base', 'sale', 'estere', 'ammide', 'chetone', 'aldeide',
                'alcool', 'fenolo', 'ammina', 'carbossil', 'idrossil', 'ph', 'pka',
                'ionizzazione', 'tampone', 'equilibrio', 'solubilità', 'sulfamidici',
                'ph isoelettrico', 'acidificazione urina', 'eliminazione', 'basi deboli',
                'acidi deboli', 'elettroliti deboli', 'sostanze neutre', 'sostanze azotate'
            ]
        },
        'LEGISLAZIONE': {
            'LEGISLAZIONE_RICETTE': [
                'ricetta', 'prescrizione', 'prescrivere', 'ricettario', 'validità',
                'ripetibile', 'non ripetibile', 'ricetta bianca', 'ricetta rossa'
            ],
            'LEGISLAZIONE_NORMATIVE': [
                'legge', 'normativa', 'decreto', 'regolamento', 'dlgs', 'dpr',
                'aifa', 'ministero', 'autorizzazione', 'aic', 'prontuario',
                'classe a', 'classe c', 'classe h', 'tabella', 'stupefacenti', 'psicotropi',
                'atc', 'classificazione', 'livelli di classificazione'
            ],
            'LEGISLAZIONE_ETICHETTATURA': [
                'etichetta', 'etichettatura', 'foglietto illustrativo', 'bugiardino',
                'dispositivo medico', 'marcatura ce', 'lotto', 'scadenza',
                'ssn', 'servizio sanitario', 'ticket', 'mutuabile'
            ],
            'LEGISLAZIONE_FARMACOVIGILANZA': [
                'farmacovigilanza', 'reazione avversa', 'segnalazione', 'aifa',
                'deontologia', 'codice deontologico', 'farmacista', 'camice',
                'ordine', 'albo', 'professionale', 'titolare', 'direttore',
                'responsabile', 'ispezione', 'vigilanza', 'sanzione'
            ]
        },
        'MICROBIOLOGIA': {
            'MICROBIOLOGIA_BATTERI': [
                'batterio', 'batteri', 'batteric', 'microbio', 'microbiologia',
                'gram-positiv', 'gram-negativ', 'gram positiv', 'gram negativ',
                'parete cellulare', 'peptidoglicano', 'lipopolisaccaride', 'lps',
                'acidi micolici', 'capsula', 'flagello', 'pilo'
            ],
            'MICROBIOLOGIA_PATOGENI': [
                'stafilococco', 'streptococco', 'enterococco', 'pneumococco',
                'escherichia', 'e. coli', 'salmonella', 'pseudomonas',
                'klebsiella', 'proteus', 'mycobacterium', 'micobatter',
                'tubercolosi', 'tbc', 'lebbra', 'hansen', 'helicobacter pylori'
            ],
            'MICROBIOLOGIA_RESISTENZA': [
                'antibiotico', 'antibatterico', 'antimicrobico', 'antisettico',
                'disinfettante', 'battericida', 'batteriostatico',
                'resistenza', 'resistente', 'sensibile', 'sensibilità',
                'beta-lattamasi', 'penicillinasi', 'betalattamina', 'beta-lattamin'
            ],
            'MICROBIOLOGIA_ANTIBIOTICI': [
                'penicillina', 'cefalosporina', 'chinolone', 'fluorochinolone',
                'tetracicline', 'macrolidi', 'amminoglicosidi', 'sulfamidici',
                'infezione', 'infettivo', 'setticemia', 'endocardite', 'meningite',
                'coltura', 'antibiogramma', 'mic', 'sterilizzazione', 'asettico'
            ],
            'MICROBIOLOGIA_VIRUS': [
                'virus', 'virale', 'antiviral', 'antivirale', 'retrovirus',
                'hiv', 'epatite c', 'replicazione', 'spoliazione', 'adsorbimento',
                'trascrizione inversa', 'assemblaggio', 'maturazione',
                'enfuvirtide', 'fusione', 'gp41', 'gp120', 'cd4', 'triptofano',
                'zidovudina', 'azt', 'sofosbuvir', 'nucleoside', 'nucleotide',
                'nucleoside fosforamidato', 'non-nucleoside', 'peptide',
                'integrasi', 'interferoni', 'neuraminidasi', 'cap-endonucleasi',
                'retrotrascrizione', 'proteasi', 'legami fosfodiesterici',
                'virione', 'maturazione'
            ]
        },
        'ECONOMIA_FARMACEUTICA': {
            'ECONOMIA_FARMACEUTICA_PREZZI': [
                'prezzo', 'prezzi', 'costo', 'tariffa', 'margine', 'sconto',
                'rimborso', 'rimborsabilità', 'compartecipazione', 'ticket'
            ],
            'ECONOMIA_FARMACEUTICA_PRONTUARIO': [
                'prontuario', 'classe a', 'classe c', 'classe h',
                'ddd', 'defined daily dose', 'dose definita giornaliera'
            ],
            'ECONOMIA_FARMACEUTICA_EQUIVALENTI': [
                'equivalente', 'generico', 'biosimilare', 'farmaco equivalente',
                'asl', 'regione', 'regionale', 'convenzione', 'convenzionato'
            ],
            'ECONOMIA_FARMACEUTICA_GESTIONE': [
                'grossista', 'distribuzione', 'acquisto', 'approvvigionamento',
                'gestione magazzino', 'stock', 'inventario', 'rotazione',
                'farmacoeconomia', 'cost-effectiveness', 'budget', 'spesa',
                'appropriatezza prescrittiva', 'consumo', 'utilizzazione'
            ]
        }
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
    
    // Calcola la sottocategoria per la categoria trovata
    let bestSubcategory = null;
    
    if (bestCategory !== 'ALTRO' && subcategories[bestCategory]) {
        const categorySubcategories = subcategories[bestCategory];
        const subcategoryScores = {};
        
        for (const [subcategory, keywords] of Object.entries(categorySubcategories)) {
            let score = 0;
            for (const keyword of keywords) {
                const regex = new RegExp(keyword, 'gi');
                const matches = fullText.match(regex);
                if (matches) {
                    score += matches.length;
                }
            }
            subcategoryScores[subcategory] = score;
        }
        
        let maxSubScore = 0;
        for (const [subcategory, score] of Object.entries(subcategoryScores)) {
            if (score > maxSubScore) {
                maxSubScore = score;
                bestSubcategory = subcategory;
            }
        }
        
        if (maxSubScore < 1) {
            const subcategoryKeys = Object.keys(categorySubcategories);
            bestSubcategory = subcategoryKeys[0] || null;
        }
    }
    
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
        
        // Pattern per domande numerate: "1.41)", "1.42)", "3.3)", ecc. (solo numero, senza testo)
        const questionNumberMatch = line.match(/^(\d+\.\d+)\)\s*$/);
        if (questionNumberMatch) {
            // Salva la domanda precedente
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
            
            // Estrai il numero della domanda (es: "1.41" -> 141, "3.3" -> 33)
            const numParts = questionNumberMatch[1].split('.');
            questionNumber = parseInt(numParts[0]) * 100 + parseInt(numParts[1]);
            currentQuestion = '';
            currentAnswers = [];
            correctAnswer = null;
            continue;
        }
        
        // Pattern per domande numerate con testo: "1.41) Il volume..."
        const questionNumberWithTextMatch = line.match(/^(\d+\.\d+)\)\s+(.+)/);
        if (questionNumberWithTextMatch) {
            // Salva la domanda precedente
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
            
            // Estrai il numero della domanda
            const numParts = questionNumberWithTextMatch[1].split('.');
            questionNumber = parseInt(numParts[0]) * 100 + parseInt(numParts[1]);
            currentQuestion = questionNumberWithTextMatch[2].trim();
            currentAnswers = [];
            correctAnswer = null;
            continue;
        }
        
        // Pattern per "Risposta X" o "Riposta X" (con typo) o "Ripsosta X"
        const correctAnswerMatch = line.match(/^Risposta\s+([A-E])/i) || 
                                    line.match(/^Riposta\s+([A-E])/i) ||
                                    line.match(/^Ripsosta\s+([A-E])/i);
        if (correctAnswerMatch && currentQuestion) {
            correctAnswer = correctAnswerMatch[1].toUpperCase();
            continue;
        }
        
        // Pattern per risposte: solo lettera A, B, C, D, E su riga separata
        const answerLetterOnlyMatch = line.match(/^([A-E])\s*$/i);
        if (answerLetterOnlyMatch && currentQuestion) {
            // La risposta è sulla riga successiva
            if (i + 1 < lines.length) {
                const nextLine = lines[i + 1];
                // Se la riga successiva non è una lettera o "Risposta", è il testo della risposta
                if (!nextLine.match(/^[A-E]\s*$/i) && !nextLine.match(/^Risposta|^Riposta|^Ripsosta/i) &&
                    !nextLine.match(/^\d+\.\d+\)/)) {
                    currentAnswers.push(nextLine.trim());
                    i++; // Salta la riga successiva
                }
            }
            continue;
        }
        
        // Pattern per risposte: A, B, C, D, E seguito da testo sulla stessa riga
        const answerMatch = line.match(/^([A-E])\s+(.+)/i);
        if (answerMatch && currentQuestion) {
            const answerText = answerMatch[2].trim();
            if (answerText.length > 0) {
                currentAnswers.push(answerText);
            }
            continue;
        }
        
        // Se abbiamo una domanda ma non ancora risposte, continua ad aggiungere alla domanda
        if (currentQuestion !== null && currentAnswers.length === 0) {
            const isAnswer = line.match(/^[A-E]\s*$/i) || line.match(/^[A-E]\s+/i);
            const isCorrectAnswer = line.match(/^Risposta|^Riposta|^Ripsosta/i);
            const isNewQuestion = line.match(/^\d+\.\d+\)/);
            
            if (!isAnswer && !isCorrectAnswer && !isNewQuestion && line.length > 0) {
                if (currentQuestion.length > 0) {
                    currentQuestion += ' ' + line;
                } else {
                    currentQuestion = line;
                }
            }
            continue;
        }
        
        // Se abbiamo risposte e la riga non è una nuova domanda o risposta, potrebbe essere continuazione
        if (currentQuestion && currentAnswers.length > 0 && currentAnswers.length < 5) {
            const isAnswer = line.match(/^[A-E]\s*$/i) || line.match(/^[A-E]\s+/i);
            const isCorrectAnswer = line.match(/^Risposta|^Riposta|^Ripsosta/i);
            const isNewQuestion = line.match(/^\d+\.\d+\)/);
            
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
                // Qui potresti processare il testo del PDF se necessario
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
                sourceFile: 'ssfo-quiz-modello5.pdf',
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

