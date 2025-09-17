import { Software, Task } from '../types';

export const sampleTask: Task[] = [
  {
    id: 1,
    codiceTask: 'T001',
    descrizione: 'Installazione software di sicurezza',
    software: 'Kaspersky Total Security',
    utente: 'Mario Rossi',
    clienti: 'ACME Corp',
    stato: 'in corso',
    priorità: 'alta',
    dataSegnalazione: new Date(2023, 0, 15),
    dataScadenza: new Date(2023, 0, 30),
    tipoTask: 'Bug',
    oreStimate: 5
  },
  {
    id: 2,
    codiceTask: 'T002',
    descrizione: 'Aggiornamento software di produttività',
    software: 'Microsoft Office 365',
    utente: 'Luigi Bianchi',
    clienti: 'Beta Srl',
    stato: 'in corso',
    priorità: 'media',
    dataSegnalazione: new Date(2023, 1, 10),
    dataScadenza: new Date(2023, 1, 20),
    tipoTask: 'Improvement',
    oreStimate: 3
  },
    {
      id: 3,
      codiceTask: 'T003',
      descrizione: 'Configurazione software di design', 
      software: 'Adobe Creative Cloud',
      utente: 'Anna Verdi',
      clienti: 'Gamma Spa',
      stato: 'testing',
      priorità: 'bassa',
      dataSegnalazione: new Date(2023, 2, 5),
      dataScadenza: new Date(2023, 2, 15),
      tipoTask: 'Bug',
      oreStimate: 4
  }
];

export const sampleSoftware: Software[] = [
  {
    id: 1,
    nomeSoftware: 'PDMAdvancved',
    logo: ''
  },
  {
    id: 2,
    nomeSoftware: 'XDManager',
    logo: ''
  },
  {
    id: 3,
    nomeSoftware: 'PCManager',
    logo: ''
  }
];



export const sampleData = {
  task: sampleTask,
  software: sampleSoftware,
};