const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const sql = require("mssql");

const { getPool, getLicensePool } = require("./config/database");

// Middleware
app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// Rotte
const softwareRoutes = require("./routes/software");
const taskRoutes = require("./routes/task");
const clientiRoutes = require("./routes/clienti");
const allegatiRoutes = require("./routes/allegati");
const authRoutes = require("./routes/auth");
const usersRouter = require("./routes/users");
const taskLogsRoutes = require("./routes/taskLogs");
const notificationsRoutes = require("./routes/notifications");
const commentsRoutes = require("./routes/comments");

app.use("/api/users", usersRouter);
app.use("/api/auth", authRoutes);
app.use("/api/allegati", allegatiRoutes);
app.use("/api/software", softwareRoutes);
app.use("/api/task", taskRoutes);
app.use("/api/clienti", clientiRoutes);
app.use("/api/task-logs", taskLogsRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/notifications", notificationsRoutes);

// Frontend
const frontendPath = path.join(__dirname, "..", "dist");
const notificationsRouter = require("./routes/notifications");
app.use("/api/notifications", notificationsRouter); // ✅ prima del catch-all della SPA

app.use(express.static(frontendPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Rotta di test
app.get("/", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT TOP 1 * FROM Task");
    res.json(result.recordset);
  } catch (err) {
    console.error("Errore nella query:", err);
    res.status(500).send("Errore nel server");
  }
});

// POST software
app.post("/api/software", async (req, res) => {
  try {
    const { nome, logo } = req.body;

    if (!nome || !logo) {
      console.log("📦 Ricevuto nel body:", req.body);
      return res.status(400).json({ message: "Dati incompleti" });
    }

    const pool = await getPool();
    await pool
      .request()
      .input("nomeSoftware", sql.VarChar, nome)
      .input("logo", sql.VarChar, logo).query(`
        INSERT INTO Software (nomeSoftware, logo)
        VALUES (@nomeSoftware, @logo)
      `);

    res.status(201).json({ message: "Software registrato correttamente" });
  } catch (err) {
    console.error("❌ Errore durante POST /api/software:", err.message);
    res.status(500).send("Errore nel salvataggio del software");
  }
});

// Avvio server e preload database
const PORT = process.env.PORT || 3002;

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`🚀 Server in ascolto su http://0.0.0.0:${PORT}`);

  try {
    // Preload pool principale
    await getPool();
    console.log("✅ Connessione al database principale pronta all'avvio");
  } catch (err) {
    console.error(
      "❌ Impossibile connettersi al database principale all'avvio:",
      err.message
    );
  }

  try {
    // Preload pool LicenseManager
    await getLicensePool();
    console.log("✅ Connessione al database LicenseManager pronta all'avvio");
  } catch (err) {
    console.error(
      "❌ Impossibile connettersi al database LicenseManager all'avvio:",
      err.message
    );
  }
});
