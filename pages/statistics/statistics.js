// Script per la pagina statistiche
const { ipcRenderer } = require('electron');

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
    const avgScore = stats.history.reduce((sum, quiz) => sum + quiz.percentage, 0) / totalQuizzes;
    const avgTime = stats.history.reduce((sum, quiz) => sum + (quiz.timeSpent || 0), 0) / totalQuizzes;
    const bestScore = Math.max(...stats.history.map(quiz => quiz.percentage));

    return {
        totalQuizzes,
        avgScore: avgScore.toFixed(1),
        avgTime: Math.round(avgTime / 60), // Converti in minuti
        bestScore: bestScore.toFixed(1)
    };
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

        return `
            <div class="history-item">
                <div class="history-info">
                    <div class="history-date">${dateStr}</div>
                    <div class="history-details">
                        ${quiz.correctAnswers}/${quiz.totalQuestions} domande corrette
                        ${quiz.random ? '🔀 Random' : ''}
                    </div>
                </div>
                <div class="history-score">${quiz.percentage.toFixed(1)}%</div>
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

