import { googleCalendarService } from './googleCalendarService';
import { sharepointService } from './sharepointService';
import { Comment, Task } from '../types';

interface IntegrationConfig {
  googleCalendar: {
    enabled: boolean;
    autoCreate: boolean;
  };
  sharepoint: {
    enabled: boolean;
    autoUpdate: boolean;
    excelFilePath?: string;
  };
}

class IntegrationService {
  private config: IntegrationConfig;

  constructor() {
    // Configurazione da variabili d'ambiente o storage
    this.config = {
      googleCalendar: {
        enabled: import.meta.env.VITE_GOOGLE_CALENDAR_ENABLED === 'true',
        autoCreate: import.meta.env.VITE_GOOGLE_CALENDAR_AUTO === 'true'
      },
      sharepoint: {
        enabled: import.meta.env.VITE_SHAREPOINT_ENABLED === 'true',
        autoUpdate: import.meta.env.VITE_SHAREPOINT_AUTO === 'true',
        excelFilePath: import.meta.env.VITE_SHAREPOINT_EXCEL_PATH
      }
    };
  }

  async initializeServices(): Promise<void> {
    const promises: Promise<boolean>[] = [];

    if (this.config.googleCalendar.enabled) {
      promises.push(googleCalendarService.initializeAuth());
    }

    if (this.config.sharepoint.enabled) {
      promises.push(sharepointService.initializeAuth());
    }

    try {
      await Promise.all(promises);
      console.log('Servizi di integrazione inizializzati');
    } catch (error) {
      console.error('Errore inizializzazione servizi:', error);
    }
  }

  async processCommentIntegration(
    comment: Comment,
    task: Task,
    userEmail?: string
  ): Promise<{
    calendar: boolean;
    sharepoint: boolean;
  }> {
    const results = {
      calendar: false,
      sharepoint: false
    };

    // Processa in parallelo per migliori performance
    const promises: Promise<void>[] = [];

    // Google Calendar
    if (this.config.googleCalendar.enabled && this.config.googleCalendar.autoCreate) {
      promises.push(
        this.createCalendarEvent(comment, task, userEmail).then(success => {
          results.calendar = success;
        })
      );
    }

    // SharePoint
    if (this.config.sharepoint.enabled && this.config.sharepoint.autoUpdate) {
      promises.push(
        this.updateSharePointExcel(comment, task).then(success => {
          results.sharepoint = success;
        })
      );
    }

    await Promise.allSettled(promises);
    return results;
  }

  private async createCalendarEvent(
    comment: Comment,
    task: Task,
    userEmail?: string
  ): Promise<boolean> {
    if (!comment.dataInizio || !comment.dataFine) {
      console.warn('Date mancanti per evento calendario');
      return false;
    }

    try {
      return await googleCalendarService.createEvent({
        title: `Lavoro su ${task.codiceTask}`,
        description: `Task: ${task.descrizione}\n\nCommento: ${comment.commento}\n\nOre dedicate: ${comment.oreDedicate || 0}`,
        startDateTime: comment.dataInizio,
        endDateTime: comment.dataFine,
        userEmail
      });
    } catch (error) {
      console.error('Errore creazione evento calendario:', error);
      return false;
    }
  }

  private async updateSharePointExcel(
    comment: Comment,
    task: Task
  ): Promise<boolean> {
    try {
      const excelData = {
        taskCode: task.codiceTask,
        user: comment.utente,
        comment: comment.commento,
        hours: comment.oreDedicate || 0,
        startDate: comment.dataInizio || '',
        endDate: comment.dataFine || '',
        timestamp: new Date().toISOString()
      };

      if (this.config.sharepoint.excelFilePath) {
        return await sharepointService.updateExcelFile(
          this.config.sharepoint.excelFilePath,
          excelData
        );
      } else {
        return await sharepointService.addRowToExcel(excelData);
      }
    } catch (error) {
      console.error('Errore aggiornamento SharePoint:', error);
      return false;
    }
  }

  // Metodi per controllo manuale
  async manualCalendarSync(comment: Comment, task: Task, userEmail?: string): Promise<boolean> {
    return this.createCalendarEvent(comment, task, userEmail);
  }

  async manualSharePointSync(comment: Comment, task: Task): Promise<boolean> {
    return this.updateSharePointExcel(comment, task);
  }

  // Getter per configurazione
  getConfig(): IntegrationConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<IntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

export const integrationService = new IntegrationService();