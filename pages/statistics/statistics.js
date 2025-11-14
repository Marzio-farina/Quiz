// Script per la pagina statistiche
const { ipcRenderer } = require('electron');
const { Chart, registerables } = require('chart.js');
Chart.register(...registerables);

// Variabili globali per i grafici
let performanceChart = null;
let categoryRadarChart = null;

// Carica il tema salvato
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
}

// Inizializza il tema all'avvio
initTheme();

// Carica le statistiche dal localStorage
function loadStatistics() {
    const stats = JSON.parse(localStorage.getItem('quizStatistics') || '{"completed": 0, "history": []}');
    return stats;
}

// Calcola statistiche aggregate
function calculateStats(stats) {
    if (stats.history.length === 0) {
        return {
            totalQuizzes: 0,
            avgScore: 0,
            avgTime: 0,
            bestScore: 0
        };
    }

    const totalQuizzes = stats.history.length;
    
    // Calcola percentuali gestendo valori null/undefined
    const percentages = stats.history.map(quiz => {
        if (quiz.percentage !== null && quiz.percentage !== undefined && !isNaN(quiz.percentage)) {
            return quiz.percentage;
        }
        // Calcola la percentuale dai dati se non esiste
        if (quiz.totalQuestions && quiz.totalQuestions > 0) {
            return (quiz.correctAnswers / quiz.totalQuestions) * 100;
        }
        return 0; // Fallback a 0 se i dati sono invalidi
    });
    
    const avgScore = percentages.reduce((sum, p) => sum + p, 0) / totalQuizzes;
    const avgTime = stats.history.reduce((sum, quiz) => sum + (quiz.timeSpent || 0), 0) / totalQuizzes;
    const bestScore = Math.max(...percentages);

    return {
        totalQuizzes,
        avgScore: isNaN(avgScore) ? '0.0' : avgScore.toFixed(1),
        avgTime: isNaN(avgTime) ? 0 : Math.round(avgTime / 60), // Converti in minuti
        bestScore: isNaN(bestScore) || bestScore === -Infinity ? '0.0' : bestScore.toFixed(1)
    };
}

// Crea il grafico delle performance
function createPerformanceChart(history) {
    const canvas = document.getElementById('performanceChart');
    const ctx = canvas.getContext('2d');
    
    // Distruggi il grafico esistente se presente
    if (performanceChart) {
        performanceChart.destroy();
    }
    
    if (history.length === 0) {
        // Mostra messaggio se non ci sono dati
        ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        ctx.fillStyle = document.body.classList.contains('dark-theme') ? '#b0b0b0' : '#999';
        ctx.textAlign = 'center';
        ctx.fillText('Nessun dato disponibile', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    // Prendi gli ultimi 10 quiz
    const recentQuizzes = history.slice(-10);
    
    // Prepara i dati per il grafico
    const labels = recentQuizzes.map((quiz, index) => `Quiz ${index + 1}`);
    
    // Calcola le percentuali di successo e errore
    const successData = recentQuizzes.map(quiz => {
        let percentage = 0;
        if (quiz.percentage !== null && quiz.percentage !== undefined && !isNaN(quiz.percentage)) {
            percentage = quiz.percentage;
        } else if (quiz.totalQuestions && quiz.totalQuestions > 0) {
            percentage = (quiz.correctAnswers / quiz.totalQuestions) * 100;
        }
        return parseFloat(percentage.toFixed(1));
    });
    
    const errorData = successData.map(success => parseFloat((100 - success).toFixed(1)));
    
    // Determina i colori in base al tema
    const isDarkTheme = document.body.classList.contains('dark-theme');
    const gridColor = isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDarkTheme ? '#e0e0e0' : '#666';
    
    // Crea il grafico
    performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '% Risposte Corrette',
                data: successData,
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#28a745',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }, {
                label: '% Errori',
                data: errorData,
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#dc3545',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: textColor,
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const quiz = recentQuizzes[context.dataIndex];
                            const datasetLabel = context.dataset.label;
                            return [
                                `${datasetLabel}: ${context.parsed.y}%`,
                                `Domande: ${quiz.totalQuestions}`,
                                `Corrette: ${quiz.correctAnswers}`,
                                `Sbagliate: ${quiz.totalQuestions - quiz.correctAnswers}`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 10,
                        color: textColor,
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: gridColor
                    }
                },
                x: {
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                }
            }
        }
    });
}

