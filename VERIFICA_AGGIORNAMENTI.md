# 🔍 Guida alla Verifica degli Aggiornamenti

## Problema: L'applicazione non notifica gli aggiornamenti

### ✅ Checklist di Verifica

#### 1. **L'applicazione installata è stata buildata correttamente?**

L'app deve essere stata buildata con `electron-builder`, NON solo avviata con `npm start`.

**Verifica:**
- L'app installata deve essere nella cartella `dist/` o installata tramite il file `.exe` generato
- L'app NON deve essere quella avviata con `npm start` (quella è solo per sviluppo)

**Soluzione:**
```bash
npm run build
```
Questo crea i file nella cartella `dist/` che devono essere distribuiti.

#### 2. **La release su GitHub contiene i file corretti?**

La release deve contenere:
- ✅ `Quiz App Setup 1.1.0.exe` (o versione corrente)
- ✅ `latest.yml` (file di metadati generato automaticamente da electron-builder)
- ✅ Altri file di distribuzione se presenti

**Verifica:**
1. Vai su: https://github.com/Marzio-farina/Quiz/releases
2. Apri la release v1.1.0
3. Controlla che ci siano i file sopra elencati

**Se mancano i file:**
- Devi fare il build con `npm run build`
- I file vengono generati automaticamente nella cartella `dist/`
- Carica TUTTI i file dalla cartella `dist/` nella release di GitHub

#### 3. **Il tag della release corrisponde alla versione?**

**Verifica:**
- Il tag della release deve essere `v1.1.0` (con la "v" davanti)
- La versione in `package.json` deve essere `1.1.0` (senza la "v")

#### 4. **L'app installata ha la versione corretta?**

**Verifica:**
- Apri l'app installata
- Controlla la versione nel footer (dovrebbe essere 1.0.0 o precedente se non hai ancora installato la 1.1.0)
- Se l'app installata è già 1.1.0, non ci saranno aggiornamenti da notificare

#### 5. **Controllo manuale degli aggiornamenti**

Ho aggiunto un sistema di logging per il debug. I log vengono salvati in:
- Windows: `%USERPROFILE%\AppData\Roaming\Quiz App\logs\`
- macOS: `~/Library/Logs/Quiz App/`
- Linux: `~/.config/Quiz App/logs/`

**Per testare manualmente:**
1. Apri la console dell'app (se disponibile) o controlla i log
2. Dovresti vedere messaggi come:
   - `[AUTO-UPDATER] Controllo aggiornamenti in corso...`
   - `[AUTO-UPDATER] Aggiornamento disponibile: 1.1.0`
   - Oppure errori se qualcosa non va

#### 6. **Problemi comuni**

**Problema: "Cannot find module 'electron-log'"**
- **Soluzione**: Installa le dipendenze: `npm install`

**Problema: "Network error" o "Cannot connect to GitHub"**
- **Soluzione**: Verifica la connessione internet e che GitHub sia raggiungibile

**Problema: "No update available" anche se c'è una nuova release**
- **Soluzione**: 
  1. Verifica che il tag della release sia corretto (`v1.1.0`)
  2. Verifica che la versione in `package.json` sia inferiore alla release
  3. Attendi qualche minuto (GitHub può avere un delay nella propagazione)

**Problema: L'app non controlla automaticamente**
- **Soluzione**: L'app controlla dopo 3 secondi dall'avvio. Se non vedi nulla, controlla i log.

## 🔧 Come Testare

### Test Locale (senza GitHub)

1. **Crea una versione di test più vecchia:**
   ```json
   // package.json
   "version": "1.0.0"
   ```

2. **Builda l'app:**
   ```bash
   npm run build
   ```

3. **Installa l'app dalla cartella `dist/`**

4. **Cambia la versione in package.json:**
   ```json
   "version": "1.0.1"
   ```

5. **Crea una release su GitHub con tag `v1.0.1`**

6. **Riavvia l'app installata** - dovrebbe notificare l'aggiornamento

### Test con Release Reale

1. **Assicurati che l'app installata sia versione 1.0.0 o precedente**

2. **Crea la release v1.1.0 su GitHub con tutti i file necessari**

3. **Riavvia l'app installata**

4. **Dopo 3 secondi dovrebbe apparire il dialog di aggiornamento**

## 📝 Note Importanti

- ⚠️ L'app deve essere stata **installata** (non solo avviata con npm start)
- ⚠️ La release su GitHub deve contenere **tutti i file** generati da electron-builder
- ⚠️ Il tag della release deve corrispondere alla versione (es. `v1.1.0`)
- ⚠️ L'app controlla gli aggiornamenti solo se NON è in modalità dev (`--dev`)

