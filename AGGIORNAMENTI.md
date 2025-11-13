# Guida agli Aggiornamenti Automatici

## Come funziona l'auto-update

L'applicazione Quiz App ora controlla automaticamente gli aggiornamenti da GitHub Releases.

### Quando l'utente apre l'app:

1. **Controllo automatico** dopo 3 secondi dall'avvio
2. **Dialog di notifica** se c'è una nuova versione
3. **Opzioni per l'utente**:
   - "Scarica Ora" → Download dell'aggiornamento
   - "Più tardi" → Rimanda al prossimo avvio
4. **Progress bar** durante il download
5. **Pulsante "Installa e Riavvia"** quando il download è completato
6. **Installazione automatica** alla chiusura dell'app

---

## Come pubblicare un aggiornamento

### 1. Aggiorna la versione nel `package.json`

```json
{
  "version": "1.1.0"  // Cambia da 1.0.0 a 1.1.0
}
```

### 2. Committa le modifiche

```bash
git add .
git commit -m "Versione 1.1.0 - Descrizione modifiche"
git push
```

### 3. Crea il build

```bash
npm run build:win
```

Questo crea nella cartella `dist/`:
- `Quiz App Setup 1.1.0.exe` (installer)
- `Quiz App 1.1.0.exe` (portable)
- `latest.yml` (file di configurazione per auto-update)

### 4. Crea una GitHub Release

#### Opzione A: Da GitHub Web

1. Vai su: `https://github.com/Marzio-farina/Quiz/releases`
2. Click su "Create a new release"
3. Tag: `v1.1.0` (deve iniziare con "v")
4. Title: `Quiz App v1.1.0`
5. Descrizione: Scrivi cosa è cambiato
6. Carica questi file dalla cartella `dist/`:
   - `Quiz App Setup 1.1.0.exe`
   - `Quiz App Setup 1.1.0.exe.blockmap`
   - `latest.yml`
7. Pubblica la release

#### Opzione B: Con GitHub CLI

```bash
gh release create v1.1.0 \
  "dist/Quiz App Setup 1.1.0.exe" \
  "dist/Quiz App Setup 1.1.0.exe.blockmap" \
  "dist/latest.yml" \
  --title "Quiz App v1.1.0" \
  --notes "Descrizione modifiche"
```

#### Opzione C: Con electron-builder (automatico)

```bash
npm run build:win
npx electron-builder --win --publish always
```

**Nota**: Richiede token GitHub in variabile d'ambiente `GH_TOKEN`

### 5. Gli utenti ricevono l'aggiornamento

- All'avvio dell'app, vedranno il dialog con la nuova versione
- Possono scaricare e installare con un click
- L'aggiornamento si installa automaticamente

---

## File necessari per l'auto-update

Quando pubblichi una release, devi SEMPRE includere:

✅ `Quiz App Setup X.X.X.exe` - L'installer
✅ `Quiz App Setup X.X.X.exe.blockmap` - Per download incrementali
✅ `latest.yml` - File di configurazione (contiene info versione)

**IMPORTANTE**: Il file `latest.yml` è generato automaticamente da electron-builder e contiene le informazioni sulla versione e i file da scaricare.

---

## Versionamento Semantico

Usa il formato: `MAJOR.MINOR.PATCH`

- **MAJOR** (1.x.x): Cambiamenti importanti, breaking changes
- **MINOR** (x.1.x): Nuove funzionalità, compatibili
- **PATCH** (x.x.1): Bug fix e piccole correzioni

Esempi:
- `1.0.0` → `1.0.1` - Fix bug
- `1.0.0` → `1.1.0` - Nuova funzionalità
- `1.0.0` → `2.0.0` - Cambiamenti importanti

---

## Testing degli aggiornamenti

### Test locale:

1. Installa la versione 1.0.0
2. Crea una versione 1.0.1 con un piccolo cambiamento
3. Pubblica la release su GitHub
4. Apri l'app versione 1.0.0
5. Dovresti vedere il dialog di aggiornamento

### Modalità sviluppo:

Gli aggiornamenti sono **disabilitati** in modalità `--dev` (quando usi `npm run dev`)

---

## Risoluzione problemi

### L'app non trova aggiornamenti

- Verifica che la release sia **pubblica** su GitHub
- Il tag deve iniziare con "v" (es: `v1.1.0`)
- I file devono essere caricati correttamente
- Controlla la console per errori

### Gli utenti non vedono il dialog

- L'app controlla solo all'avvio (non in background)
- Verifica che il `package.json` abbia la configurazione publish corretta
- Assicurati che il repository sia corretto

---

## File generati nella cartella dist/

- `Quiz App Setup 1.0.0.exe` - Installer NSIS
- `Quiz App 1.0.0.exe` - Versione portable
- `latest.yml` - Configurazione auto-update ← **IMPORTANTE**
- `*.blockmap` - Per download incrementali
- `win-unpacked/` - Versione non impacchettata (non necessaria)

---

## Distribuzione iniziale

Per la **prima distribuzione** (versione 1.0.0):

1. Pubblica la release su GitHub con i file
2. Condividi il link all'installer con gli utenti
3. Gli utenti installano la versione 1.0.0

Per **aggiornamenti successivi**:

1. Aumenta la versione (es. 1.1.0)
2. Fai il build
3. Pubblica la release
4. Gli utenti vedranno automaticamente il dialog! 🎉

---

## Configurazione attuale

```json
"publish": {
  "provider": "github",
  "owner": "Marzio-farina",
  "repo": "Quiz"
}
```

Repository: `https://github.com/Marzio-farina/Quiz`

