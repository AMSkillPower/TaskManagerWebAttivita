const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER || 'localhost\\SQLEXPRESS',
  database: process.env.DB_DATABASE || 'homepromise',
  user: process.env.DB_USER || undefined,
  password: process.env.DB_PASSWORD || undefined,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true' || false,
    trustServerCertificate: process.env.DB_TRUST_CERT !== 'false' || true,
    enableArithAbort: true,
    requestTimeout: 30000,
    connectionTimeout: 30000,
    // Per Windows Authentication
    trustedConnection: !process.env.DB_USER
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

const licenseConfig = {
  server: process.env.DB_SERVER,
  database: process.env.LICENSE_DB_DATABASE || 'skpw_LicenseManager',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
    enableArithAbort: true,
    readOnlyIntent: true // Importante: indica che è solo per letture
  }
};

let poolPromise;
const getPool = () => {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config)
      .connect()
      .then(pool => {
        console.log('✅ Connesso a SQL Server');
        console.log(`📊 Database: ${config.database}`);
        console.log(`🖥️  Server: ${config.server}`);
        console.log(`👤 Auth: ${config.user ? 'SQL Server' : 'Windows'}`);
        return pool;
      })
      .catch(err => {
        console.error('❌ Errore connessione database:', err);
        console.error('🔧 Configurazione:', {
          server: config.server,
          database: config.database,
          user: config.user || 'Windows Authentication', 
          port: config.port
        });
        console.error('💡 Suggerimenti:');
        console.error('   - Verifica che SQL Server sia in esecuzione');
        console.error('   - Controlla il nome del server/istanza');
        console.error('   - Verifica le credenziali nel file .env');
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
};

// Test connessione all'avvio
const testConnection = async () => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT 1 as test');
    console.log('🔍 Test connessione database: OK');
  } catch (error) {
    console.error('🔍 Test connessione database: FALLITO', error.message);
  }
};

let licensePoolPromise;
const getLicensePool = async () => {
  if (!licensePoolPromise) {
    licensePoolPromise = await new sql.ConnectionPool(licenseConfig).connect();
    console.log('✅ Connesso al database LicenseManager (solo lettura)');
  }
  return licensePoolPromise;
};


// Esegui test connessione
testConnection();

module.exports = {
  sql,
  getPool,
  getLicensePool
};