// Carica il contenuto della homepage
fetch('pages/homepage/homepage.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('homepage-container').innerHTML = html;
        // Carica homepage.js dopo che la homepage HTML è stata caricata
        const homepageScript = document.createElement('script');
        homepageScript.src = 'pages/homepage/homepage.js';
        document.body.appendChild(homepageScript);
        
        // Carica renderer.js per la gestione degli aggiornamenti (globale)
        homepageScript.onload = () => {
            const rendererScript = document.createElement('script');
            rendererScript.src = 'renderer.js';
            document.body.appendChild(rendererScript);
        };
    })
    .catch(error => {
        console.error('Errore nel caricamento della homepage:', error);
    });

