const express = require("express");
const router = express.Router();
const User = require("../models/User");

// POST /api/auth/login - Login utente
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username e password sono obbligatori" });
    }

    // Trova l'utente per username
    const user = await User.getByUsername(username);
    if (!user) {
      return res.status(401).json({ error: "Credenziali non valide" });
    }

    // Verifica la password
    const isValidPassword = await User.validatePassword(
      password,
      user.password
    );
    if (!isValidPassword) {
      return res.status(401).json({ error: "Credenziali non valide" });
    }

    // Rimuovi la password dalla risposta
    const { password: _, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Errore durante il login:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/users - Recupera tutti gli utenti
router.get("/users", async (req, res) => {
  try {
    const users = await User.getAllIncludingInactive();
    res.json(users);
  } catch (error) {
    console.error("Errore nel recupero utenti:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/users/:id - Recupera un utente specifico
router.get("/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const user = await User.getById(id);
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    res.json(user);
  } catch (error) {
    console.error("Errore nel recupero utente:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/users - Crea un nuovo utente
router.post("/users", async (req, res) => {
  try {
    const { username, password, role, fullName, email, isActive } = req.body;

    if (!username || !password || !fullName) {
      return res
        .status(400)
        .json({ error: "Username, password e nome completo sono obbligatori" });
    }

    const newUser = await User.create({
      username,
      password,
      role: role || "User",
      fullName,
      email,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Errore nella creazione utente:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/auth/users/:id - Aggiorna un utente
router.put("/users/:id", async (req, res) => {
  try {
    const { fullName, email, role, password, isActive } = req.body;

    if (!fullName) {
      return res.status(400).json({ error: "Nome completo è obbligatorio" });
    }

    //console.log('Updating user with id:', req.params.id, 'body:', req.body);
    const id = Number(req.params.id);
    const updatedUser = await User.update(id, {
      fullName,
      email,
      role,
      password,
      isActive: isActive !== undefined ? isActive : true,
    });

    if (!updatedUser) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Errore nell'aggiornamento utente:", error);
    res.status(500).json({ error: error.message });
  }
});
// DELETE /api/auth/users/:id - Elimina un utente
router.delete("/users/:id", async (req, res) => {
  try {
    await User.delete(req.params.id);
    res.json({ message: "Utente eliminato con successo" });
  } catch (error) {
    console.error("Errore nell'eliminazione utente:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
