import { Cliente, Software, Task, Allegato, Comment } from "../types";

//const API_BASE_URL = 'http://localhost:3002/api';
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://192.168.50.253:3002/api";

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const savedUser = localStorage.getItem("currentUser");
    const currentUser = savedUser ? JSON.parse(savedUser) : null;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        "x-username": currentUser?.username || "Unknown", // 👈 aggiunto
        "x-user-id": currentUser?.id?.toString() || "", // 👈 aggiunto per notifiche
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (process.env.NODE_ENV === "development") {
        console.log(`API Request: ${config.method || "GET"} ${url}`);
      }

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          const fallbackText = await response.text();
          errorMessage = `${errorMessage} - ${fallbackText}`;
        }
        throw new Error(errorMessage);
      }

      // Gestione risposta non-JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Risposta non in formato JSON: ${text}`);
      }
    } catch (error) {
      console.error(`❌ API Error (${endpoint}):`, error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Impossibile connettersi al server. Assicurati che il backend sia in esecuzione su porta 3002."
        );
      }
      throw error;
    }
  }

  // Clienti API
  async getClienti(): Promise<Cliente[]> {
    return this.request<Cliente[]>("/clienti");
  }

  // Task API
  async getTasks(): Promise<Task[]> {
    return this.request<Task[]>("/task");
  }

  async getTaskById(id: string): Promise<Task> {
    return this.request<Task>(`/task/${id}`);
  }

  async createTask(task: Omit<Task, "id">): Promise<Task> {
    return this.request<Task>("/task", {
      method: "POST",
      body: JSON.stringify(task),
    });
  }

  async updateTask(id: number, taskData: Partial<Task>): Promise<Task> {
    return this.request<Task>(`/task/${id}`, {
      method: "PUT",
      body: JSON.stringify(taskData),
    });
  }

  async deleteTask(id: number): Promise<void> {
    return this.request<void>(`/task/${id}`, {
      method: "DELETE",
    });
  }

  async getTaskByIdForSite(id: string): Promise<Task> {
    return this.request<Task>(`/task/${id}`);
  }

  // Software API
  async getSoftware(): Promise<Software[]> {
    return this.request<Software[]>("/software");
  }

  async getSoftwareById(id: number): Promise<Software> {
    return this.request<Software>(`/software/${id}`);
  }

  async createSoftware(software: Omit<Software, "id">): Promise<Software> {
    const payload = {
      nomeSoftware: software.nomeSoftware,
      logo: software.logo,
    };
    return this.request<Software>("/software", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateSoftware(
    id: number,
    software: Partial<Software>
  ): Promise<Software> {
    return this.request<Software>(`/software/${id}`, {
      method: "PUT",
      body: JSON.stringify(software),
    });
  }

  async deleteSoftware(id: number): Promise<void> {
    return this.request<void>(`/software/${id}`, {
      method: "DELETE",
    });
  }

  async getAllSoftware(): Promise<Software[]> {
    return this.request<Software[]>("/software");
  }

  async getSoftwareList(): Promise<string[]> {
    const software = await this.getAllSoftware();
    return software.map((s) => s.nomeSoftware);
  }

  // Allegati API
  async getTaskAllegati(taskId: number): Promise<Allegato[]> {
    return this.request<Allegato[]>(`/task/${taskId}/allegati`);
  }

  async createAllegato(allegato: Omit<Allegato, "id">): Promise<Allegato> {
    return this.request<Allegato>("/allegati", {
      method: "POST",
      body: JSON.stringify({
        allegato: allegato.allegato,
        idTask: allegato.idTask,
      }),
    });
  }

  async deleteAllegato(id: number): Promise<void> {
    return this.request<void>(`/allegati/${id}`, {
      method: "DELETE",
    });
  }

  async getUsers(): Promise<{ username: string }[]> {
    return this.request<{ username: string }[]>("/users");
  }

  // Task Logs API
  async getTaskLogs(): Promise<import("../types").TaskLog[]> {
    return this.request<import("../types").TaskLog[]>("/task-logs");
  }

  async getTaskLogsByTask(
    codiceTask: string
  ): Promise<import("../types").TaskLog[]> {
    return this.request<import("../types").TaskLog[]>(
      `/task-logs/${codiceTask}`
    );
  }

  async getTaskLogsByUser(
    utente: string
  ): Promise<import("../types").TaskLog[]> {
    return this.request<import("../types").TaskLog[]>(
      `/task-logs/user/${utente}`
    );
  }

  // Notifications API
  async getNotifications(
    includeRead = false
  ): Promise<import("../types").Notification[]> {
    return this.request<import("../types").Notification[]>(
      `/notifications?includeRead=${includeRead}`
    );
  }

  async getUnreadNotificationsCount(): Promise<{ count: number }> {
    return this.request<{ count: number }>("/notifications/count");
  }

  async markNotificationAsRead(id: number): Promise<void> {
    return this.request<void>(`/notifications/${id}/read`, {
      method: "PUT",
    });
  }

  async markAllNotificationsAsRead(): Promise<void> {
    return this.request<void>("/notifications/read-all", {
      method: "PUT",
    });
  }

  async deleteNotification(id: number): Promise<void> {
    return this.request<void>(`/notifications/${id}`, {
      method: "DELETE",
    });
  }

  async getTaskComments(taskId: number): Promise<Comment[]> {
    return this.request<Comment[]>(`/comments/task/${taskId}`);
  }


  async createComment(
    comment: Omit<Comment, "id" | "datetime" | "utente">
  ): Promise<Comment> {
    return this.request<Comment>("/comments", {
      method: "POST",
      body: JSON.stringify(comment),
    });
  }

  async getTaskOreDedicate(taskId: number): Promise<{ totalOreDedicate: number }> {
  try {
    const comments = await this.getTaskComments(taskId);
    const totalOreDedicate = comments.reduce((total, comment) => {
      return total + (comment.oreDedicate || 0);
    }, 0);
    
    return { totalOreDedicate };
  } catch (error) {
    console.error(`Errore nel calcolo ore dedicate per task ${taskId}:`, error);
    return { totalOreDedicate: 0 };
  }
}

  async updateComment(id: number, comment: Partial<Comment>): Promise<Comment> {
    return this.request<Comment>(`/comments/${id}`, {
      method: "PUT",
      body: JSON.stringify(comment),
    });
  }

  async deleteComment(id: number): Promise<void> {
    return this.request<void>(`/comments/${id}`, {
      method: "DELETE",
    });
  }

  async getTaskTotalHours(taskId: number): Promise<{ totalHours: number }> {
    return this.request<{ totalHours: number }>(
      `/comments/task/${taskId}/hours`
    );
  }

  async getProgetti(): Promise<string[]> {
    try {
      const tasks = await this.getTasks();
      const progetti = new Set<string>();

      tasks.forEach((task) => {
        if (task.progetto && task.progetto.trim()) {
          progetti.add(task.progetto.trim());
        }
      });

      return Array.from(progetti).sort();
    } catch (error) {
      console.error("Errore nel recupero progetti dai task:", error);
      return [];
    }
  }

  async getOrdini(): Promise<string[]> {
    try {
      const tasks = await this.getTasks();
      const ordini = new Set<string>();

      tasks.forEach((task) => {
        if (task.ordine && task.ordine.trim()) {
          ordini.add(task.ordine.trim());
        }
      });

      return Array.from(ordini).sort();
    } catch (error) {
      console.error("Errore nel recupero ordini dai task:", error);
      return [];
    }
  }
}

export const apiService = new ApiService();
