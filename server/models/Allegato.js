const { sql, getPool } = require("../config/database");

class Allegato {
  static async getByTaskId(taskId) {
    try {
      const pool = await getPool();
      const result = await pool.request().input("taskId", sql.Int, taskId)
        .query(`
          SELECT id, allegato, idTask
          FROM Allegati
          WHERE idTask = @taskId
          ORDER BY id DESC
        `);
      return result.recordset;
    } catch (error) {
      throw new Error(`Errore nel recupero allegati: ${error.message}`);
    }
  }

  static async create(allegatoData) {
    try {
      const pool = await getPool();
      const allegato =
        typeof allegatoData.allegato === "string"
          ? allegatoData.allegato
          : String(allegatoData.allegato);
      const idTask =
        typeof allegatoData.idTask === "number"
          ? allegatoData.idTask
          : Number(allegatoData.idTask);
      const result = await pool
        .request()
        .input("allegato", sql.NVarChar(), allegato)
        .input("idTask", sql.Int, idTask).query(`
          INSERT INTO Allegati (allegato, idTask)
          OUTPUT INSERTED.*
          VALUES (@allegato, @idTask)
        `);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Errore nella creazione allegato: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const pool = await getPool();
      await pool
        .request()
        .input("id", sql.Int, id)
        .query("DELETE FROM Allegati WHERE id = @id");
      return true;
    } catch (error) {
      throw new Error(`Errore nell'eliminazione allegato: ${error.message}`);
    }
  }
}

module.exports = Allegato;
