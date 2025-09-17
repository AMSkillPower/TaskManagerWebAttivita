const { sql, getPool } = require("../config/database");

class Task {
  static async getAll() {
    try {
      const pool = await getPool();
      const result = await pool.request().query(`
        SELECT id, codiceTask, rifTicket, descrizione, dataSegnalazione, dataScadenza, stato,
               software, progetto, ordine, utente, utenti, clienti, priorità, createdBy, oreStimate
        FROM Task
        ORDER BY dataSegnalazione DESC
      `);
      return result.recordset;
    } catch (error) {
      throw new Error(`Errore nel recupero task: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const pool = await getPool();
      const result = await pool.request().input("id", sql.Int, id).query(`
          SELECT id, codiceTask, rifTicket, descrizione, dataSegnalazione, dataScadenza, stato,
                 software, progetto, ordine, utente, utenti, clienti, priorità, createdBy, oreStimate
          FROM Task
          WHERE id = @id
        `);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Errore nel recupero task: ${error.message}`);
    }
  }

  static async getUserIdByUsername(username) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input("username", sql.NVarChar(50), username)
        .query(
          "SELECT id FROM Users WHERE username = @username AND isActive = 1"
        );

      return result.recordset[0]?.id || null;
    } catch (error) {
      console.error(`Errore nel recupero ID utente per ${username}:`, error);
      return null;
    }
  }

  static async create(taskData) {
    try {
      const pool = await getPool();

      // Ottieni l'ID utente dall'username
      let createdByUserId = null;
      if (taskData.createdByUsername) {
        createdByUserId = await this.getUserIdByUsername(
          taskData.createdByUsername
        );
        if (!createdByUserId) {
          throw new Error(
            `Utente '${taskData.createdByUsername}' non trovato o non attivo`
          );
        }
      }

      // Gestisci la multi-assegnazione
      let utentiString = null;
      if (taskData.utenti && Array.isArray(taskData.utenti) && taskData.utenti.length > 0) {
        utentiString = taskData.utenti.join(', ');
        // Se abbiamo utenti multipli, aggiorna anche il campo utente per compatibilità
        if (!taskData.utente) {
          taskData.utente = taskData.utenti[0];
        }
      }

      const result = await pool
        .request()
        .input("codiceTask", sql.NVarChar(50), taskData.codiceTask)
        .input("rifTicket", sql.NVarChar(50), taskData.rifTicket || null)
        .input("descrizione", sql.NVarChar(255), taskData.descrizione)
        .input("dataSegnalazione", sql.DateTime2, taskData.dataSegnalazione)
        .input("dataScadenza", sql.DateTime2, taskData.dataScadenza)
        .input("stato", sql.NVarChar(30), taskData.stato)
        .input("software", sql.NVarChar(50), taskData.software)
        .input("progetto", sql.NVarChar(50), taskData.progetto)
        .input("ordine", sql.NVarChar(50), taskData.ordine)
        .input("utente", sql.NVarChar(30), taskData.utente)
        .input("utenti", sql.NVarChar(500), utentiString)
        .input("clienti", sql.NVarChar(50), taskData.clienti)
        .input("priorità", sql.NVarChar(30), taskData.priorità)
        .input("createdBy", sql.Int, createdByUserId)
        .input("oreStimate", sql.Decimal(5, 2), taskData.oreStimate || 0)
        .query(`
        INSERT INTO Task (codiceTask, rifTicket, descrizione, dataSegnalazione, dataScadenza, stato,
                          software, progetto, ordine, utente, utenti, clienti, priorità, createdBy, oreStimate)
        OUTPUT INSERTED.*
        VALUES (@codiceTask, @rifTicket, @descrizione, @dataSegnalazione, @dataScadenza, @stato,
                @software, @progetto, @ordine, @utente, @utenti, @clienti, @priorità, @createdBy, @oreStimate)
      `);

      const createdTask = result.recordset[0];

      // Crea notifiche per tutti gli utenti assegnati
      if (utentiString && createdByUserId) {
        const assignedUsers = taskData.utenti;
        for (const username of assignedUsers) {
          const assignedUserId = await this.getUserIdByUsername(username);
          if (assignedUserId && assignedUserId !== createdByUserId) {
            const Notification = require("./Notification");
            await Notification.createTaskAssignmentNotification(
              createdTask,
              assignedUserId,
              createdByUserId
            );
          }
        }
      }

      await this.createLog({
        utente: taskData.createdByUsername || "Unknown",
        codiceTask: taskData.codiceTask,
        eventLog: `Task creato: ${taskData.descrizione}${utentiString ? ` - Assegnato a: ${utentiString}` : ''}`,
      });

      return createdTask;
    } catch (error) {
      throw new Error(`Errore nella creazione del task: ${error.message}`);
    }
  }

  static async update(id, taskData, operatore) {
    try {
      const pool = await getPool();
      const oldResult = await pool
        .request()
        .input("id", sql.Int, id)
        .query("SELECT * FROM Task WHERE id = @id");

      const oldTask = oldResult.recordset[0];

      // Gestisci la multi-assegnazione per l'aggiornamento
      let utentiString = null;
      if (taskData.utenti && Array.isArray(taskData.utenti) && taskData.utenti.length > 0) {
        utentiString = taskData.utenti.join(', ');
        // Aggiorna anche il campo utente per compatibilità
        if (!taskData.utente) {
          taskData.utente = taskData.utenti[0];
        }
      }

      await pool
        .request()
        .input("id", sql.Int, id)
        .input("rifTicket", sql.NVarChar(50), taskData.rifTicket || null)
        .input("descrizione", sql.NVarChar(255), taskData.descrizione)
        .input("dataScadenza", sql.DateTime2, taskData.dataScadenza)
        .input("stato", sql.NVarChar(30), taskData.stato)
        .input("progetto", sql.NVarChar(50), taskData.progetto)
        .input("ordine", sql.NVarChar(50), taskData.ordine)
        .input("utente", sql.NVarChar(30), taskData.utente)
        .input("utenti", sql.NVarChar(500), utentiString)
        .input("priorità", sql.NVarChar(30), taskData.priorità)
        .input("oreStimate", sql.Decimal(5, 2), taskData.oreStimate || 0).query(`
        UPDATE Task
        SET 
            rifTicket = @rifTicket,
            descrizione = @descrizione,
            dataScadenza = @dataScadenza,
            stato = @stato,
            utente = @utente,
            utenti = @utenti,
            priorità = @priorità,
            progetto = @progetto,
            ordine = @ordine,
            oreStimate = @oreStimate
        WHERE id = @id
      `);

      const getResult = await pool
        .request()
        .input("id", sql.Int, id)
        .query("SELECT * FROM Task WHERE id = @id");

      const updatedTask = getResult.recordset[0];

      // Crea notifiche per i nuovi utenti assegnati
      const oldUtenti = oldTask.utenti ? oldTask.utenti.split(', ').map(u => u.trim()) : [oldTask.utente].filter(Boolean);
      const newUtenti = updatedTask.utenti ? updatedTask.utenti.split(', ').map(u => u.trim()) : [updatedTask.utente].filter(Boolean);
      
      const updatedByUserId = await this.getUserIdByUsername(operatore);
      
      // Trova nuovi utenti assegnati
      const addedUsers = newUtenti.filter(u => !oldUtenti.includes(u));
      
      for (const username of addedUsers) {
        const assignedUserId = await this.getUserIdByUsername(username);
        if (assignedUserId && updatedByUserId && assignedUserId !== updatedByUserId) {
          const Notification = require("./Notification");
          await Notification.createTaskAssignmentNotification(
            updatedTask,
            assignedUserId,
            updatedByUserId
          );
        }
      }

      // Crea notifica di aggiornamento per il creatore del task
      if (updatedTask.createdBy && updatedByUserId && updatedTask.createdBy !== updatedByUserId) {
        const Notification = require("./Notification");
        await Notification.createTaskUpdateNotification(
          updatedTask,
          updatedByUserId
        );
      }

      // Genera log dei cambiamenti
      var log = `Task aggiornato\n`;
      if (oldTask.descrizione != updatedTask.descrizione) {
        log += `Descrizione: ${oldTask.descrizione} -> ${updatedTask.descrizione}\n`;
      }
      if (oldTask.dataScadenza.toString() != updatedTask.dataScadenza.toString()) {
        log += `Data scadenza: ${oldTask.dataScadenza} -> ${updatedTask.dataScadenza}\n`;
      }
      if (oldTask.stato != updatedTask.stato) {
        log += `Stato: ${oldTask.stato} -> ${updatedTask.stato}\n`;
      }
      if (oldTask.utenti != updatedTask.utenti) {
        log += `Utenti assegnati: ${oldTask.utenti || oldTask.utente || 'Nessuno'} -> ${updatedTask.utenti || updatedTask.utente || 'Nessuno'}\n`;
      }
      if (oldTask.priorità != updatedTask.priorità) {
        log += `Priorità: ${oldTask.priorità} -> ${updatedTask.priorità}\n`;
      }
      if (oldTask.progetto != updatedTask.progetto) {
        log += `Progetto: ${oldTask.progetto || 'Nessuno'} -> ${updatedTask.progetto || 'Nessuno'}\n`;
      }
      if (oldTask.oreStimate != updatedTask.oreStimate) {
        log += `Ore stimate: ${oldTask.oreStimate} -> ${updatedTask.oreStimate}\n`;
      }
      if (oldTask.ordine != updatedTask.ordine) {
        log += `Ordine: ${oldTask.ordine} -> ${updatedTask.ordine}\n`;
      }

      await this.createLog({
        utente: operatore,
        codiceTask: taskData.codiceTask,
        eventLog: log,
      });

      return updatedTask;
    } catch (error) {
      throw new Error(`Errore nell'aggiornamento del task: ${error.message}`);
    }
  }

  static async delete(id, operatore) {
    try {
      const pool = await getPool();

      const taskResult = await pool
        .request()
        .input("id", sql.Int, id)
        .query("SELECT codiceTask, descrizione FROM Task WHERE id = @id");

      const task = taskResult.recordset[0];

      await pool
        .request()
        .input("id", sql.Int, id)
        .query("DELETE FROM Task WHERE id = @id");

      if (task) {
        await this.createLog({
          utente: operatore,
          codiceTask: task.codiceTask,
          eventLog: `Task eliminato: ${task.descrizione}`,
        });
      }

      return true;
    } catch (error) {
      throw new Error(`Errore nell'eliminazione del task: ${error.message}`);
    }
  }

  static async createLog(logData) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input("utente", sql.NVarChar(50), logData.utente)
        .input("codiceTask", sql.NVarChar(50), logData.codiceTask)
        .input("eventLog", sql.NVarChar(sql.MAX), logData.eventLog)
        .input("data", sql.DateTime2, new Date()).query(`
          INSERT INTO taskLog (utente, codiceTask, eventLog, data)
          OUTPUT INSERTED.*
          VALUES (@utente, @codiceTask, @eventLog, @data)
        `);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Errore nella creazione del log: ${error.message}`);
    }
  }

  static async getLogs(codiceTask = null) {
    try {
      const pool = await getPool();
      let query = `
        SELECT id, utente, codiceTask, eventLog, data
        FROM taskLog
        ORDER BY data DESC
      `;

      if (codiceTask) {
        query = `
          SELECT id, utente, codiceTask, eventLog, data
          FROM taskLog
          WHERE codiceTask = @codiceTask
          ORDER BY data DESC
        `;
      }

      const request = pool.request();
      if (codiceTask) {
        request.input("codiceTask", sql.NVarChar(50), codiceTask);
      }

      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      throw new Error(`Errore nel recupero logs: ${error.message}`);
    }
  }

  static async getLogsByUser(utente) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input("utente", sql.NVarChar(50), utente).query(`
          SELECT id, utente, codiceTask, eventLog, data
          FROM taskLog
          WHERE utente = @utente
          ORDER BY data DESC
        `);
      return result.recordset;
    } catch (error) {
      throw new Error(`Errore nel recupero logs utente: ${error.message}`);
    }
  }
}

module.exports = Task;