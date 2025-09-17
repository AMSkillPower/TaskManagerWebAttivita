const { sql, getPool } = require("../config/database");
class User {
  static async getAll() {
    try {
      const pool = await getPool();
      const result = await pool.request().query(`
        SELECT id, username, role, fullName, email, isActive, createdAt, updatedAt
        FROM Users
        WHERE isActive = 1
        ORDER BY fullName
      `);
      return result.recordset;
    } catch (error) {
      throw new Error(`Errore nel recupero utenti: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const pool = await getPool();
      const result = await pool.request().input("id", sql.Int, id).query(`
          SELECT id, username, role, fullName, email, isActive, createdAt, updatedAt
          FROM Users
          WHERE id = @id
        `); /* AND isActive = 1 */
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Errore nel recupero utente: ${error.message}`);
    }
  }

  static async getByUsername(username) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input("username", sql.NVarChar(50), username).query(`
          SELECT id, username, password, role, fullName, email, isActive, createdAt, updatedAt
          FROM Users
          WHERE username = @username AND isActive = 1
        `);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Errore nel recupero utente: ${error.message}`);
    }
  }

  static async create(userData) {
    try {
      const pool = await getPool();

      const result = await pool
        .request()
        .input("username", sql.NVarChar(50), userData.username)
        .input("password", sql.NVarChar(255), userData.password)
        .input("role", sql.NVarChar(10), userData.role || "User")
        .input("fullName", sql.NVarChar(100), userData.fullName)
        .input("email", sql.NVarChar(255), userData.email).query(`
          INSERT INTO Users (username, password, role, fullName, email)
          OUTPUT INSERTED.id, INSERTED.username, INSERTED.role, INSERTED.fullName, 
                 INSERTED.email, INSERTED.isActive, INSERTED.createdAt, INSERTED.updatedAt
          VALUES (@username, @password, @role, @fullName, @email)
        `);
      return result.recordset[0];
    } catch (error) {
      if (error.number === 2627) {
        // Unique constraint violation
        throw new Error("Username già esistente");
      }
      throw new Error(`Errore nella creazione utente: ${error.message}`);
    }
  }

  static async update(id, userData) {
    try {
      const pool = await getPool();

      let query = `
        UPDATE Users
        SET fullName = @fullName,
            email = @email,
            role = @role,
            isActive = @isActive,
            updatedAt = GETDATE()
        WHERE id = @id
      `;

      const request = pool
        .request()
        .input("id", sql.Int, id)
        .input("fullName", sql.NVarChar(100), userData.fullName)
        .input("role", sql.NVarChar(10), userData.role)
        .input("isActive", sql.Bit, userData.isActive ? 1 : 0)
        .input("email", sql.NVarChar(255), userData.email ?? null);

      if (userData.password) {
        query = `
          UPDATE Users
          SET fullName = @fullName,
              email = @email,
              role = @role,
              isActive = @isActive,
              password = @password,
              updatedAt = GETDATE()
          WHERE id = @id
        `;
        request.input("password", sql.NVarChar(255), userData.password);
      }

      const result = await request.query(query);
      console.log("Righe aggiornate:", result.rowsAffected[0]);
      if (result.rowsAffected[0] === 0) {
        throw new Error(`Nessun utente trovato con id ${id}`);
      }

      return await this.getById(id);
    } catch (error) {
      throw new Error(`Errore nell'aggiornamento utente: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const pool = await getPool();
      // Soft delete - imposta isActive a false
      await pool
        .request()
        .input("id", sql.Int, id)
        .query(
          "UPDATE Users SET isActive = 0, updatedAt = GETDATE() WHERE id = @id"
        );
      return true;
    } catch (error) {
      throw new Error(`Errore nell'eliminazione utente: ${error.message}`);
    }
  }

  // Metodo per ottenere tutti gli utenti inclusi quelli disattivati (per admin)
  static async getAllIncludingInactive() {
    try {
      const pool = await getPool();
      const result = await pool.request().query(`
        SELECT id, username, role, fullName, email, isActive, createdAt, updatedAt
        FROM Users
        ORDER BY fullName
      `);
      return result.recordset;
    } catch (error) {
      throw new Error(`Errore nel recupero utenti: ${error.message}`);
    }
  }
  static async validatePassword(plainPassword, hashedPassword) {
    try {
      let valide = false;
      if (plainPassword == hashedPassword) {
        valide = true;
      }

      return valide;

      return await bcrypt.compare(plainPassword, hashedPassword);
      bool;
    } catch (error) {
      throw new Error(`Errore nella validazione password: ${error.message}`);
    }
  }
}

module.exports = User;
