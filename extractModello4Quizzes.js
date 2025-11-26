const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

/**
 * Script per estrarre quiz dal PDF ssfo-quiz-modello4.pdf
 * Estrae domande, risposte e risposte corrette, e applica categorizzazione automatica
 */

const pdfPath = path.join(__dirname, 'Ulteriori quiz', 'ssfo-quiz-modello4.pdf');
const textPath = path.join(__dirname, 'Ulteriori quiz', 'ssfo-quiz-modello4.txt');
const outputPath = path.join(__dirname, 'modello4-quiz-data.json');
const correctAnswersPath = path.join(__dirname, 'correct-answers-ssfo-modello4.json');

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
            'corticosteroidi', 'calcineurina', 'ciclossigenasi', 'cromoni', 'antistaminici',
            'istamina', 'asma', 'bronchi', 'lansoprazolo', 'recettori alfa', 'antagonisti h2',
            'infliximab', 'estrogeni', 'tocolitico', 'melatonina', 'sildenafil', 'penicilline',
            'eritromicina', 'macrolidi', 'teicoplanina', 'folato reduttasi', 'glaucoma',
            'beta-bloccanti', 'beta-stimolanti', 'fosfodiesterasi', 'tocilizumab', 'nivolumab',
            'cetuximab', 'gotta', 'indometacina', 'aspirina', 'allopurinolo', 'colchicina',
            'ciclosporina', 'idiosincrasia', 'cisteinil-leucotrieni', 'montelukast', 'zileuton',
            'ace-inibitori', 'bradichinina', 'proteine plasmatiche', 'via rettale',
            'primo passaggio', 'epatico', 'buspirone', 'atropina', 'emetico', 'cortisonici',
            'moclobemide', 'mao', 'insulina', 'glucagone', 'fosfolipasi', 'acetilsalicilico',
            'broncospasmo', 'trombossani', 'prostaglandine', 'istamina', 'cisteinil-leucotrieni',
            'desametasone', 'prednisone', 'metilprednisolone', 'cortisolo', 'cortisone',
            'etanercept', 'rituximab', 'anakinra', 'beta 2 agonisti', 'bradicardia', 'prurito',
            'edemi', 'aritmie', 'fluticasone', 'cromoglicato', 'helicobacter pylori',
            'sucralfato', 'antiacidi', 'cinnarizina', 'inibitori pompa protonica', 'bismunto',
            'ipecacuana', 'procinetico', 'domperidone', 'levosulpiride', 'tegaserod',
            'metoclopramide', 'acido 5-aminosalicilico', 'colite ulcerosa', 'sulfasalazina',
            '6-mercaptopurina', 'finasteride', 'statine', 'simvastatina', 'lovastatina',
            'fluvastatina', 'pravastatina', 'atorvastatina', 'sulfaniluree', 'clorpropamide',
            'colestiramina', 'glucocorticoidi', 'tolazamide', 'acetoesamide', 'gliburide',
            'hmg-coa reduttasi', 'tamoxifene', 'exemestane', 'anastrozolo', 'abiraterone',
            'fulvestrant', 'erlotinib', 'natamicina', 'cheratite', 'betaxololo', 'glicoproteina p',
            'cyp3a1', 'cimetidina', 'fenobarbitale', 'fenitoina', 'rifamicina', 'carbamazepina',
            'tachifilassi', 'fase i', 'studi clinici', 'desmopressina', 'miastenia gravis',
            'edrofonio', 'recettori muscarinici', 'pirenzepina', 'tropicamide', 'diuretico',
            'furosemide', 'mannitolo', 'acetazolamide', 'amiloride', 'spironolattone',
            'tiazidici', 'angiotensina', 'sartani', 'losartan', 'interferone', 'entacapone',
            'comt', 'dopadecarbossilasi', 'dhfr', 'triptofano idrossilasi'
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
            'cerotto', 'transdermico', 'parenterale', 'endovenosa'
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
            'amminoacidi', 'ramificato', 'bioisosteri', 'isosteri'
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
                'angina', 'antianginosa', 'ischemia', 'infarto', 'glaucoma', 'beta-bloccanti', 'alfa2-stimolanti',
                'angiotensina', 'sartani', 'betaxololo', 'diuretico', 'furosemide', 'mannitolo',
                'acetazolamide', 'amiloride', 'spironolattone', 'tiazidici', 'colestiramina'
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
                'natamicina', 'antifungino'
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
                'entacapone', 'comt', 'dopadecarbossilasi', 'triptofano idrossilasi',
                'fenobarbitale', 'fenitoina', 'carbamazepina', 'rifamicina'
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
                'infliximab', 'tocilizumab', 'nivolumab', 'cetuximab', 'ciclosporina',
                'cisteinil-leucotrieni', 'montelukast', 'zileuton', 'ace-inibitori',
                'bradichinina', 'angioedema', 'cortisonici', 'corticosteroidi',
                'calcineurina', 'sirolimus', 'daclizumab', 'tacrolimus', 'fosfolipasi a2',
                'acetilsalicilico', 'broncospasmo', 'trombossani', 'prostaglandine',
                'cortisolo', 'cortisone', 'etanercept', 'rituximab', 'anakinra',
                'beta 2 agonisti', 'fluticasone', 'cromoglicato'
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
                'viscosità', 'tensione superficiale', 'solubilità'
            ],
            'FARMACEUTICA_SEMISOLIDE': [
                'forma farmaceutica semisolida', 'crema', 'unguento', 'pomata', 'gel',
                'pasta', 'cerotto', 'transdermico', 'supposta', 'ovuli', 'pessari'
            ],
            'FARMACEUTICA_ECCIPIENTI': [
                'eccipienti', 'lattosio', 'cellulosa', 'stearato', 'magnesio stearato',
                'silice', 'talco', 'amido', 'gelatina', 'glicerina', 'conservanti',
                'stabilità', 'conservazione', 'scadenza', 'shelf-life', 'liofilizzazione'
            ]
        },
        'CHIMICA_FARMACEUTICA': {
            'CHIMICA_FARMACEUTICA_STRUTTURA': [
                'struttura molecolare', 'molecola', 'atomo', 'carbonio', 'legame chimico',
                'gruppo funzionale', 'radicale', 'catena', 'anello', 'aromatico', 'benzene'
            ],
            'CHIMICA_FARMACEUTICA_ISOMERIA': [
                'isomeria', 'isomero', 'stereoisomeria', 'enantiomero', 'diastereoisomero',
                'chirale', 'asimmetrico', 'centro chirale', 'configurazione', 'conformazione',
                'racemo', 'enantiomero puro', 'bioisosteri', 'isosteri'
            ],
            'CHIMICA_FARMACEUTICA_SINTESI': [
                'sintesi', 'reazione', 'ossidazione', 'riduzione', 'idrolisi', 'esterificazione',
                'amidazione', 'sostituzione', 'addizione', 'eliminazione', 'catalisi'
            ],
            'CHIMICA_FARMACEUTICA_ACIDI_BASI': [
                'acido', 'base', 'sale', 'estere', 'ammide', 'chetone', 'aldeide',
                'alcool', 'fenolo', 'ammina', 'carbossil', 'idrossil', 'ph', 'pka',
                'ionizzazione', 'tampone', 'equilibrio'
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
                'classe a', 'classe c', 'classe h', 'tabella', 'stupefacenti', 'psicotropi'
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
    let correctAnswerIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Pattern per risposte: A), B), C), D), E) o A testo o A. testo
        const answerMatch = line.match(/^([A-E])[\)\.:]\s*(.+)/i);
        if (answerMatch && currentQuestion) {
            const answerText = answerMatch[2].trim();
            if (answerText.length > 0 && !answerText.includes('PAGINA')) {
                // Rimuovi eventuali lettere duplicate all'inizio
                const cleanAnswer = answerText.replace(/^[A-E][\)\.:]\s*/, '').trim();
                if (cleanAnswer.length > 0) {
                    currentAnswers.push(cleanAnswer);
                }
            }
            continue;
        }
        
        // Pattern per risposte che iniziano solo con lettera A-E seguita da spazio
        const answerLetterMatch = line.match(/^([A-E])\s+(.+)/i);
        if (answerLetterMatch && currentQuestion) {
            const answerText = answerLetterMatch[2].trim();
            if (answerText.length > 0 && !answerText.includes('PAGINA') && 
                !answerText.match(/^[A-E][\)\.:]/)) {
                currentAnswers.push(answerText);
            }
            continue;
        }
        
        // Pattern per risposte senza lettera (solo testo) - solo se abbiamo già almeno una risposta
        if (currentQuestion && currentAnswers.length > 0 && currentAnswers.length < 5 &&
            line.length > 5 && line.length < 150 &&
            !line.match(/^[A-E][\)\.:]/) && !line.match(/^[A-E]\s+[a-z]/) &&
            !line.startsWith('#') && !line.includes('PAGINA') && !line.startsWith('===') &&
            !(line.length > 20 && (line.startsWith('Indicare') || line.startsWith('Quale') || 
              line.startsWith('Quali') || line.startsWith('La ') || line.startsWith('Il ') ||
              line.startsWith('Con ') || line.startsWith('Tra ') || line.startsWith('Per ')))) {
            // Potrebbe essere una risposta senza lettera
            currentAnswers.push(line);
            continue;
        }
        
        // Pattern per risposte corrette con "#" o "##" prima della lettera
        const correctAnswerMatch = line.match(/^#+\s*([A-E])[\)\.:]\s*(.+)/i);
        if (correctAnswerMatch && currentQuestion) {
            const answerText = correctAnswerMatch[2].trim();
            if (answerText.length > 0 && !answerText.includes('PAGINA')) {
                currentAnswers.push(answerText);
                const letterIndex = correctAnswerMatch[1].charCodeAt(0) - 65;
                correctAnswerIndex = letterIndex;
            }
            continue;
        }
        
        // Pattern per risposte corrette con "##" seguito da testo (markdown)
        if (line.startsWith('## ') && currentQuestion) {
            const answerText = line.replace(/^##\s*/, '').trim();
            if (answerText.length > 0 && !answerText.includes('PAGINA')) {
                currentAnswers.push(answerText);
                correctAnswerIndex = currentAnswers.length - 1;
            }
            continue;
        }
        
        // Pattern per risposte corrette con "#" seguito da testo
        if (line.startsWith('# ') && currentQuestion && !line.startsWith('# ' + currentQuestion.substring(0, 10))) {
            const answerText = line.replace(/^#\s*/, '').trim();
            if (answerText.length > 0 && !answerText.includes('PAGINA') && 
                !answerText.match(/^[A-E][\)\.:]/)) {
                currentAnswers.push(answerText);
                correctAnswerIndex = currentAnswers.length - 1;
            }
            continue;
        }
        
        // Se abbiamo una domanda e risposte, e troviamo una nuova domanda, salva la precedente
        if (currentQuestion && currentAnswers.length >= 1) {
            // Pattern per nuove domande (iniziano con maiuscola e sono lunghe)
            const isNewQuestion = line.length > 20 && 
                (line.startsWith('Indicare') || line.startsWith('Quale') || line.startsWith('Quali') ||
                 line.startsWith('La ') || line.startsWith('Il ') || line.startsWith('Con ') ||
                 line.startsWith('Tra ') || line.startsWith('Per ') || line.startsWith('I ') ||
                 line.startsWith('Gli ') || line.startsWith('L\'') || line.startsWith('L"') ||
                 (line.match(/^[A-Z][a-z]+/) && !line.match(/^[A-E][\)\.:]/) && 
                  !line.match(/^[A-E]\s+[a-z]/)));
            
            if (isNewQuestion) {
                // Salva la domanda precedente
                const categorization = categorizeQuiz(currentQuestion, currentAnswers.join(' '));
                const finalCorrectAnswer = knownCorrectAnswers[questionNumber] || 
                    (correctAnswerIndex >= 0 ? String.fromCharCode(65 + correctAnswerIndex) : null);
                
                questions.push({
                    id: questionNumber || questions.length + 1,
                    question: cleanText(currentQuestion),
                    category: categorization.category,
                    subcategory: categorization.subcategory,
                    answers: currentAnswers.slice(0, 5)
                        .filter(answer => !answer.includes('PAGINA') && answer.trim().length > 0)
                        .map((answer, idx) => ({
                            letter: String.fromCharCode(65 + idx),
                            text: cleanText(answer)
                        })),
                    correctAnswer: finalCorrectAnswer
                });
                
                // Inizia nuova domanda
                questionNumber = questions.length + 1;
                currentQuestion = line;
                currentAnswers = [];
                correctAnswerIndex = -1;
                continue;
            }
        }
        
        // Pattern per domande che iniziano con testo (senza numero)
        // Es: "Indicare, fra quelli indicati, l'effetto..."
        const isQuestionStart = line.length > 15 && 
            (line.startsWith('Indicare') || line.startsWith('Quale') || line.startsWith('Quali') ||
             line.startsWith('La ') || line.startsWith('Il ') || line.startsWith('Con ') ||
             line.startsWith('Tra ') || line.startsWith('Per ') || line.startsWith('I ') ||
             line.startsWith('Gli ') || line.startsWith('L\'') || line.startsWith('L"') ||
             (line.match(/^[A-Z][a-z]+/) && !line.match(/^[A-E][\)\.:]/) && 
              !line.match(/^[A-E]\s+[a-z]/)));
        
        if (isQuestionStart) {
            // Se abbiamo già una domanda con risposte, salvala
            if (currentQuestion && currentAnswers.length >= 1) {
                const categorization = categorizeQuiz(currentQuestion, currentAnswers.join(' '));
                const finalCorrectAnswer = knownCorrectAnswers[questionNumber] || 
                    (correctAnswerIndex >= 0 ? String.fromCharCode(65 + correctAnswerIndex) : null);
                
                questions.push({
                    id: questionNumber || questions.length + 1,
                    question: cleanText(currentQuestion),
                    category: categorization.category,
                    subcategory: categorization.subcategory,
                    answers: currentAnswers.slice(0, 5)
                        .filter(answer => !answer.includes('PAGINA') && answer.trim().length > 0)
                        .map((answer, idx) => ({
                            letter: String.fromCharCode(65 + idx),
                            text: cleanText(answer)
                        })),
                    correctAnswer: finalCorrectAnswer
                });
            }
            
            if (questionNumber === 0) {
                questionNumber = questions.length + 1;
            }
            currentQuestion = line;
            currentAnswers = [];
            correctAnswerIndex = -1;
            continue;
        }
        
        // Se abbiamo una domanda ma non ancora risposte, continua ad aggiungere alla domanda
        if (currentQuestion && currentAnswers.length === 0) {
            // Se la riga non è una risposta e non è una nuova domanda, aggiungila alla domanda corrente
            const isAnswer = line.match(/^[A-E][\)\.:]/) || line.match(/^[A-E]\s+[a-z]/);
            const isNewQuestion = line.length > 20 && 
                (line.startsWith('Indicare') || line.startsWith('Quale') || line.startsWith('Quali') ||
                 line.startsWith('La ') || line.startsWith('Il ') || line.startsWith('Con ') ||
                 line.startsWith('Tra ') || line.startsWith('Per ') || line.startsWith('I ') ||
                 line.startsWith('Gli ') || line.startsWith('L\'') || line.startsWith('L"'));
            
            if (!isAnswer && !isNewQuestion && line.length > 0) {
                currentQuestion += ' ' + line;
            }
            continue;
        }
        
        // Se abbiamo risposte e la riga non è una nuova domanda o risposta, potrebbe essere continuazione
        if (currentQuestion && currentAnswers.length > 0 && currentAnswers.length < 5 &&
            line.length > 2 && !line.match(/^[A-E][\)\.:]/) && 
            !line.match(/^[A-E]\s+[a-z]/) && !line.startsWith('#') && 
            !line.includes('PAGINA') && !line.startsWith('===') &&
            !(line.length > 20 && (line.startsWith('Indicare') || line.startsWith('Quale') || 
              line.startsWith('Quali') || line.startsWith('La ') || line.startsWith('Il ') ||
              line.startsWith('Con ') || line.startsWith('Tra ') || line.startsWith('Per ')))) {
            // Aggiungi alla risposta precedente
            const lastIndex = currentAnswers.length - 1;
            if (currentAnswers[lastIndex]) {
                currentAnswers[lastIndex] = currentAnswers[lastIndex] + ' ' + line;
            }
            continue;
        }
        
        // Se non abbiamo ancora una domanda e la riga sembra essere una risposta senza lettera, potrebbe essere una risposta
        if (!currentQuestion && line.length > 5 && line.length < 100 &&
            !line.match(/^[A-E][\)\.:]/) && !line.match(/^[A-E]\s+[a-z]/) &&
            !line.startsWith('Indicare') && !line.startsWith('Quale') && !line.startsWith('Quali') &&
            !line.startsWith('La ') && !line.startsWith('Il ') && !line.startsWith('Con ') &&
            !line.startsWith('Tra ') && !line.startsWith('Per ') && !line.includes('PAGINA')) {
            // Potrebbe essere una risposta senza lettera, ma non iniziamo una domanda da qui
            continue;
        }
        
        // Se abbiamo una domanda corrente, cerca risposte
        if (currentQuestion !== null) {
            // Pattern per risposte: A), B), C), D), E) o A. B. C. D. E. o A testo
            const answerMatch = line.match(/^([A-E])[\)\.:]\s*(.+)/i);
            if (answerMatch) {
                const answerText = answerMatch[2].trim();
                if (answerText.length > 0 && !answerText.includes('PAGINA')) {
                    currentAnswers.push(answerText);
                }
                continue;
            }
            
            // Pattern per risposte con checkbox: ☐ o ✓ o ☑ o #
            if (/^[☐✓☑#]\s/.test(line) || /^[☐✓☑#]/.test(line)) {
                const answerText = line.replace(/^[☐✓☑#]\s*/, '').trim();
                if (answerText.length > 0) {
                    currentAnswers.push(answerText);
                    // Se è marcata con ✓, ☑ o #, è la risposta corretta
                    if (/^[✓☑#]/.test(line)) {
                        correctAnswerIndex = currentAnswers.length - 1;
                    }
                }
                continue;
            }
            
            // Pattern per risposte che iniziano con "##" (markdown, indica risposta corretta)
            if (line.startsWith('## ')) {
                const answerText = line.replace(/^##\s*/, '').trim();
                if (answerText.length > 0 && !answerText.includes('PAGINA')) {
                    currentAnswers.push(answerText);
                    correctAnswerIndex = currentAnswers.length - 1;
                }
                continue;
            }
            
            // Pattern per risposte che iniziano con "#" seguito da lettera (indica risposta corretta)
            if (/^#\s*[A-E]/.test(line)) {
                const answerText = line.replace(/^#\s*[A-E][\)\.:]\s*/, '').trim();
                if (answerText.length > 0 && !answerText.includes('PAGINA')) {
                    currentAnswers.push(answerText);
                    const letterMatch = line.match(/^#\s*([A-E])/i);
                    if (letterMatch) {
                        const letterIndex = letterMatch[1].charCodeAt(0) - 65;
                        correctAnswerIndex = letterIndex;
                    }
                }
                continue;
            }
            
            // Se la riga inizia con "---" potrebbe essere un separatore - salva la domanda corrente
            if (line.startsWith('---')) {
                if (currentQuestion && currentAnswers.length >= 1) {
                    const categorization = categorizeQuiz(currentQuestion, currentAnswers.join(' '));
                    const finalCorrectAnswer = knownCorrectAnswers[questionNumber] || 
                        (correctAnswerIndex >= 0 ? String.fromCharCode(65 + correctAnswerIndex) : null);
                    
                    questions.push({
                        id: questionNumber,
                        question: cleanText(currentQuestion),
                        category: categorization.category,
                        subcategory: categorization.subcategory,
                        answers: currentAnswers.slice(0, 5)
                            .filter(answer => !answer.includes('PAGINA') && answer.trim().length > 0)
                            .map((answer, idx) => ({
                                letter: String.fromCharCode(65 + idx),
                                text: cleanText(answer)
                            })),
                        correctAnswer: finalCorrectAnswer
                    });
                    
                    // Reset per la prossima domanda
                    currentQuestion = null;
                    currentAnswers = [];
                    correctAnswerIndex = -1;
                    questionNumber = 0;
                }
                continue;
            }
            
            // Se la riga non è vuota e non è un separatore, potrebbe essere una risposta senza lettera
            if (line.length > 5 && !line.startsWith('---') && !line.startsWith('===') && 
                !line.startsWith('#') && !line.includes('PAGINA') &&
                !/^\d+\./.test(line) && currentAnswers.length < 5) {
                // Potrebbe essere una risposta senza lettera
                currentAnswers.push(line);
            }
        }
    }
    
    // Aggiungi l'ultima domanda
    if (currentQuestion && currentAnswers.length >= 1) {
        const categorization = categorizeQuiz(currentQuestion, currentAnswers.join(' '));
        const finalCorrectAnswer = knownCorrectAnswers[questionNumber] || 
            (correctAnswerIndex >= 0 ? String.fromCharCode(65 + correctAnswerIndex) : null);
        
        questions.push({
            id: questionNumber,
            question: cleanText(currentQuestion),
            category: categorization.category,
            subcategory: categorization.subcategory,
            answers: currentAnswers.slice(0, 5)
                .filter(answer => !answer.includes('PAGINA') && answer.trim().length > 0)
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
        
        // Rimuovi il campo _needsManualVerification dal JSON finale
        const quizzesForOutput = quizzes.map(q => {
            const { _needsManualVerification, ...quizWithoutNote } = q;
            return quizWithoutNote;
        });
        
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
                sourceFile: 'ssfo-quiz-modello4.pdf',
                extractionDate: new Date().toISOString(),
                totalQuizzes: quizzes.length,
                note: missingCorrectAnswers > 0 ? `${missingCorrectAnswers} domande necessitano verifica manuale delle risposte corrette` : null
            },
            quizzes: quizzesForOutput
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

