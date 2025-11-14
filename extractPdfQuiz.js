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
 * Restituisce un oggetto con category e subcategory
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
    
    // Definizione delle sottocategorie per ogni categoria
    const subcategories = {
        'FARMACOLOGIA': {
            'FARMACOLOGIA_CARDIOVASCOLARE': [
                // Cardiovascolare - più specifico
                'antipertensivo', 'ipertensione', 'ace inibitore', 'enalapril', 'captopril', 'lisinopril',
                'sartano', 'losartan', 'valsartan', 'irbesartan', 'calcio-antagonista', 'amlodipina', 'nifedipina',
                'beta-bloccante', 'propranolol', 'atenolol', 'metoprolol', 'bisoprolol',
                'alfa-bloccante', 'doxazosina', 'prazosina', 'nitrati', 'nitroglicerina', 'isosorbide',
                'digitale', 'digitossina', 'digossina', 'antiaritmico', 'amiodarone', 'flecainide',
                'anticoagulante', 'warfarin', 'eparina', 'dabigatran', 'rivaroxaban', 'apixaban',
                'antiaggregante', 'clopidogrel', 'ticlopidina', 'dipiridamolo',
                'statine', 'atorvastatina', 'simvastatina', 'rosuvastatina', 'pravastatina',
                'colesterolo', 'trigliceridi', 'aterosclerosi', 'cardiaco', 'cuore', 'miocardio',
                'angina', 'antianginosa', 'ischemia', 'infarto'
            ],
            'FARMACOLOGIA_ANTIBIOTICI': [
                // Antibiotici - più completo
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
                'antibiogramma', 'mic', 'sensibile', 'resistente'
            ],
            'FARMACOLOGIA_SISTEMA_NERVOSO': [
                // Sistema Nervoso - più completo
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
                'atropina', 'scopolamina', 'anticolinergico', 'colinergico'
            ],
            'FARMACOLOGIA_ANTINFIAMMATORI': [
                // Antinfiammatori, Analgesici, Altri
                'antinfiammatorio', 'fans', 'ibuprofene', 'naprossene', 'ketoprofene',
                'diclofenac', 'indometacina', 'piroxicam', 'meloxicam', 'celecoxib',
                'cortisonico', 'corticosteroide', 'prednisone', 'prednisolone', 'idrocortisone',
                'betametasone', 'desametasone', 'metilprednisolone', 'triamcinolone',
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
                'teratogeno', 'teratogeni', 'malformazioni fetali'
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
                'racemo', 'enantiomero puro'
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
                'ripetibile', 'non ripetibile', 'ricetta bianca', 'ricetta rossa',
                'ricetta limitativa', 'ricetta speciale'
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
        
        // Trova la sottocategoria con il punteggio più alto
        let maxSubScore = 0;
        for (const [subcategory, score] of Object.entries(subcategoryScores)) {
            if (score > maxSubScore) {
                maxSubScore = score;
                bestSubcategory = subcategory;
            }
        }
        
        // Se nessuna sottocategoria ha un punteggio significativo, assegna alla prima
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
            // Errore silenzioso
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
        return null;
    }
    
    if (answers.length !== 5) {
        if (answers.length < 2) {
            return null;
        }
    }
    
    // Categorizza il quiz in base al contenuto
    const answersText = answers.map(a => a.text).join(' ');
    const categorization = categorizeQuiz(questionText, answersText);
    
    return {
        id: quizNumber,
        question: questionText,
        category: categorization.category,
        subcategory: categorization.subcategory,
        answers: answers,
        correctAnswer: correctAnswer || 'NON_TROVATA'
    };
}

/**
 * Funzione principale
 */
async function main() {
    try {
        // Leggi il file PDF
        const dataBuffer = fs.readFileSync(pdfPath);
        
        // Parsa il PDF
        const data = await pdf(dataBuffer);
        
        // Estrai i quiz
        const quizzes = extractQuizzes(data.text);
        
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
        
    } catch (error) {
        process.exit(1);
    }
}

// Esegui lo script
main();
