const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Import database connection
require("./server");
s;
// Import routes
const taskRoutes = require("./routes/task");
const softwareRoutes = require("./routes/software");
const clientiRoutes = require("./routes/clienti");
const allegatiRoutes = require("./routes/allegati");
const authRoutes = require("./routes/auth");
const usersRouter = require("./routes/users");
const taskLogsRoutes = require("./routes/taskLogs");
const notificationsRoutes = require("./routes/notifications");
const commentsRoutes = require("./routes/comments");


const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// API Routes
app.use("/api/task", taskRoutes);
app.use("/api/software", softwareRoutes);
app.use("/api/clienti", clientiRoutes);
app.use("/api/allegati", allegatiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRouter);
app.use("/api/task-logs", taskLogsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/comments", commentsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({
    error: "Errore interno del server",
    message:
      process.env.NODE_ENV === "development" ? err.message : "Errore interno",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Endpoint non trovato" });
});

app.get("/api/test-clienti", async (req, res) => {
  try {
    const pool = await getLicensePool();
    const result = await pool
      .request()
      .query("SELECT TOP 5 id, ragioneSociale FROM Clienti");

    res.json({
      success: true,
      database: pool.config.database,
      clienti: result.recordset,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

// Start server
app.listen(3002, () => {
  console.log(`🚀 Server avviato su porta ${PORT}`);
  console.log(`📡 API disponibile su http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
