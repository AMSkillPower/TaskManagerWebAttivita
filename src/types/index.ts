export interface Task {
  id?: number;
  codiceTask: string;
  rifTicket?: string;
  descrizione: string;
  priorità: "bassa" | "media" | "alta";
  clienti: string;
  utente: string; // Manteniamo per compatibilità - sarà il primo utente della lista
  utenti?: string[]; // Array di utenti assegnati (nuovo campo)
  software: string;
  progetto?: string;
  ordine?: string;
  stato: "aperto" | "in corso" | "chiuso" | "testing" | "test fallito";
  dataSegnalazione: Date;
  dataScadenza: Date;
  tipoTask: "Bug" | "Improvement" | "Development" | "Marketing" | "Debugging" | "Assistenza" | "Altro";
  createdBy?: number;
  oreStimate?: number;
}

export interface Software {
  id: number;
  nomeSoftware: string;
  logo: string;
}

export interface TaskLog {
  id: number;
  utente: string;
  codiceTask: string;
  eventLog: string;
  data: string;
}

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  onClose?: () => void;
}

export interface Cliente {
  id: number;
  ragioneSociale: string;
}

export interface Allegato {
  id?: number;
  allegato: string; // Base64 encoded file
  idTask: number;
}

export interface User {
  id: number;
  username: string;
  role: "Admin" | "User";
  fullName: string;
  email?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  canModifyTask: (task: Task) => boolean;
}

export interface Notification {
  id: number;
  userId: number;
  taskId?: number;
  type: "task_assigned" | "task_updated" | "task_completed" | "task_overdue";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  createdBy?: number;
  codiceTask?: string;
  taskDescrizione?: string;
  createdByName?: string;
}

export interface Comment {
  id: number;
  commento: string;
  utente: string;
  idTask: number;
  datetime: string;
  oreDedicate?: number;
  dataInizio?: string;
  dataFine?: string;
}