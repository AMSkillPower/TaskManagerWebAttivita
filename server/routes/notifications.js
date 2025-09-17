const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

// GET /api/notifications - Recupera notifiche dell'utente corrente
router.get("/", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ error: "User ID richiesto" });
    }

    const includeRead = req.query.includeRead === "true";
    const notifications = await Notification.getByUserId(
      parseInt(userId),
      includeRead
    );
    res.json(notifications);
  } catch (error) {
    console.error("Errore nel recupero notifiche:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/notifications/count - Recupera conteggio notifiche non lette
router.get("/count", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ error: "User ID richiesto" });
    }

    const count = await Notification.getUnreadCount(parseInt(userId));
    res.json({ count });
  } catch (error) {
    console.error("Errore nel conteggio notifiche:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/notifications/:id/read - Marca notifica come letta
router.put("/:id/read", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ error: "User ID richiesto" });
    }

    const success = await Notification.markAsRead(
      parseInt(req.params.id),
      parseInt(userId)
    );
    if (success) {
      res.json({ message: "Notifica marcata come letta" });
    } else {
      res.status(404).json({ error: "Notifica non trovata" });
    }
  } catch (error) {
    console.error("Errore nell'aggiornamento notifica:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/notifications/read-all - Marca tutte le notifiche come lette
router.put("/read-all", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ error: "User ID richiesto" });
    }

    const count = await Notification.markAllAsRead(parseInt(userId));
    res.json({ message: `${count} notifiche marcate come lette` });
  } catch (error) {
    console.error("Errore nell'aggiornamento notifiche:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/notifications/:id - Elimina notifica
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ error: "User ID richiesto" });
    }

    const success = await Notification.delete(
      parseInt(req.params.id),
      parseInt(userId)
    );
    if (success) {
      res.json({ message: "Notifica eliminata" });
    } else {
      res.status(404).json({ error: "Notifica non trovata" });
    }
  } catch (error) {
    console.error("Errore nell'eliminazione notifica:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
