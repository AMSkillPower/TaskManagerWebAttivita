const express = require("express");
const router = express.Router();
const Comment = require("../models/Comment");

// GET /api/comments/task/:taskId - Recupera commenti per un task
router.get("/task/:taskId", async (req, res) => {
  try {
    const comments = await Comment.getByTaskId(parseInt(req.params.taskId));
    res.json(comments);
  } catch (error) {
    console.error("Errore nel recupero commenti:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/comments/:id - Recupera un commento specifico
router.get("/:id", async (req, res) => {
  try {
    const comment = await Comment.getById(parseInt(req.params.id));
    if (!comment) {
      return res.status(404).json({ error: "Commento non trovato" });
    }
    res.json(comment);
  } catch (error) {
    console.error("Errore nel recupero commento:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/comments - Crea un nuovo commento
router.post("/", async (req, res) => {
  try {
    const operatore = req.headers["x-username"] || "Unknown";
    const { commento, idTask, oreDedicate } = req.body;
     console.log("📦 Ricevuto body:", req.body);

    if (!commento || !idTask) {
      return res.status(400).json({ error: "Commento e idTask sono obbligatori" });
    }

    const nuovoCommento = await Comment.create({
      commento,
      utente: operatore,
      idTask: parseInt(idTask),
      oreDedicate: parseFloat(oreDedicate) || 0,
      dataInizio: req.body.dataInizio,
      dataFine: req.body.dataFine
    });

    res.status(201).json(nuovoCommento);
  } catch (error) {
    console.error("Errore nella creazione commento:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/comments/:id - Aggiorna un commento
router.put("/:id", async (req, res) => {
  try {
    const operatore = req.headers["x-username"] || "Unknown";
    const { commento, oreDedicate } = req.body;

    if (!commento) {
      return res.status(400).json({ error: "Commento è obbligatorio" });
    }

    // Verifica che l'utente possa modificare il commento
    const existingComment = await Comment.getById(parseInt(req.params.id));
    if (!existingComment) {
      return res.status(404).json({ error: "Commento non trovato" });
    }

    if (existingComment.utente !== operatore) {
      return res.status(403).json({ error: "Non puoi modificare commenti di altri utenti" });
    }

    const commentoAggiornato = await Comment.update(parseInt(req.params.id), {
      commento,
      oreDedicate: parseFloat(oreDedicate) || 0,
    });

    res.json(commentoAggiornato);
  } catch (error) {
    console.error("Errore nell'aggiornamento commento:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/comments/:id - Elimina un commento
router.delete("/:id", async (req, res) => {
  try {
    const operatore = req.headers["x-username"] || "Unknown";

    // Verifica che l'utente possa eliminare il commento
    const existingComment = await Comment.getById(parseInt(req.params.id));
    if (!existingComment) {
      return res.status(404).json({ error: "Commento non trovato" });
    }

    if (existingComment.utente !== operatore) {
      return res.status(403).json({ error: "Non puoi eliminare commenti di altri utenti" });
    }

    const deleted = await Comment.delete(parseInt(req.params.id));
    if (deleted) {
      res.json({ message: "Commento eliminato con successo" });
    } else {
      res.status(404).json({ error: "Commento non trovato" });
    }
  } catch (error) {
    console.error("Errore nell'eliminazione commento:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/comments/task/:taskId/hours - Recupera ore totali per un task
router.get("/task/:taskId/hours", async (req, res) => {
  try {
    const totalHours = await Comment.getTotalHoursByTask(parseInt(req.params.taskId));
    res.json({ totalHours });
  } catch (error) {
    console.error("Errore nel calcolo ore totali:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/comments/user/:utente - Recupera commenti per utente
router.get("/user/:utente", async (req, res) => {
  try {
    const comments = await Comment.getCommentsByUser(req.params.utente);
    res.json(comments);
  } catch (error) {
    console.error("Errore nel recupero commenti utente:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;