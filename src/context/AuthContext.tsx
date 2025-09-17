import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, LoginCredentials, AuthContextType, Task } from "../types";
import { authService } from "../services/authService";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const INACTIVITY_TIMEOUT = 24 * 60 * 60 * 1000; // 1 giorno (puoi ridurlo a 10000 per test)
  const LAST_FOCUS_KEY = "lastFocusTime";

  const updateLastFocus = () => {
    const now = Date.now();
    localStorage.setItem(LAST_FOCUS_KEY, now.toString());
  };

  const checkInactivityLogout = () => {
    const lastFocusTime = localStorage.getItem(LAST_FOCUS_KEY);

    if (!lastFocusTime) {
      updateLastFocus();
      return;
    }

    const timeSinceLastFocus = Date.now() - parseInt(lastFocusTime, 10);

    if (timeSinceLastFocus > INACTIVITY_TIMEOUT) {
      console.log("Logout automatico per inattività");
      logout();
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);

        const lastFocusTime = localStorage.getItem(LAST_FOCUS_KEY);
        if (lastFocusTime) {
          const timeSinceLastFocus = Date.now() - parseInt(lastFocusTime, 10);
          if (timeSinceLastFocus > INACTIVITY_TIMEOUT) {
            console.log("Logout automatico per inattività al caricamento");
            localStorage.removeItem("currentUser");
            localStorage.removeItem(LAST_FOCUS_KEY);
            return;
          }
        }

        setUser(userData);
        setIsAuthenticated(true);
        // updateLastFocus(); // COMMENTATO PER DEBUG
      } catch (error) {
        console.error("Errore nel parsing dei dati utente salvati:", error);
        localStorage.removeItem("currentUser");
        localStorage.removeItem(LAST_FOCUS_KEY);
      }
    }
  }, []);

  // Eventi focus/blur
  useEffect(() => {
    let inactivityTimer: ReturnType<typeof setTimeout> | null = null;

    const handleFocus = () => {
      console.log("Finestra in focus");
      updateLastFocus();
      if (inactivityTimer) clearTimeout(inactivityTimer);
      if (isAuthenticated) checkInactivityLogout();
    };

    const handleBlur = () => {
      console.log("Finestra fuori focus");
      updateLastFocus();
      if (isAuthenticated) {
        inactivityTimer = setTimeout(() => {
          checkInactivityLogout();
        }, INACTIVITY_TIMEOUT);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") handleFocus();
      else handleBlur();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (isAuthenticated) checkInactivityLogout();

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (inactivityTimer) clearTimeout(inactivityTimer);
    };
  }, [isAuthenticated]);

  // Controllo periodico ogni 5 minuti
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      checkInactivityLogout();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      const userData = await authService.login(credentials);
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem("currentUser", JSON.stringify(userData));
        updateLastFocus();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Errore durante il login:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("currentUser");
    localStorage.removeItem(LAST_FOCUS_KEY);
  };

  const canModifyTask = (task: Task): boolean => {
    if (!user) return false;
    if (user.role === "Admin") return true;
    return task.createdBy === user.id;
  };

  // Espone la funzione per test da console
  (window as any).forceCheckInactivity = checkInactivityLogout;

  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated,
    canModifyTask,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
