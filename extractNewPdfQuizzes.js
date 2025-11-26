const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

/**
 * Script per estrarre quiz dal PDF aggiuntivo ssfo-quiz-modello2.pdf
 * Estrae domande, risposte e risposte corrette, e applica categorizzazione automatica
 */

const pdfPath = path.join(__dirname, 'Ulteriori quiz', 'ssfo-quiz-modello2.pdf');
const outputPath = path.join(__dirname, 'new-quiz-data.json');
const correctAnswersPath = path.join(__dirname, 'correct-answers-ssfo-modello2.json');

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

// Copia la funzione di categorizzazione da extractPdfQuiz.js
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
            'beta-bloccanti', 'beta-stimolanti', 'fosfodiesterasi'
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
            'silice', 'talco', 'amido', 'gelatina', 'glicerina',
            'biodisponibilità', 'gliceridi semisintetici', 'compresse orodispersibili',
            'rilascio controllato', 'dissoluzione', 'sospensione flocculata',
            'cerotto transdermico', 'scorrevolezza', 'leganti', 'flocculanti',
            'biofarmaceutici', 'indice hausner', 'processo granulazione',
            'preparazioni liquide', 'conservanti', 'colliri', 'parametri processo',
            'compresse', 'classificazione hlb', 'tensioattivi', 'sterilizzazione filtrazione'
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
            'amminoacidi', 'ramificato', 'malonato dietilico', 'idrogeni acidi',
            'distomero', 'enantiomero', 'isomero geometrico', 'isomero conformazionale'
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
            'responsabile', 'ispezione', 'vigilanza', 'sanzione',
            'codice lotto dispositivo medico', 'f.u.i.', 'allegato iii-bis',
            'veleno', 'sostanza infiammabile', 'tariffa nazionale', 'supplementi',
            'registro entrata uscita', 'mangimi medicati', 'emoderivati', 'radiofarmaci',
            'ricette contenenti veleni', 'ricettario rmr', 'medici specialisti',
            'registro carico scarico', 'stupefacenti psicotrope', 'unità operative farmaceutiche',
            'prezzo acquisto', 'allegato a', 'preparati magistrali', 'iva'
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
            'appropriatezza prescrittiva', 'consumo', 'utilizzazione',
            'medicinale biosimilare', 'unione europea', 'immissione commercio'
        ]
    };
    
    // Definizione delle sottocategorie
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
                'angina', 'antianginosa', 'ischemia', 'infarto', 'glaucoma', 'beta-bloccanti', 'beta-stimolanti'
            ],
            'FARMACOLOGIA_ANTIBIOTICI': [
                'antibiotico', 'antibatterico', 'antimicrobico', 'battericida', 'batteriostatico',
                'penicillina', 'amoxicillina', 'ampicillina', 'benzilpenicillina', 'oxacillina',
                'cloxacillina', 'piperacillina', 'ticarcillina', 'pivampicillina',
                'cefalosporina', 'cefazolina', 'cefalexina', 'ceftriaxone', 'cefotaxima',
                'ceftazidima', 'cefepime', 'cefuroxima',
                'macrolidi', 'eritromicina', 'azitromicina', 'claritromicina', 'roxitromicina',
                'aminoglicosidi', 'gentamicina', 'amikacina', 'tobramicina', 'streptomicina',
                'chinoloni', 'ciprofloxacina', 'levofloxacina', 'moxifloxacina', 'norfloxacina',
                'tetracicline', 'doxiciclina', 'tetraciclina', 'minociclina',
                'sulfamidici', 'sulfametossazolo', 'trimetoprim', 'cotrimossazolo',
                'vancomicina', 'teicoplanina', 'linezolid', 'daptomicina',
                'metronidazolo', 'clindamicina', 'cloramfenicolo',
                'imipenem', 'meropenem', 'ertapenem', 'colistina',
                'resistenza antibiotica', 'betalattamasi', 'penicillinasi', 'mrsa', 'vrea',
                'antibiogramma', 'mic', 'sensibile', 'resistente', 'pseudomonas'
            ],
            'FARMACOLOGIA_SISTEMA_NERVOSO': [
                'sistema nervoso', 'neurologico', 'neurotrasmettitore',
                'antidepressivo', 'ssri', 'fluoxetina', 'sertralina', 'paroxetina', 'citalopram',
                'escitalopram', 'fluvoxamina', 'snri', 'venlafaxina', 'duloxetina',
                'triciclici', 'imipramina', 'amitriptilina', 'clomipramina', 'nortriptilina',
                'ansiolitico', 'benzodiazepine', 'diazepam', 'lorazepam', 'alprazolam',
                'clonazepam', 'oxazepam', 'temazepam', 'triazolam',
                'antipsicotico', 'neurolettico', 'aloperidolo', 'risperidone', 'olanzapina',
                'quetiapina', 'clozapina', 'aripiprazolo', 'ziprasidone', 'schizofrenia',
                'antiepilettico', 'anticonvulsivante', 'fenitoina', 'carbamazepina', 'valproato',
                'valproico', 'gabapentin', 'pregabalin', 'lamotrigina', 'topiramato',
                'levetiracetam', 'fenobarbital', 'barbiturico',
                'antiparkinson', 'levodopa', 'carbidopa', 'dopamina', 'dopaminergico',
                'bromocriptina', 'ropinirolo', 'pramipexolo', 'selegilina', 'entacapone',
                'atropina', 'scopolamina', 'anticolinergico', 'colinergico',
                'melatonina', 'ipofisi', 'sonno', 'fosfodiesterasi', 'sildenafil'
            ],
            'FARMACOLOGIA_ANTINFIAMMATORI': [
                'antinfiammatorio', 'fans', 'ibuprofene', 'naprossene', 'ketoprofene',
                'diclofenac', 'indometacina', 'piroxicam', 'meloxicam', 'celecoxib',
                'cortisonico', 'corticosteroide', 'prednisone', 'prednisolone', 'idrocortisone',
                'betametasone', 'desametasone', 'metilprednisolone', 'triamcinolone', 'fludrocortisone',
                'analgesico', 'antidolorifico', 'paracetamolo', 'acetaminofene',
                'morfina', 'oppioidi', 'fentanyl', 'ossicodone', 'codeina', 'tramadolo',
                'buprenorfina', 'naltrexone', 'naloxone',
                'antireumatico', 'metotrexato', 'sulfasalazina', 'leflunomide',
                'antimalarico', 'clorochina', 'idrossiclorochina', 'meflochina',
                'antivirale', 'aciclovir', 'valaciclovir', 'ganciclovir', 'oseltamivir',
                'zanamivir', 'ribavirina', 'interferone',
                'antifungino', 'fluconazolo', 'itraconazolo', 'voriconazolo', 'amfotericina',
                'caspofungina', 'micafungina',
                'antiparassitario', 'antielmintico', 'mebendazolo', 'albendazolo',
                'antineoplastico', 'chemioterapico', 'topotecan', 'ciclofosfamide',
                'cisplatino', 'carboplatino', 'doxorubicina', 'paclitaxel', 'docetaxel',
                'biotrasformazione', 'metabolismo', 'eliminazione', 'escrezione',
                'teratogeno', 'teratogeni', 'malformazioni fetali',
                'ciclossigenasi', 'aspirina', 'cromoni', 'antistaminici', 'istamina',
                'asma', 'bronchi', 'lansoprazolo', 'recettori alfa', 'antagonisti h2',
                'infliximab', 'estrogeni', 'tocolitico', 'calcineurina', 'tacrolimus'
            ]
        },
        'FARMACEUTICA': {
            'FARMACEUTICA_SOLIDE': [
                'forma farmaceutica solida', 'compressa', 'compresse', 'capsula', 'capsule',
                'granulato', 'polvere', 'pastiglie', 'lozenge', 'gastroresistente',
                'rivestimento', 'coating', 'film coating', 'enterico', 'disgregazione',
                'compresse orodispersibili', 'scorrevolezza', 'leganti', 'granulazione'
            ],
            'FARMACEUTICA_LIQUIDE': [
                'forma farmaceutica liquida', 'sciroppo', 'sospensione', 'emulsione',
                'soluzione', 'gocce', 'collirio', 'spray', 'aerosol', 'inalazione',
                'viscosità', 'tensione superficiale', 'solubilità',
                'preparazioni liquide', 'conservanti', 'colliri'
            ],
            'FARMACEUTICA_SEMISOLIDE': [
                'forma farmaceutica semisolida', 'crema', 'unguento', 'pomata', 'gel',
                'pasta', 'cerotto', 'transdermico', 'supposta', 'ovuli', 'pessari',
                'cerotto transdermico', 'gliceridi semisintetici'
            ],
            'FARMACEUTICA_ECCIPIENTI': [
                'eccipienti', 'lattosio', 'cellulosa', 'stearato', 'magnesio stearato',
                'silice', 'talco', 'amido', 'gelatina', 'glicerina', 'conservanti',
                'stabilità', 'conservazione', 'scadenza', 'shelf-life', 'liofilizzazione',
                'flocculanti', 'biofarmaceutici', 'indice hausner', 'parametri processo'
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
                'racemo', 'enantiomero puro', 'distomero', 'isomero geometrico', 'isomero conformazionale'
            ],
            'CHIMICA_FARMACEUTICA_SINTESI': [
                'sintesi', 'reazione', 'ossidazione', 'riduzione', 'idrolisi', 'esterificazione',
                'amidazione', 'sostituzione', 'addizione', 'eliminazione', 'catalisi'
            ],
            'CHIMICA_FARMACEUTICA_ACIDI_BASI': [
                'acido', 'base', 'sale', 'estere', 'ammide', 'chetone', 'aldeide',
                'alcool', 'fenolo', 'ammina', 'carbossil', 'idrossil', 'ph', 'pka',
                'ionizzazione', 'tampone', 'equilibrio',
                'log p', 'coefficiente ripartizione', 'lipofila', 'idrofila',
                'amminoacidi', 'ramificato', 'malonato dietilico', 'idrogeni acidi'
            ]
        },
        'LEGISLAZIONE': {
            'LEGISLAZIONE_RICETTE': [
                'ricetta', 'prescrizione', 'prescrivere', 'ricettario', 'validità',
                'ripetibile', 'non ripetibile', 'ricetta bianca', 'ricetta rossa',
                'ricetta limitativa', 'ricetta speciale', 'ricettario rmr', 'medici specialisti'
            ],
            'LEGISLAZIONE_NORMATIVE': [
                'legge', 'normativa', 'decreto', 'regolamento', 'dlgs', 'dpr',
                'aifa', 'ministero', 'autorizzazione', 'aic', 'prontuario',
                'classe a', 'classe c', 'classe h', 'tabella', 'stupefacenti', 'psicotropi',
                'allegato iii-bis', 'f.u.i.', 'preparati magistrali', 'iva',
                'medicinale biosimilare', 'unione europea', 'immissione commercio'
            ],
            'LEGISLAZIONE_ETICHETTATURA': [
                'etichetta', 'etichettatura', 'foglietto illustrativo', 'bugiardino',
                'dispositivo medico', 'marcatura ce', 'lotto', 'scadenza',
                'ssn', 'servizio sanitario', 'ticket', 'mutuabile',
                'codice lotto dispositivo medico'
            ],
            'LEGISLAZIONE_FARMACOVIGILANZA': [
                'farmacovigilanza', 'reazione avversa', 'segnalazione', 'aifa',
                'deontologia', 'codice deontologico', 'farmacista', 'camice',
                'ordine', 'albo', 'professionale', 'titolare', 'direttore',
                'responsabile', 'ispezione', 'vigilanza', 'sanzione',
                'veleno', 'sostanza infiammabile', 'tariffa nazionale', 'supplementi',
                'registro entrata uscita', 'mangimi medicati', 'emoderivati', 'radiofarmaci',
                'ricette contenenti veleni', 'registro carico scarico', 'stupefacenti psicotrope',
                'unità operative farmaceutiche', 'prezzo acquisto', 'allegato a'
            ]
        },
        'CHIMICA_ANALITICA': {
            'CHIMICA_ANALITICA_SPETTROSCOPIA': [
                'spettroscopia', 'spettrofotometria', 'uv', 'visibile', 'infrarosso', 'ir',
                'nmr', 'risonanza magnetica', 'massa', 'spettrometria', 'fluorescenza'
            ],
            'CHIMICA_ANALITICA_CROMATOGRAFIA': [
                'cromatografia', 'hplc', 'gc-ms', 'tlc', 'gascromatografia',
                'cromatografia liquida', 'fase mobile', 'fase stazionaria'
            ],
            'CHIMICA_ANALITICA_ANALISI': [
                'analisi', 'dosaggio', 'titolazione', 'elettroforesi',
                'concentrazione', 'molarità', 'normalità', 'diluizione'
            ],
            'CHIMICA_ANALITICA_VALIDAZIONE': [
                'standard', 'calibrazione', 'curva', 'linearità',
                'limiti di rivelabilità', 'sensibilità', 'specificità',
                'validazione', 'metodo analitico', 'controllo qualità',
                'tac', 'tomografia', 'radiazioni', 'raggi x', 'radioattiv'
            ]
        },
        'FARMACOGNOSIA': {
            'FARMACOGNOSIA_BOTANICA': [
                'pianta', 'piante', 'droga', 'droghe vegetali', 'botanica',
                'specie', 'genere', 'famiglia', 'nomenclatura', 'coltivazione',
                'raccolta', 'essicazione', 'conservazione'
            ],
            'FARMACOGNOSIA_ESTRATTI': [
                'estratto', 'estratti', 'tintura madre', 'macerato', 'infuso',
                'decotto', 'oleolito', 'fitoterapia', 'principio attivo naturale'
            ],
            'FARMACOGNOSIA_PRINCIPI_ATTIVI': [
                'alcaloide', 'alcaloidi', 'glucoside', 'glucosidi', 'tannin',
                'flavonoide', 'flavonoidi', 'terpene', 'oli essenziali',
                'resina', 'gomma', 'mucillagine', 'saponina'
            ],
            'FARMACOGNOSIA_OMEOPATIA': [
                'omeopati', 'omeopatico', 'diluizione', 'dinamizzazione',
                'centesimale', 'decimale', 'korsakoviana',
                'guar', 'ginseng', 'valeriana', 'camomilla', 'echinacea',
                'digitale', 'belladonna', 'segale cornuta', 'oppio', 'china'
            ]
        },
        'COSMETOLOGIA': {
            'COSMETOLOGIA_PRODOTTI': [
                'cosmetico', 'cosmetici', 'cosmetica', 'dermocosmetico',
                'crema viso', 'crema mani', 'lozione', 'shampoo', 'balsamo',
                'trucco', 'makeup', 'smalto', 'profumo', 'deodorante'
            ],
            'COSMETOLOGIA_PROTEZIONE_SOLARE': [
                'solare', 'protezione solare', 'spf', 'filtro solare',
                'idratante', 'emolliente', 'nutriente', 'antiage', 'antirughe',
                'schiarente', 'depigmentante', 'idrochinone', 'acido glicolico'
            ],
            'COSMETOLOGIA_INGREDIENTI': [
                'conservante', 'parabeni', 'profumazione', 'colorante',
                'tensioattivo', 'emulsionante', 'addensante', 'umettante'
            ],
            'COSMETOLOGIA_LEGISLAZIONE': [
                'legge 713', '713/86', 'allegato', 'proibito', 'ammesso',
                'concentrazione massima', 'etichettatura cosmetica',
                'pao', 'period after opening', 'nickel tested', 'dermatologicamente',
                'bambini', 'età inferiore', 'tre anni', 'pelle sensibile'
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
                'tubercolosi', 'tbc', 'lebbra', 'hansen'
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
                'asl', 'regione', 'regionale', 'convenzione', 'convenzionato',
                'medicinale biosimilare', 'unione europea', 'immissione commercio'
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
    
    // Calcola la sottocategoria
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

// Estrai le domande dal PDF
async function extractQuizzes() {
    console.log('📄 Estrazione quiz dal PDF...');
    
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    
    const text = data.text;
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    
    console.log(`📝 Totale righe estratte: ${lines.length}`);
    
    // Cerca pattern per risposte corrette nel testo completo
    // Pattern: "# D" o "# A" seguito da testo (potrebbe essere su righe diverse)
    const correctAnswerPatterns = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Cerca pattern "# [lettera]" o "#[lettera]" o " # [lettera]"
        const match = line.match(/#\s*([A-Ea-e])\s*(.+)?/);
        if (match) {
            const letter = match[1].toUpperCase();
            const answerText = match[2] ? match[2].trim() : '';
            correctAnswerPatterns.push({
                lineIndex: i,
                letter: letter,
                answerText: answerText,
                fullLine: line
            });
        }
    }
    
    if (correctAnswerPatterns.length > 0) {
        console.log(`✅ Trovati ${correctAnswerPatterns.length} pattern per risposte corrette`);
        correctAnswerPatterns.slice(0, 5).forEach(p => {
            console.log(`   Linea ${p.lineIndex}: ${p.letter} - ${p.answerText.substring(0, 50)}`);
        });
    }
    
    const quizzes = [];
    let currentQuestion = null;
    let currentAnswers = [];
    let questionNumber = 0;
    let expectingAnswers = false;
    let correctAnswer = null;
    let currentQuestionStartLine = -1;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Rileva inizio di una nuova domanda (numero seguito da punto)
        const questionMatch = line.match(/^(\d+)\.\s*(.+)/);
        if (questionMatch) {
            // Salva la domanda precedente se completa
            if (currentQuestion && currentAnswers.length >= 1) {
                // Categorizza la domanda
                const answersText = currentAnswers.join(' ');
                const categorization = categorizeQuiz(currentQuestion, answersText);
                
                // Se non abbiamo una risposta corretta, controlla se è nel file di riferimento
                let finalCorrectAnswer = correctAnswer;
                if (!finalCorrectAnswer && knownCorrectAnswers[questionNumber]) {
                    finalCorrectAnswer = knownCorrectAnswers[questionNumber];
                }
                
                const quizObj = {
                    id: questionNumber,
                    question: cleanText(currentQuestion),
                    category: categorization.category,
                    subcategory: categorization.subcategory,
                    answers: currentAnswers.map((answer, idx) => ({
                        letter: String.fromCharCode(65 + idx), // A, B, C, D, E
                        text: cleanText(answer)
                    })),
                    correctAnswer: finalCorrectAnswer
                };
                
                // Se non abbiamo una risposta corretta, aggiungi un campo di nota (sarà rimosso dopo)
                if (!finalCorrectAnswer) {
                    quizObj._needsManualVerification = true;
                }
                
                quizzes.push(quizObj);
            }
            
            // Inizia una nuova domanda
            questionNumber = parseInt(questionMatch[1]);
            currentQuestion = questionMatch[2].trim();
            currentAnswers = [];
            expectingAnswers = false;
            correctAnswer = null;
            currentQuestionStartLine = i;
            
            // Cerca se c'è una risposta corretta indicata nelle righe vicine (prima o dopo)
            // Cerca nelle prossime 20 righe
            for (let j = Math.max(0, i - 5); j < Math.min(lines.length, i + 20); j++) {
                const nearbyLine = lines[j];
                const correctMatch = nearbyLine.match(/#\s*([A-Ea-e])\s*/);
                if (correctMatch && Math.abs(j - i) < 15) {
                    correctAnswer = correctMatch[1].toUpperCase();
                    break;
                }
            }
        } 
        // Rileva risposte corrette (indicate con # prima della lettera o risposta)
        // Pattern: "# D fludrocortisone" o "# A ha idrogeni acidi"
        // Cerca anche pattern con # in mezzo alla riga
        if (/#\s*[A-Ea-e]/.test(line) && currentQuestion) {
            const match = line.match(/#\s*([A-Ea-e])\s*(.+)?/);
            if (match) {
                const foundLetter = match[1].toUpperCase();
                // Se non abbiamo ancora una risposta corretta per questa domanda, impostala
                if (!correctAnswer) {
                    correctAnswer = foundLetter;
                }
                // Se la riga contiene anche il testo della risposta, aggiungila alle risposte se non è già presente
                const answerText = match[2] ? match[2].trim() : '';
                if (answerText.length > 0 && currentAnswers.length < 5) {
                    // Trova l'indice della lettera (A=0, B=1, etc.)
                    const letterIndex = foundLetter.charCodeAt(0) - 65;
                    // Assicurati che ci sia spazio per questa risposta
                    while (currentAnswers.length <= letterIndex) {
                        currentAnswers.push('');
                    }
                    // Se la risposta in quella posizione è vuota, aggiungila
                    if (!currentAnswers[letterIndex] || currentAnswers[letterIndex].length === 0) {
                        currentAnswers[letterIndex] = answerText;
                    }
                    expectingAnswers = true;
                }
            }
        }
        // Rileva risposte con lettera (A, B, C, D, E) - solo se non è già una risposta corretta con #
        else if (currentQuestion && !/^#/.test(line)) {
            // Formato: A) testo, A. testo, A testo (con spazio dopo la lettera)
            if (/^[A-E][\)\.]\s/.test(line)) {
                const answerText = line.replace(/^[A-E][\)\.]\s*/, '').trim();
                if (answerText.length > 0) {
                    currentAnswers.push(answerText);
                    expectingAnswers = true;
                }
            }
            // Poi prova con solo lettera e spazio seguito da testo
            else if (/^[A-E]\s+[A-Za-z0-9]/.test(line)) {
                const answerText = line.replace(/^[A-E]\s+/, '').trim();
                if (answerText.length > 0) {
                    currentAnswers.push(answerText);
                    expectingAnswers = true;
                }
            }
            // Prova anche con lettera minuscola: a) testo, a. testo, a testo
            else if (/^[a-e][\)\.]\s/.test(line)) {
                const answerText = line.replace(/^[a-e][\)\.]\s*/, '').trim();
                if (answerText.length > 0) {
                    currentAnswers.push(answerText);
                    expectingAnswers = true;
                }
            }
            // Prova anche con lettera minuscola e spazio
            else if (/^[a-e]\s+[A-Za-z0-9]/.test(line)) {
                const answerText = line.replace(/^[a-e]\s+/, '').trim();
                if (answerText.length > 0) {
                    currentAnswers.push(answerText);
                    expectingAnswers = true;
                }
            }
            // Continua la domanda se non abbiamo ancora risposte
            else if (!expectingAnswers && currentAnswers.length === 0 && line.length > 3 && !/^[A-E]$/.test(line) && !/^\d+\./.test(line) && !/^[A-E]\s/.test(line) && !/^#/.test(line)) {
                currentQuestion += ' ' + line;
            }
            // Se abbiamo risposte e la riga non è una lettera singola o nuova domanda, potrebbe essere continuazione di una risposta
            else if (expectingAnswers && currentAnswers.length > 0 && currentAnswers.length < 5 && line.length > 2 && !/^[A-E]$/.test(line) && !/^[A-E][\)\.]/.test(line) && !/^[A-E]\s[A-Z]/.test(line) && !/^\d+\./.test(line) && !/^#/.test(line)) {
                // Aggiungi alla risposta precedente
                const lastIndex = currentAnswers.length - 1;
                if (currentAnswers[lastIndex]) {
                    currentAnswers[lastIndex] = currentAnswers[lastIndex] + ' ' + line;
                }
            }
        }
    }
    
    // Aggiungi l'ultima domanda
    if (currentQuestion && currentAnswers.length >= 1) {
        const answersText = currentAnswers.join(' ');
        const categorization = categorizeQuiz(currentQuestion, answersText);
        
        let finalCorrectAnswer = correctAnswer;
        if (!finalCorrectAnswer && knownCorrectAnswers[questionNumber]) {
            finalCorrectAnswer = knownCorrectAnswers[questionNumber];
        }
        
        const quizObj = {
            id: questionNumber,
            question: cleanText(currentQuestion),
            category: categorization.category,
            subcategory: categorization.subcategory,
            answers: currentAnswers.map((answer, idx) => ({
                letter: String.fromCharCode(65 + idx),
                text: cleanText(answer)
            })),
            correctAnswer: finalCorrectAnswer
        };
        
        if (!finalCorrectAnswer) {
            quizObj._needsManualVerification = true;
        }
        
        quizzes.push(quizObj);
    }
    
    console.log(`✅ Estratte ${quizzes.length} domande`);
    
    return quizzes;
}

// Funzione principale
async function main() {
    try {
        const result = await extractQuizzes();
        const quizzes = result.quizzes || result; // Gestisce sia il caso con oggetto che array
        
        // Calcola quante domande hanno una risposta corretta identificata
        let missingCorrectAnswers = 0;
        let foundCorrectAnswers = 0;
        
        for (let i = 0; i < quizzes.length; i++) {
            if (!quizzes[i].correctAnswer || !['A', 'B', 'C', 'D', 'E'].includes(quizzes[i].correctAnswer)) {
                missingCorrectAnswers++;
            } else {
                foundCorrectAnswers++;
            }
        }
        
        // Rimuovi il campo _needsManualVerification dal JSON finale (mantienilo solo per il report)
        const quizzesForOutput = quizzes.map(q => {
            const { _needsManualVerification, ...quizWithoutNote } = q;
            return quizWithoutNote;
        });
        
        const output = {
            metadata: {
                sourceFile: 'ssfo-quiz-modello2.pdf',
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


