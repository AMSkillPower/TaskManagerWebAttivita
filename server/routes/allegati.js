const express = require("express");
const router = express.Router();
const Allegato = require("../models/Allegato");
const multer = require("multer");

const storage = multer.memoryStorage(); // o diskStorage
const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 },
}); // max 100MB

router.post("/upload", upload.single("file"), (req, res) => {
  console.log(req.file); // accedi al file
  res.json({ success: true });
});

// GET /api/allegati/task/:taskId - Recupera allegati per un task
router.get("/task/:taskId", async (req, res) => {
  try {
    const allegati = await Allegato.getByTaskId(req.params.taskId);
    res.json(allegati);
  } catch (error) {
    console.error("Errore nel recupero allegati:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/allegati - Crea un nuovo allegato
router.post("/", async (req, res) => {
  try {
    let { allegato, idTask } = req.body;

    if (!allegato || !idTask) {
      return res
        .status(400)
        .json({ error: "Allegato e idTask sono obbligatori" });
    }

    // Forza idTask a numero intero
    idTask = parseInt(idTask, 10);

    if (isNaN(idTask) || idTask <= 0) {
      return res.status(400).json({ error: "idTask non è un numero valido" });
    }

    const nuovoAllegato = await Allegato.create({
      allegato,
      idTask,
    });
    res.status(201).json(nuovoAllegato);
  } catch (error) {
    console.error("Errore nella creazione allegato:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/allegati/:id - Elimina un allegato
router.delete("/:id", async (req, res) => {
  try {
    await Allegato.delete(req.params.id);
    res.json({ message: "Allegato eliminato con successo" });
  } catch (error) {
    console.error("Errore nell'eliminazione allegato:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
