const { sql, getPool } = require("../config/database");

class Notification {
  static async getByUserId(userId, includeRead = false) {
    try {
      const pool = await getPool();
      let query = `
        SELECT n.id, n.userId, n.taskId, n.type, n.title, n.message, 
               n.isRead, n.createdAt, n.createdBy,
               t.codiceTask, t.descrizione as taskDescrizione,
               u.fullName as createdByName
        FROM Notifications n
        LEFT JOIN Task t ON n.taskId = t.id
        LEFT JOIN Users u ON n.createdBy = u.id
        WHERE n.userId = @userId
      `;

      if (!includeRead) {
        query += " AND n.isRead = 0";
      }

      query += " ORDER BY n.createdAt DESC";

      const result = await pool
        .request()
        .input("userId", sql.Int, userId)
        .query(query);

      return result.recordset;
    } catch (error) {
      throw new Error(`Errore nel recupero notifiche: ${error.message}`);
    }
  }

  static async create(notificationData) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input("userId", sql.Int, notificationData.userId)
        .input("taskId", sql.Int, notificationData.taskId || null)
        .input("type", sql.VarChar(50), notificationData.type)
        .input("title", sql.VarChar(255), notificationData.title)
        .input("message", sql.Text, notificationData.message)
        .input("createdBy", sql.Int, notificationData.createdBy || null).query(`
          INSERT INTO Notifications (userId, taskId, type, title, message, createdBy)
          OUTPUT INSERTED.*
          VALUES (@userId, @taskId, @type, @title, @message, @createdBy)
        `);

      return result.recordset[0];
    } catch (error) {
      throw new Error(`Errore nella creazione notifica: ${error.message}`);
    }
  }

  static async markAsRead(id, userId) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input("id", sql.Int, id)
        .input("userId", sql.Int, userId).query(`
          UPDATE Notifications 
          SET isRead = 1 
          WHERE id = @id AND userId = @userId
        `);

      return result.rowsAffected[0] > 0;
    } catch (error) {
      throw new Error(`Errore nell'aggiornamento notifica: ${error.message}`);
    }
  }

  static async markAllAsRead(userId) {
    try {
      const pool = await getPool();
      const result = await pool.request().input("userId", sql.Int, userId)
        .query(`
          UPDATE Notifications 
          SET isRead = 1 
          WHERE userId = @userId AND isRead = 0
        `);

      return result.rowsAffected[0];
    } catch (error) {
      throw new Error(`Errore nell'aggiornamento notifiche: ${error.message}`);
    }
  }

  static async delete(id, userId) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input("id", sql.Int, id)
        .input("userId", sql.Int, userId)
        .query("DELETE FROM Notifications WHERE id = @id AND userId = @userId");

      return result.rowsAffected[0] > 0;
    } catch (error) {
      throw new Error(`Errore nell'eliminazione notifica: ${error.message}`);
    }
  }

  static async getUnreadCount(userId) {
    try {
      const pool = await getPool();
      const result = await pool.request().input("userId", sql.Int, userId)
        .query(`
          SELECT COUNT(*) as count 
          FROM Notifications 
          WHERE userId = @userId AND isRead = 0
        `);

      return result.recordset[0].count;
    } catch (error) {
      throw new Error(`Errore nel conteggio notifiche: ${error.message}`);
    }
  }

  // Metodo helper per creare notifiche di assegnazione task
  static async createTaskAssignmentNotification(
    taskData,
    assignedUserId,
    createdByUserId
  ) {
    if (!assignedUserId || assignedUserId === createdByUserId) {
      return null; // Non creare notifica se non c'è utente assegnato o se è lo stesso che crea
    }

    try {
      // Ottieni il nome dell'utente che ha creato il task
      const pool = await getPool();
      const userResult = await pool
        .request()
        .input("userId", sql.Int, createdByUserId)
        .query("SELECT fullName FROM Users WHERE id = @userId");

      const creatorName = userResult.recordset[0]?.fullName || "Un utente";

      return await this.create({
        userId: assignedUserId,
        taskId: taskData.id,
        type: "task_assigned",
        title: "Nuovo task assegnato",
        message: `${creatorName} ti ha assegnato il task "${taskData.codiceTask}": ${taskData.descrizione}`,
        createdBy: createdByUserId,
      });
    } catch (error) {
      console.error("Errore nella creazione notifica assegnazione:", error);
      return null;
    }
  }

  // Metodo helper per creare notifiche di aggiornamento task
  static async createTaskUpdateNotification(taskData, updatedByUserId) {
    if (!taskData.createdBy || taskData.createdBy === updatedByUserId) {
      return null; // Non creare notifica se non c'è creatore o se è lo stesso che aggiorna
    }

    try {
      // Ottieni il nome dell'utente che ha aggiornato il task
      const pool = await getPool();
      const userResult = await pool
        .request()
        .input("userId", sql.Int, updatedByUserId)
        .query("SELECT fullName FROM Users WHERE id = @userId");

      const updaterName = userResult.recordset[0]?.fullName || "Un utente";

      return await this.create({
        userId: taskData.createdBy,
        taskId: taskData.id,
        type: "task_updated",
        title: "Task aggiornato",
        message: `${updaterName} ha aggiornato il task "${taskData.codiceTask}"`,
        createdBy: updatedByUserId,
      });
    } catch (error) {
      console.error("Errore nella creazione notifica aggiornamento:", error);
      return null;
    }
  }
}

module.exports = Notification;