// Mappa dei nomi categoria per visualizzazione
const categoryDisplayNames = {
    'FARMACOLOGIA': 'Farmacologia',
    'CHIMICA_FARMACEUTICA': 'Chimica Farmaceutica',
    'LEGISLAZIONE': 'Legislazione',
    'MICROBIOLOGIA': 'Microbiologia',
    'FARMACEUTICA': 'Farmaceutica',
    'CHIMICA_ANALITICA': 'Chimica Analitica',
    'FARMACOGNOSIA': 'Farmacognosia',
    'COSMETOLOGIA': 'Cosmetologia',
    'ECONOMIA_FARMACEUTICA': 'Economia Farmaceutica',
    'ALTRO': 'Altro',
    // Sottocategorie Farmacologia
    'FARMACOLOGIA_CARDIOVASCOLARE': 'Farmacologia - Cardiovascolare',
    'FARMACOLOGIA_ANTIBIOTICI': 'Farmacologia - Antibiotici',
    'FARMACOLOGIA_SISTEMA_NERVOSO': 'Farmacologia - Sistema Nervoso',
    'FARMACOLOGIA_ANTINFIAMMATORI': 'Farmacologia - Antinfiammatori',
    // Sottocategorie altre categorie (se presenti)
    'FARMACEUTICA_SOLIDE': 'Farmaceutica - Forme Solide',
    'FARMACEUTICA_LIQUIDE': 'Farmaceutica - Forme Liquide',
    'FARMACEUTICA_SEMISOLIDE': 'Farmaceutica - Forme Semisolide',
    'FARMACEUTICA_ECCIPIENTI': 'Farmaceutica - Eccipienti'
};

// Funzione per ottenere il nome visualizzato di una categoria
function getCategoryDisplayName(categoryCode) {
    return categoryDisplayNames[categoryCode] || categoryCode;
}

// Lista di tutte le categorie principali
const allMainCategories = [
    'FARMACOLOGIA',
    'CHIMICA_FARMACEUTICA',
    'LEGISLAZIONE',
    'MICROBIOLOGIA',
    'FARMACEUTICA',
    'CHIMICA_ANALITICA',
    'FARMACOGNOSIA',
    'COSMETOLOGIA',
    'ECONOMIA_FARMACEUTICA',
    'ALTRO'
];

// Calcola le statistiche per categoria
function calculateCategoryStats(history) {
    const categoryStats = {};
    
    // Inizializza tutte le categorie principali con 0
    allMainCategories.forEach(category => {
        categoryStats[category] = {
            correct: 0,
            wrong: 0,
            unanswered: 0,
            total: 0
        };
    });
    
    // Itera attraverso tutti i quiz nella history
    history.forEach(quiz => {
        if (quiz.details && Array.isArray(quiz.details)) {
            quiz.details.forEach(detail => {
                const category = detail.category;
                if (category) {
                    // Se è una sottocategoria, usa la categoria principale
                    let mainCategory = category;
                    if (category.includes('_')) {
                        // Estrai la categoria principale (prima parte prima del primo underscore)
                        const parts = category.split('_');
                        // Verifica se la prima parte è una categoria principale
                        if (allMainCategories.includes(parts[0])) {
                            mainCategory = parts[0];
                        } else {
                            // Se non è una categoria principale nota, usa la categoria così com'è
                            mainCategory = category;
                        }
                    }
                    
                    // Inizializza la categoria se non esiste (per sottocategorie non mappate)
                    if (!categoryStats[mainCategory]) {
                        categoryStats[mainCategory] = {
                            correct: 0,
                            wrong: 0,
                            unanswered: 0,
                            total: 0
                        };
                    }
                    
                    // Incrementa il totale
                    categoryStats[mainCategory].total++;
                    
                    // Classifica la risposta
                    if (detail.userAnswer === null || detail.userAnswer === undefined) {
                        // Risposta non data
                        categoryStats[mainCategory].unanswered++;
                    } else if (detail.isCorrect === true) {
                        // Risposta corretta
                        categoryStats[mainCategory].correct++;
                    } else {
                        // Risposta errata
                        categoryStats[mainCategory].wrong++;
                    }
                }
            });
        }
    });
    
    return categoryStats;
}

