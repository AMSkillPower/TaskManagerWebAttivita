const { sql, getPool } = require("../config/database");

class Comment {
  static async getByTaskId(taskId) {
    try {
      const pool = await getPool();
      const result = await pool.request().input("taskId", sql.Int, taskId)
        .query(`
          SELECT id, commento, utente, idTask, datetime, oreDedicate, dataInizio, dataFine
          FROM Commenti
          WHERE idTask = @taskId
          ORDER BY datetime DESC
        `);
      return result.recordset;
    } catch (error) {
      throw new Error(`Errore nel recupero commenti: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const pool = await getPool();
      const result = await pool.request().input("id", sql.Int, id).query(`
          SELECT id, commento, utente, idTask, datetime, oreDedicate, dataInizio, dataFine
          FROM Commenti
          WHERE id = @id
        `);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Errore nel recupero commento: ${error.message}`);
    }
  }

  static async create(commentData) {
    try {
      const pool = await getPool();
      console.log(commentData.dataInizio);
      console.log(commentData.dataFine);
      console.log(typeof commentData.dataInizio);
      const result = await pool
      .request()
      .input("commento", sql.NVarChar(4000), commentData.commento)
      .input("utente", sql.NVarChar(50), commentData.utente)
      .input("idTask", sql.Int, commentData.idTask)
      .input("oreDedicate", sql.Decimal(5, 2), commentData.oreDedicate || 0)
      .input(
        "dataInizio",
        sql.DateTime2(7), // Specifica la precisione
        commentData.dataInizio ? commentData.dataInizio : null
      )
      .input(
        "dataFine",
        sql.DateTime2(7), // Specifica la precisione
        commentData.dataFine ? commentData.dataFine : null
      ).query(`
      INSERT INTO Commenti (commento, utente, idTask, oreDedicate, dataInizio, dataFine)
      OUTPUT INSERTED.*
      VALUES (@commento, @utente, @idTask, @oreDedicate, @dataInizio, @dataFine)
    `);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Errore nella creazione commento: ${error.message}`);
    }
  }

  static async update(id, commentData) {
    try {
      const pool = await getPool();
       const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("commento", sql.NVarChar(4000), commentData.commento)
      .input("oreDedicate", sql.Decimal(5, 2), commentData.oreDedicate || 0)
      .input(
        "dataInizio",
        sql.DateTime2(7),
        commentData.dataInizio ? commentData.dataInizio : null
      )
      .input(
        "dataFine",
        sql.DateTime2(7),
        commentData.dataFine ? commentData.dataFine : null
      ).query(`
      UPDATE Commenti 
      SET commento = @commento, oreDedicate = @oreDedicate, 
          dataInizio = @dataInizio, dataFine = @dataFine
      WHERE id = @id
    `);

      if (result.rowsAffected[0] === 0) {
        throw new Error("Commento non trovato");
      }

      return await this.getById(id);
    } catch (error) {
      throw new Error(`Errore nell'aggiornamento commento: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input("id", sql.Int, id)
        .query("DELETE FROM Commenti WHERE id = @id");
        

      return result.rowsAffected[0] > 0;
    } catch (error) {
      throw new Error(`Errore nell'eliminazione commento: ${error.message}`);
    }
  }

  static async getTotalHoursByTask(taskId) {
    try {
      const pool = await getPool();
      const result = await pool.request().input("taskId", sql.Int, taskId)
        .query(`
          SELECT ISNULL(SUM(oreDedicate), 0) as totalHours
          FROM Commenti
          WHERE idTask = @taskId
        `);
      return result.recordset[0].totalHours;
    } catch (error) {
      throw new Error(`Errore nel calcolo ore totali: ${error.message}`);
    }
  }

  static async getCommentsByUser(utente) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input("utente", sql.NVarChar(50), utente).query(`
          SELECT c.id, c.commento, c.utente, c.idTask, c.datetime, c.oreDedicate,
                 t.codiceTask, t.descrizione as taskDescrizione, t.dataInizio, t.dataFine
          FROM Commenti c
          INNER JOIN Task t ON c.idTask = t.id
          WHERE c.utente = @utente
          ORDER BY c.datetime DESC
        `);
      return result.recordset;
    } catch (error) {
      throw new Error(`Errore nel recupero commenti utente: ${error.message}`);
    }
  }
}

module.exports = Comment;
