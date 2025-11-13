// Script per la pagina statistiche
const { ipcRenderer } = require('electron');
const { Chart, registerables } = require('chart.js');
Chart.register(...registerables);

// Variabile globale per il grafico
let performanceChart = null;

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
    
    container.innerHTML = recentHistory.map(quiz => {
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
            <div class="history-item">
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
}

// Cancella tutte le statistiche
function clearStatistics() {
    if (confirm('⚠️ Sei sicuro di voler cancellare tutte le statistiche?\n\nQuesta azione non può essere annullata.')) {
        localStorage.removeItem('quizStatistics');
        displayStatistics();
        console.log('✅ Statistiche cancellate');
    }
}

// Torna alla home
function backToHome() {
    window.location.href = '../../index.html';
}

// Event Listeners
document.getElementById('backHomeBtn').addEventListener('click', backToHome);
document.getElementById('clearStatsBtn').addEventListener('click', clearStatistics);

// Carica le statistiche all'avvio
displayStatistics();

// Log di conferma caricamento
console.log('Pagina statistiche caricata correttamente');