// Crea il grafico radar per categoria
function createCategoryRadarChart(history) {
    const canvas = document.getElementById('categoryRadarChart');
    const ctx = canvas.getContext('2d');
    
    // Distruggi il grafico esistente se presente
    if (categoryRadarChart) {
        categoryRadarChart.destroy();
    }
    
    if (history.length === 0) {
        // Mostra messaggio se non ci sono dati
        ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        ctx.fillStyle = document.body.classList.contains('dark-theme') ? '#b0b0b0' : '#999';
        ctx.textAlign = 'center';
        ctx.fillText('Nessun dato disponibile', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    // Calcola le statistiche per categoria
    const categoryStats = calculateCategoryStats(history);
    
    // Usa tutte le categorie principali (anche quelle con 0 statistiche)
    const categories = allMainCategories.filter(cat => categoryStats[cat] !== undefined);
    
    if (categories.length === 0) {
        ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        ctx.fillStyle = document.body.classList.contains('dark-theme') ? '#b0b0b0' : '#999';
        ctx.textAlign = 'center';
        ctx.fillText('Nessun dato per categoria disponibile', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    // Calcola le percentuali corrette, errate e non date per ogni categoria
    const correctPercentages = categories.map(category => {
        const stats = categoryStats[category];
        if (stats.total === 0) return 0; // Se non ci sono domande, percentuale = 0
        return parseFloat(((stats.correct / stats.total) * 100).toFixed(1));
    });
    
    const wrongPercentages = categories.map(category => {
        const stats = categoryStats[category];
        if (stats.total === 0) return 0; // Se non ci sono domande, percentuale = 0
        return parseFloat(((stats.wrong / stats.total) * 100).toFixed(1));
    });
    
    const unansweredPercentages = categories.map(category => {
        const stats = categoryStats[category];
        if (stats.total === 0) return 0; // Se non ci sono domande, percentuale = 0
        return parseFloat(((stats.unanswered / stats.total) * 100).toFixed(1));
    });
    
    // Converti i codici categoria in nomi visualizzati
    const categoryLabels = categories.map(cat => getCategoryDisplayName(cat));
    
    console.log(`Categorie trovate: ${categories.length}`, categories);
    console.log(`Percentuali corrette:`, correctPercentages);
    console.log(`Percentuali errate:`, wrongPercentages);
    console.log(`Percentuali non date:`, unansweredPercentages);
    
    // Determina i colori in base al tema
    const isDarkTheme = document.body.classList.contains('dark-theme');
    const gridColor = isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDarkTheme ? '#e0e0e0' : '#666';
    const correctPointColor = isDarkTheme ? '#64b5f6' : '#667eea';
    const correctFillColor = isDarkTheme ? 'rgba(100, 181, 246, 0.2)' : 'rgba(102, 126, 234, 0.2)';
    const correctBorderColor = isDarkTheme ? '#64b5f6' : '#667eea';
    const wrongPointColor = isDarkTheme ? '#e63946' : '#dc3545';
    const wrongFillColor = isDarkTheme ? 'rgba(230, 57, 70, 0.2)' : 'rgba(220, 53, 69, 0.2)';
    const wrongBorderColor = isDarkTheme ? '#e63946' : '#dc3545';
    const unansweredPointColor = isDarkTheme ? '#ffa726' : '#ff9800';
    const unansweredFillColor = isDarkTheme ? 'rgba(255, 167, 38, 0.2)' : 'rgba(255, 152, 0, 0.2)';
    const unansweredBorderColor = isDarkTheme ? '#ffa726' : '#ff9800';
    
    // Crea il grafico radar
    categoryRadarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: categoryLabels,
            datasets: [{
                label: '% Risposte Corrette',
                data: correctPercentages,
                borderColor: correctBorderColor,
                backgroundColor: correctFillColor,
                borderWidth: 3,
                pointBackgroundColor: correctPointColor,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }, {
                label: '% Risposte Errate',
                data: wrongPercentages,
                borderColor: wrongBorderColor,
                backgroundColor: wrongFillColor,
                borderWidth: 3,
                pointBackgroundColor: wrongPointColor,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }, {
                label: '% Risposte Non Date',
                data: unansweredPercentages,
                borderColor: unansweredBorderColor,
                backgroundColor: unansweredFillColor,
                borderWidth: 3,
                pointBackgroundColor: unansweredPointColor,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: textColor,
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const category = categories[context.dataIndex];
                            const stats = categoryStats[category];
                            const datasetLabel = context.dataset.label;
                            return [
                                `Categoria: ${getCategoryDisplayName(category)}`,
                                `${datasetLabel}: ${context.parsed.r}%`,
                                `Corrette: ${stats.correct}`,
                                `Errate: ${stats.wrong}`,
                                `Non date: ${stats.unanswered}`,
                                `Totali: ${stats.total}`
                            ];
                        }
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 33,
                        color: textColor,
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: gridColor
                    },
                    pointLabels: {
                        color: textColor,
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                }
            }
        }
    });
}

