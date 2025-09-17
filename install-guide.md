# 🚀 Guida Installazione Sistema Gestione Licenze - PowerShell

## 📋 Prerequisiti

### 1. Installare Node.js
```powershell
# Scarica e installa Node.js da https://nodejs.org/
# Oppure usa Chocolatey se disponibile:
choco install nodejs

# Verifica installazione
node --version
npm --version
```

### 2. Installare SQL Server
```powershell
# Scarica SQL Server Express da Microsoft
# https://www.microsoft.com/it-it/sql-server/sql-server-downloads

# Oppure usa Chocolatey:
choco install sql-server-express

# Installa SQL Server Management Studio (opzionale ma consigliato)
choco install sql-server-management-studio
```

## 📁 Setup Progetto

### 1. Creare Directory e Scaricare Codice
```powershell
# Crea directory principale
New-Item -ItemType Directory -Path "C:\TasksManager" -Force
Set-Location "C:\TasksManager"

# Se hai il codice in un repository Git:
git clone <repository-url> .

# Oppure copia manualmente tutti i file del progetto nella directory
```

### 2. Installare Dipendenze
```powershell
# Installa dipendenze Node.js
npm install

# Verifica che tutte le dipendenze siano installate
npm list
```

## 🗄️ Configurazione Database

### 1. Creare Database
```powershell
# Connettiti a SQL Server usando sqlcmd
sqlcmd -S localhost\SQLEXPRESS -E

# Oppure se hai un'istanza diversa:
sqlcmd -S localhost -E

# Nel prompt SQL, esegui:
# CREATE DATABASE homepromise;
# GO
# USE homepromise;
# GO
```

### 2. Eseguire Script Database
```powershell
# Esegui lo script SQL per creare tabelle e dati di esempio
sqlcmd -S localhost\SQLEXPRESS -E -d homepromise -i "supabase\migrations\20250714144740_little_reef.sql"

# Se hai un'istanza diversa:
sqlcmd -S localhost -E -d homepromise -i "supabase\migrations\20250714144740_little_reef.sql"
```

### 3. Configurare File .env
```powershell
# Crea file .env nella root del progetto
New-Item -ItemType File -Path ".env" -Force

# Aggiungi configurazione database (modifica secondo la tua configurazione):
@"
DB_SERVER=localhost\SQLEXPRESS
DB_DATABASE=homepromise
DB_USER=
DB_PASSWORD=
DB_PORT=1433
DB_ENCRYPT=false
DB_TRUST_CERT=true
"@ | Out-File -FilePath ".env" -Encoding UTF8
```

## 🚀 Avvio Applicazione

### 1. Avviare Backend (Terminal 1)
```powershell
# Apri primo terminale PowerShell
Set-Location "C:\TasksManager"

# Avvia server backend
node server/server.cjs

# Il server dovrebbe avviarsi su porta 3002
# Dovresti vedere: "🚀 Server avviato su porta 3002"
```

### 2. Avviare Frontend (Terminal 2)
```powershell
# Apri secondo terminale PowerShell
Set-Location "C:\TasksManager"

# Avvia server di sviluppo frontend
npm run dev

# Il frontend dovrebbe avviarsi su porta 5173
# Dovresti vedere: "Local: http://localhost:5173/"
```

### 3. Accedere all'Applicazione
```powershell
# Apri browser e vai a:
Start-Process "http://localhost:5173"
```

## 🔧 Comandi Utili

### Verificare Stato Servizi
```powershell
# Verifica processi Node.js attivi
Get-Process -Name "node" -ErrorAction SilentlyContinue

# Verifica porte in uso
netstat -an | Select-String ":3002"
netstat -an | Select-String ":5173"
```

### Fermare Servizi
```powershell
# Ferma tutti i processi Node.js
Get-Process -Name "node" | Stop-Process -Force

# Oppure usa Ctrl+C nei terminali attivi
```

### Riavviare Applicazione
```powershell
# Script per riavvio completo
function Restart-TasksManager {
    # Ferma processi esistenti
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    
    # Attendi un momento
    Start-Sleep -Seconds 2
    
    # Avvia backend in background
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'C:\TasksManager'; node server/server.cjs"
    
    # Attendi che il backend si avvii
    Start-Sleep -Seconds 3
    
    # Avvia frontend
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'C:\TasksManager'; npm run dev"
}

# Usa la funzione:
Restart-TasksManager
```

## 🛠️ Troubleshooting

### Problemi Comuni

#### 1. Errore Connessione Database
```powershell
# Verifica servizio SQL Server
Get-Service -Name "*SQL*" | Where-Object {$_.Status -eq "Running"}

# Avvia SQL Server se non attivo
Start-Service -Name "MSSQL$SQLEXPRESS"
```

#### 2. Porta già in uso
```powershell
# Trova processo che usa la porta 3002
netstat -ano | Select-String ":3002"

# Termina processo (sostituisci PID con il numero trovato)
Stop-Process -Id <PID> -Force
```

#### 3. Permessi File
```powershell
# Dai permessi completi alla directory
icacls "C:\TasksManager" /grant Everyone:F /T
```

#### 4. Reinstallare Dipendenze
```powershell
# Pulisci cache npm e reinstalla
Remove-Item -Recurse -Force "node_modules"
Remove-Item -Force "package-lock.json"
npm cache clean --force
npm install
```

## 📦 Build per Produzione

### 1. Build Frontend
```powershell
# Crea build di produzione
npm run build

# I file saranno in /dist
```

### 2. Servire in Produzione
```powershell
# Il server Express servirà automaticamente i file da /dist
# Assicurati che il backend punti alla directory corretta
node server/server.cjs
```

## 🔒 Configurazione Sicurezza

### 1. Firewall Windows
```powershell
# Apri porte necessarie (solo se serve accesso esterno)
New-NetFirewallRule -DisplayName "License Manager Backend" -Direction Inbound -Protocol TCP -LocalPort 3002 -Action Allow
New-NetFirewallRule -DisplayName "License Manager Frontend" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow
```

### 2. Configurazione SQL Server
```powershell
# Abilita autenticazione mista se necessario
# Questo va fatto tramite SQL Server Configuration Manager
```

## 📝 Note Importanti

1. **Backup Database**: Esegui backup regolari del database `homepromise`
2. **Log Files**: I log dell'applicazione appariranno nei terminali
3. **Aggiornamenti**: Per aggiornare l'app, ferma i servizi, aggiorna il codice e riavvia
4. **Monitoraggio**: Controlla regolarmente i processi Node.js per assicurarti che siano attivi

## 🆘 Supporto

Se incontri problemi:
1. Verifica che tutti i prerequisiti siano installati
2. Controlla i log nei terminali per errori specifici
3. Verifica la connessione al database
4. Assicurati che le porte 3002 e 5173 siano libere