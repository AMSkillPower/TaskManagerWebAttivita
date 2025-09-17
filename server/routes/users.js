const express = require("express");
const router = express.Router();
const User = require("../models/User");

// GET tutti gli utenti attivi
router.get("/", async (req, res) => {
  try {
    const users = await User.getAll(); // ✅ usa getAll invece di findAll
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET utente per ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST crea nuovo utente
router.post("/", async (req, res) => {
  try {
    const newUser = await User.create(req.body);
    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT aggiorna utente
router.put("/:id", async (req, res) => {
  try {
    const updated = await User.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE disattiva utente
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await User.delete(req.params.id);
    res.json({ success: deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
