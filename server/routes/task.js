const express = require("express");
const router = express.Router();
const Software = require("../models/Software");
const Task = require("../models/Task");
const Allegato = require("../models/Allegato");

// GET /api - Recupera tutti i task
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.getAll();
    
    // Trasforma i task per compatibilità con il frontend
    const transformedTasks = tasks.map(task => ({
      ...task,
      utenti: task.utenti ? task.utenti.split(', ').map(u => u.trim()) : undefined
    }));
    
    res.json(transformedTasks);
  } catch (error) {
    console.error("Errore nel recupero task:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/task/:id - Recupera un task specifico
router.get("/:id", async (req, res) => {
  try {
    const task = await Task.getById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task non trovato" });
    }
    
    // Trasforma il task per compatibilità con il frontend
    const transformedTask = {
      ...task,
      utenti: task.utenti ? task.utenti.split(', ').map(u => u.trim()) : undefined
    };
    
    res.json(transformedTask);
  } catch (error) {
    console.error("Errore nel recupero task:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/task - Crea un nuovo task
router.post("/", async (req, res) => {
  try {
    const operatore = req.headers["x-username"] || "Unknown";
    const {
      codiceTask,
      rifTicket,
      descrizione,
      dataSegnalazione,
      dataScadenza,
      stato,
      software,
      progetto,
      ordine,
      utente,
      utenti, // Array di utenti per multi-assegnazione
      clienti,
      priorità,
      oreStimate
    } = req.body;

    if (!codiceTask) {
      return res.status(400).json({ error: "Codice Task è obbligatorio" });
    }

    // Valida che ci sia almeno un utente assegnato
    if (!utente && (!utenti || utenti.length === 0)) {
      return res.status(400).json({ error: "È necessario assegnare almeno un utente" });
    }

    const nuovoTask = await Task.create({
      codiceTask,
      rifTicket: rifTicket || null,
      descrizione: descrizione || null,
      dataSegnalazione: dataSegnalazione || null,
      dataScadenza: dataScadenza || null,
      stato: stato || null,
      software: software || null,
      progetto: progetto || null,
      ordine: ordine || null,
      utente: utente || (utenti && utenti.length > 0 ? utenti[0] : null),
      utenti: utenti || null, // Passa l'array così come è
      clienti: clienti || null,
      priorità: priorità || null,
      createdByUsername: operatore,
      oreStimate: oreStimate || 0
    });

    // Trasforma la risposta per il frontend
    const transformedTask = {
      ...nuovoTask,
      utenti: nuovoTask.utenti ? nuovoTask.utenti.split(', ').map(u => u.trim()) : undefined
    };

    res.status(201).json(transformedTask);
  } catch (error) {
    console.error("Errore nella creazione task:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/task/:id - Aggiorna un task
router.put("/:id", async (req, res) => {
  try {
    const operatore = req.headers["x-username"] || "Unknown";
    const {
      codiceTask,
      rifTicket,
      descrizione,
      dataSegnalazione,
      dataScadenza,
      stato,
      software,
      progetto,
      ordine,
      utente,
      utenti, // Array di utenti per multi-assegnazione
      clienti,
      priorità,
      oreStimate
    } = req.body;

    // Valida che ci sia almeno un utente assegnato
    if (!utente && (!utenti || utenti.length === 0)) {
      return res.status(400).json({ error: "È necessario assegnare almeno un utente" });
    }

    const taskAggiornato = await Task.update(
      req.params.id,
      {
        codiceTask,
        rifTicket,
        descrizione,
        dataSegnalazione,
        dataScadenza,
        stato,
        software,
        progetto,
        ordine,
        utente: utente || (utenti && utenti.length > 0 ? utenti[0] : null),
        utenti: utenti || null,
        clienti,
        priorità,
        oreStimate,
      },
      operatore
    );

    // Trasforma la risposta per il frontend
    const transformedTask = {
      ...taskAggiornato,
      utenti: taskAggiornato.utenti ? taskAggiornato.utenti.split(', ').map(u => u.trim()) : undefined
    };

    res.json(transformedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/task/:id
router.delete("/:id", async (req, res) => {
  try {
    const operatore = req.headers["x-username"] || "Unknown";
    await Task.delete(req.params.id, operatore);
    res.json({ message: "Task eliminato con successo" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/task/:id/allegati - Recupera allegati per un task
router.get("/:id/allegati", async (req, res) => {
  try {
    const allegati = await Allegato.getByTaskId(req.params.id);
    res.json(allegati);
  } catch (error) {
    console.error("Errore nel recupero allegati:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;