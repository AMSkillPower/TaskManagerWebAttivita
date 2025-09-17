import { User, LoginCredentials } from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3002/api";

class AuthService {
  async login(credentials: LoginCredentials): Promise<User | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Errore durante il login");
      }

      const userData = await response.json();
      return userData;
    } catch (error) {
      console.error("Errore nel servizio di login:", error);
      throw error;
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Errore nel recupero utenti");
      }

      return await response.json();
    } catch (error) {
      console.error("Errore nel recupero utenti:", error);
      throw error;
    }
  }

  async createUser(
    userData: Omit<User, "id" | "createdAt"> & { password: string }
  ): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Errore nella creazione utente");
      }

      return await response.json();
    } catch (error) {
      console.error("Errore nella creazione utente:", error);
      throw error;
    }
  }

  async updateUser(
    id: number,
    userData: Partial<User> & { password?: string }
  ): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Errore nell'aggiornamento utente");
      }

      return await response.json();
    } catch (error) {
      console.error("Errore nell'aggiornamento utente:", error);
      throw error;
    }
  }

  async deleteUser(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Errore nell'eliminazione utente");
      }
    } catch (error) {
      console.error("Errore nell'eliminazione utente:", error);
      throw error;
    }
  }
}

export const authService = new AuthService();
