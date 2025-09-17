interface ExcelRowData {
  taskCode: string;
  user: string;
  comment: string;
  hours: number;
  startDate: string;
  endDate: string;
  timestamp: string;
}

class SharePointService {
  private accessToken: string | null = null;
  private readonly SITE_URL = import.meta.env.VITE_SHAREPOINT_SITE_URL;
  private readonly LIST_NAME = import.meta.env.VITE_SHAREPOINT_LIST_NAME || 'TaskComments';

  constructor() {
    this.accessToken = localStorage.getItem('sharepoint_access_token');
  }

  async initializeAuth(): Promise<boolean> {
    try {
      const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;
      const tenantId = import.meta.env.VITE_AZURE_TENANT_ID;
      
      if (!clientId || !tenantId) {
        console.warn('Credenziali Azure non configurate');
        return false;
      }

      // Implementa MSAL (Microsoft Authentication Library)
      // Questo è un esempio semplificato
      const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
        `client_id=${clientId}&` +
        `response_type=token&` +
        `redirect_uri=${encodeURIComponent(window.location.origin)}&` +
        `scope=${encodeURIComponent('https://graph.microsoft.com/Sites.ReadWrite.All')}`;

      // In un'implementazione reale, useresti MSAL.js
      console.log('URL per autenticazione SharePoint:', authUrl);
      return false; // Placeholder
    } catch (error) {
      console.error('Errore inizializzazione SharePoint Auth:', error);
      return false;
    }
  }

  async addRowToExcel(data: ExcelRowData): Promise<boolean> {
    if (!this.accessToken || !this.SITE_URL) {
      console.warn('Token SharePoint o Site URL non disponibili');
      return false;
    }

    try {
      // Usa Microsoft Graph API per aggiungere riga a Excel
      const graphUrl = `https://graph.microsoft.com/v1.0/sites/${this.SITE_URL}/lists/${this.LIST_NAME}/items`;
      
      const itemData = {
        fields: {
          TaskCode: data.taskCode,
          User: data.user,
          Comment: data.comment,
          Hours: data.hours,
          StartDate: data.startDate,
          EndDate: data.endDate,
          Timestamp: data.timestamp
        }
      };

      const response = await fetch(graphUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(itemData)
      });

      if (!response.ok) {
        throw new Error(`Errore API SharePoint: ${response.status}`);
      }

      const result = await response.json();
      console.log('Riga aggiunta a SharePoint:', result.id);
      return true;
    } catch (error) {
      console.error('Errore aggiunta riga SharePoint:', error);
      return false;
    }
  }

  // Metodo alternativo per Excel file diretto
  async updateExcelFile(filePath: string, data: ExcelRowData): Promise<boolean> {
    if (!this.accessToken) return false;

    try {
      // Usa Microsoft Graph API per modificare file Excel
      const graphUrl = `https://graph.microsoft.com/v1.0/sites/${this.SITE_URL}/drive/root:/${filePath}:/workbook/worksheets/Sheet1/tables/Table1/rows/add`;
      
      const rowData = {
        values: [[
          data.taskCode,
          data.user,
          data.comment,
          data.hours,
          data.startDate,
          data.endDate,
          data.timestamp
        ]]
      };

      const response = await fetch(graphUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rowData)
      });

      return response.ok;
    } catch (error) {
      console.error('Errore aggiornamento Excel:', error);
      return false;
    }
  }
}

export const sharepointService = new SharePointService();