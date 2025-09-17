const express = require("express");
const router = express.Router();
const Task = require("../models/Task");

// GET /api/task-logs - Ottieni tutti i log
router.get("/", async (req, res) => {
  try {
    const logs = await Task.getLogs();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/task-logs/:codiceTask - Ottieni log per task specifico
router.get("/:codiceTask", async (req, res) => {
  try {
    const { codiceTask } = req.params;
    const logs = await Task.getLogs(codiceTask);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/task-logs/user/:utente - Ottieni log per utente
router.get("/user/:utente", async (req, res) => {
  try {
    const { utente } = req.params;
    const logs = await Task.getLogsByUser(utente);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/task-logs - Crea un nuovo log manualmente
router.post("/", async (req, res) => {
  try {
    const operatore = req.headers["x-username"] || "Unknown"; // 👈 prendi username dagli headers
    const { codiceTask, eventLog, utente } = req.body;

    // Validazione dei dati obbligatori
    if (!codiceTask) {
      return res.status(400).json({ error: "codiceTask è obbligatorio" });
    }
    if (!eventLog) {
      return res.status(400).json({ error: "eventLog è obbligatorio" });
    }

    // Usa l'operatore dall'header o quello specificato nel body
    const utenteEffettivo = utente || operatore;

    const nuovoLog = await Task.createLog({
      utente: utenteEffettivo,
      codiceTask: codiceTask,
      eventLog: eventLog,
    });

    res.status(201).json(nuovoLog);
  } catch (error) {
    console.error("Errore nella creazione del log:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
