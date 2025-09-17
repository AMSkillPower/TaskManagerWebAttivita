// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { Task, Software } from "../types";
import { apiService } from "../services/api";

interface AppState {
  task: Task[];
  software: Software[];
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_TASK"; payload: Task[] }
  | { type: "ADD_TASK"; payload: Task }
  | { type: "UPDATE_TASK"; payload: Task }
  | { type: "DELETE_TASK"; payload: number }
  | { type: "SET_SOFTWARE"; payload: Software[] }
  | { type: "ADD_SOFTWARE"; payload: Software }
  | { type: "UPDATE_SOFTWARE"; payload: Software }
  | { type: "DELETE_SOFTWARE"; payload: number };

const initialState: AppState = {
  task: [],
  software: [],
  loading: false,
  error: null,
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "SET_TASK":
      return { ...state, task: action.payload };
    case "ADD_TASK":
      return { ...state, task: [...state.task, action.payload] };
    case "UPDATE_TASK":
      return {
        ...state,
        task: state.task.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case "DELETE_TASK":
      return {
        ...state,
        task: state.task.filter((t) => t.id !== action.payload),
      };
    case "SET_SOFTWARE":
      return { ...state, software: action.payload };
    case "ADD_SOFTWARE":
      return { ...state, software: [...state.software, action.payload] };
    case "UPDATE_SOFTWARE":
      return {
        ...state,
        software: state.software.map((s) =>
          s.id === action.payload.id ? action.payload : s
        ),
      };
    case "DELETE_SOFTWARE":
      return {
        ...state,
        software: state.software.filter((s) => s.id !== action.payload),
      };
    default:
      throw new Error(`Unhandled action type`);
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  loadData: () => Promise<void>;
  getTaskById: (id: number) => Task | undefined;
  getSoftwareById: (id: number) => Software | undefined;
  createTask: (task: Omit<Task, "id">) => Promise<void>;
  updateTask: (id: number, task: Task) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const loadData = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const [task, software] = await Promise.all([
        apiService.getTasks(),
        apiService.getAllSoftware(),
      ]);

      dispatch({ type: "SET_TASK", payload: task as Task[] });
      dispatch({ type: "SET_SOFTWARE", payload: software });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error
            ? error.message
            : "Errore nel caricamento dei dati",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const loadInitialData = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const [task, software] = await Promise.all([
        apiService.getTasks(),
        apiService.getAllSoftware(),
      ]);

      dispatch({ type: "SET_TASK", payload: task as Task[] });
      dispatch({ type: "SET_SOFTWARE", payload: software });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: "Errore nel caricamento iniziale" + error,
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const getTaskById = (id: number) => state.task.find((t) => t.id === id);
  const getSoftwareById = (id: number) =>
    state.software.find((s) => s.id === id);

  const createTask = async (taskData: Omit<Task, "id">) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const newTask = await apiService.createTask(taskData);
      dispatch({ type: "ADD_TASK", payload: newTask });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error
            ? error.message
            : "Errore nella creazione del task",
      });
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const updateTask = async (id: number, taskData: Task) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const updatedTask = await apiService.updateTask(id, taskData);
      dispatch({ type: "UPDATE_TASK", payload: updatedTask as Task });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error
            ? error.message
            : "Errore nell'aggiornamento del task",
      });
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const deleteTask = async (id: number) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      await apiService.deleteTask(id);
      dispatch({ type: "DELETE_TASK", payload: id });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error
            ? error.message
            : "Errore nell'eliminazione del task",
      });
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // return (
  //   <AppContext.Provider
  //     value={{
  //       state,
  //       dispatch,
  //       loadData,
  //       getTaskById,
  //       getSoftwareById,
  //       createTask,
  //       updateTask,
  //       deleteTask,
  //     }}
  //   >
  //     {children}
  //   </AppContext.Provider>
  const contextValue: AppContextType = {
    state,
    dispatch,
    loadData,
    getTaskById,
    getSoftwareById,
    createTask,
    updateTask,
    deleteTask,
  };
  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
