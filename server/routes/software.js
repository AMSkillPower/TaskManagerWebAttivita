const express = require("express");
const router = express.Router();
const Software = require("../models/Software");

router.get("/", async (req, res) => {
  const software = await Software.getAll();
  res.json(software);
});

// GET /api/software/:id - Recupera un software specifico
router.get("/:id", async (req, res) => {
  try {
    const software = await Software.getById(req.params.id);
    if (!software) {
      return res.status(404).json({ error: "Software non trovato" });
    }
    res.json(software);
  } catch (error) {
    console.error("Errore nel recupero software:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/software - Crea un nuovo software
router.post("/", async (req, res) => {
  try {
    const { nomeSoftware, logo } = req.body;

    if (!nomeSoftware) {
      return res.status(400).json({ error: "Nome Software è obbligatorio" });
    }

    const nuovoSoftware = await Software.create({
      nomeSoftware,
      logo: logo || null,
    });

    res.status(201).json(nuovoSoftware);
  } catch (error) {
    console.error("Errore nella creazione software:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/software/:id - Aggiorna un software
router.put("/:id", async (req, res) => {
  try {
    const { nomeSoftware, logo } = req.body;

    if (!nomeSoftware) {
      return res.status(400).json({ error: "Nome Software è obbligatorio" });
    }
    const softwareAggiornato = await Software.update(req.params.id, {
      nomeSoftware,
      logo: logo || null,
    });

    if (!softwareAggiornato) {
      return res.status(404).json({ error: "Software non trovato" });
    }

    res.json(softwareAggiornato);
  } catch (error) {
    console.error("Errore nell'aggiornamento software:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/software/:id - Elimina un software
router.delete("/:id", async (req, res) => {
  try {
    await Software.delete(req.params.id);
    res.json({ message: "Software eliminato con successo" });
  } catch (error) {
    console.error("Errore nell'eliminazione software:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
