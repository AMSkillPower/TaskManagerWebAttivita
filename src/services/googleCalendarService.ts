interface CalendarEvent {
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{ email: string }>;
}

class GoogleCalendarService {
  private accessToken: string | null = null;
  private readonly CALENDAR_ID = 'primary'; // o un calendario specifico

  constructor() {
    // Inizializza il token dall'ambiente o storage
    this.accessToken = localStorage.getItem('google_access_token');
  }

  async initializeAuth(): Promise<boolean> {
    try {
      // Implementa OAuth2 flow per Google Calendar
      // Questo richiederà la configurazione di Google Cloud Console
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      
      if (!clientId) {
        console.warn('Google Client ID non configurato');
        return false;
      }

      // Usa Google Identity Services
      return new Promise((resolve) => {
        if (typeof google !== 'undefined' && google.accounts) {
          google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: any) => {
              this.accessToken = response.credential;
              localStorage.setItem('google_access_token', response.credential);
              resolve(true);
            }
          });
          
          google.accounts.id.prompt();
        } else {
          resolve(false);
        }
      });
    } catch (error) {
      console.error('Errore inizializzazione Google Auth:', error);
      return false;
    }
  }

  async createEvent(eventData: {
    title: string;
    description: string;
    startDateTime: string;
    endDateTime: string;
    userEmail?: string;
  }): Promise<boolean> {
    if (!this.accessToken) {
      console.warn('Token Google non disponibile');
      return false;
    }

    try {
      const event: CalendarEvent = {
        summary: eventData.title,
        description: eventData.description,
        start: {
          dateTime: eventData.startDateTime,
          timeZone: 'Europe/Rome'
        },
        end: {
          dateTime: eventData.endDateTime,
          timeZone: 'Europe/Rome'
        }
      };

      if (eventData.userEmail) {
        event.attendees = [{ email: eventData.userEmail }];
      }

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${this.CALENDAR_ID}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        }
      );

      if (!response.ok) {
        throw new Error(`Errore API Google Calendar: ${response.status}`);
      }

      const result = await response.json();
      console.log('Evento creato su Google Calendar:', result.id);
      return true;
    } catch (error) {
      console.error('Errore creazione evento Google Calendar:', error);
      return false;
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();