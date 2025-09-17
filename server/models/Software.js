const { sql, getPool } = require("../config/database");

class Software {
  static async getAll() {
    try {
      const pool = await getPool();
      const result = await pool.request().query(`
        SELECT id, nomeSoftware, logo
        FROM Software 
        ORDER BY nomeSoftware
      `);
      return result.recordset;
    } catch (error) {
      throw new Error(`Errore nel recupero software: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const pool = await getPool();
      const result = await pool.request().input("id", sql.Int, id).query(`
          SELECT id, nomeSoftware, logo
          FROM Software 
          WHERE id = @id
        `);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Errore nel recupero software: ${error.message}`);
    }
  }

  static async create(softwareData) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input("nomeSoftware", sql.NVarChar, softwareData.nomeSoftware)
        .input("logo", sql.NVarChar(sql.MAX), softwareData.logo).query(`
          INSERT INTO Software (nomeSoftware, logo)
          OUTPUT INSERTED.id, INSERTED.nomeSoftware, INSERTED.logo
          VALUES (@nomeSoftware, @logo)
        `);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Errore nella creazione software: ${error.message}`);
    }
  }

  static async update(id, softwareData) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input("id", sql.Int, id)
        .input("nomeSoftware", sql.NVarChar, softwareData.nomeSoftware)
        .input("logo", sql.NVarChar(sql.MAX), softwareData.logo).query(`
          UPDATE Software 
          SET nomeSoftware = @nomeSoftware, logo = @logo
          WHERE id = @id
        `);
      const getResult = await pool
        .request()
        .input("id", sql.Int, id)
        .query("SELECT * FROM Software WHERE id = @id");
      return getResult.recordset[0];
    } catch (error) {
      throw new Error(`Errore nell'aggiornamento software: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const pool = await getPool();
      await pool
        .request()
        .input("id", sql.Int, id)
        .query("DELETE FROM Software WHERE id = @id");
      return true;
    } catch (error) {
      throw new Error(`Errore nell'eliminazione software: ${error.message}`);
    }
  }
}

module.exports = Software;