// Visualizza le statistiche
function displayStatistics() {
    const stats = loadStatistics();
    const calculated = calculateStats(stats);

    // Aggiorna le card
    document.getElementById('totalQuizzes').textContent = calculated.totalQuizzes;
    document.getElementById('avgScore').textContent = `${calculated.avgScore}%`;
    document.getElementById('avgTime').textContent = `${calculated.avgTime}m`;
    document.getElementById('bestScore').textContent = `${calculated.bestScore}%`;

    // Crea il grafico delle performance
    createPerformanceChart(stats.history);
    
    // Crea il grafico radar per categoria
    createCategoryRadarChart(stats.history);
    
    // Visualizza lo storico
    displayHistory(stats.history);
}

// Visualizza lo storico dei quiz
function displayHistory(history) {
    const container = document.getElementById('historyContainer');

    if (history.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <p>📭 Nessun quiz completato ancora</p>
                <p class="no-data-subtitle">Completa il tuo primo quiz per vedere le statistiche!</p>
            </div>
        `;
        return;
    }

    // Mostra gli ultimi 10 quiz (più recenti prima)
    const recentHistory = history.slice(-10).reverse();
    
    container.innerHTML = recentHistory.map((quiz, index) => {
        const date = new Date(quiz.date);
        const dateStr = date.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Calcola la percentuale se non esiste
        let percentage = 0;
        if (quiz.percentage !== null && quiz.percentage !== undefined && !isNaN(quiz.percentage)) {
            percentage = quiz.percentage;
        } else if (quiz.totalQuestions && quiz.totalQuestions > 0) {
            percentage = (quiz.correctAnswers / quiz.totalQuestions) * 100;
        }
        
        return `
            <div class="history-item" data-quiz-index="${index}">
                <div class="history-info">
                    <div class="history-date">${dateStr}</div>
                    <div class="history-details">
                        ${quiz.correctAnswers}/${quiz.totalQuestions} domande corrette
                        ${quiz.random ? '🔀 Random' : ''}
                    </div>
                </div>
                <div class="history-score">${percentage.toFixed(1)}%</div>
            </div>
        `;
    }).join('');
    
    // Aggiungi listener per il click sui record
    const historyItems = container.querySelectorAll('.history-item');
    historyItems.forEach(item => {
        item.addEventListener('click', () => {
            const quizIndex = parseInt(item.dataset.quizIndex);
            showQuizDetail(recentHistory[quizIndex]);
        });
    });
}

// Mostra il dialog con i dettagli del quiz
function showQuizDetail(quiz) {
    if (!quiz.details || quiz.details.length === 0) {
        alert('⚠️ Dettagli non disponibili per questo quiz.\n\nI dettagli sono disponibili solo per i quiz completati dopo questo aggiornamento.');
        return;
    }
    
    // Calcola larghezza scrollbar e blocca lo scroll del body
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
    document.body.classList.add('dialog-open');
    
    const dialog = document.getElementById('quizDetailDialog');
    
    // Formatta la data
    const date = new Date(quiz.date);
    const dateStr = date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Calcola la percentuale
    let percentage = 0;
    if (quiz.percentage !== null && quiz.percentage !== undefined && !isNaN(quiz.percentage)) {
        percentage = quiz.percentage;
    } else if (quiz.totalQuestions && quiz.totalQuestions > 0) {
        percentage = (quiz.correctAnswers / quiz.totalQuestions) * 100;
    }
    
    // Aggiorna le informazioni del dialog
    document.getElementById('detailDate').textContent = dateStr;
    document.getElementById('detailScore').textContent = `${percentage.toFixed(1)}%`;
    
    // Genera l'HTML per le domande
    const questionsHTML = quiz.details.map((detail, index) => {
        const statusIcon = detail.isCorrect ? '✅' : '❌';
        const statusClass = detail.isCorrect ? 'correct' : 'incorrect';
        
        // Trova la risposta data dall'utente
        const userAnswerText = detail.answers.find(a => a.letter === detail.userAnswer)?.text || 'Nessuna risposta';
        const correctAnswerText = detail.answers.find(a => a.letter === detail.correctAnswer)?.text || '';
        
        return `
            <div class="detail-question-item ${statusClass}">
                <div class="detail-question-header">
                    <span class="detail-question-number">Domanda ${index + 1}</span>
                    <span class="detail-question-status">${statusIcon}</span>
                </div>
                <div class="detail-question-text">${detail.question}</div>
                <div class="detail-answer user-answer">
                    Tua risposta: ${detail.userAnswer}) ${userAnswerText}
                </div>
                ${!detail.isCorrect ? `
                    <div class="detail-answer correct-answer">
                        Risposta corretta: ${detail.correctAnswer}) ${correctAnswerText}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    document.getElementById('detailQuestions').innerHTML = questionsHTML;
    
    // Mostra il dialog
    dialog.style.display = 'flex';
}

// Nascondi il dialog dei dettagli
function hideQuizDetail() {
    const dialog = document.getElementById('quizDetailDialog');
    dialog.style.display = 'none';
    
    // Riabilita lo scroll del body
    document.body.classList.remove('dialog-open');
}

// Cancella tutte le statistiche
function clearStatistics() {
    // Mostra il dialog di conferma
    showConfirmDeleteDialog();
}

function showConfirmDeleteDialog() {
    const dialog = document.getElementById('confirmDeleteDialog');
    dialog.style.display = 'flex';
}

function hideConfirmDeleteDialog() {
    const dialog = document.getElementById('confirmDeleteDialog');
    dialog.style.display = 'none';
}

function performDelete() {
    localStorage.removeItem('quizStatistics');
    displayStatistics();
    hideConfirmDeleteDialog();
}

// Torna alla home
function backToHome() {
    window.location.href = '../../index.html';
}

// Event Listeners
document.getElementById('backHomeBtn').addEventListener('click', backToHome);
document.getElementById('clearStatsBtn').addEventListener('click', clearStatistics);
document.getElementById('closeDetailBtn').addEventListener('click', hideQuizDetail);

// Event listeners per il dialog di conferma cancellazione
document.getElementById('confirmDeleteBtn').addEventListener('click', performDelete);
document.getElementById('cancelDeleteBtn').addEventListener('click', hideConfirmDeleteDialog);

// Chiudi dialog dettagli cliccando fuori dalla finestra
document.getElementById('quizDetailDialog').addEventListener('click', (e) => {
    if (e.target.id === 'quizDetailDialog') {
        hideQuizDetail();
    }
});

// Chiudi dialog conferma cancellazione cliccando fuori dalla finestra
document.getElementById('confirmDeleteDialog').addEventListener('click', (e) => {
    if (e.target.id === 'confirmDeleteDialog') {
        hideConfirmDeleteDialog();
    }
});

// Carica le statistiche all'avvio
displayStatistics();

