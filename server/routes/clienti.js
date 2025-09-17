const express = require("express");
const router = express.Router();
const { getLicensePool } = require("../config/database");

router.get("/", async (req, res) => {
  try {
    const pool = await getLicensePool();
    const result = await pool
      .request()
      .query("SELECT id, ragioneSociale FROM Clienti ORDER BY ragioneSociale");

    res.json(result.recordset);
  } catch (err) {
    console.error("Errore nel recupero clienti:", err);
    res.status(500).json({
      error: "Errore nel recupero clienti",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

module.exports = router;
