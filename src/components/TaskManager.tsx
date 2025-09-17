import React, { useEffect, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  FileText,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  FlaskConical,
  XCircle,
  Check,
  X,
  Image,
} from "lucide-react";
import Select from "react-select";
import { apiService } from "../services/api";
import { Task, Software, Allegato, Cliente, Comment } from "../types";
import ConfirmModal from "./ConfirmModal";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import CreatableSelect from "react-select/creatable";

interface TaskManagerProps {
  searchTerm?: string;
}

const TaskManager: React.FC<TaskManagerProps> = () => {
  const { state, dispatch } = useApp();
  const tasks = state.task || [];
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("search") || "";
  const [progettiList, setProgettiList] = useState<string[]>([]);
  const [ordiniList, setOrdiniList] = useState<string[]>([]);
  const navigate = useNavigate();
  const { user, canModifyTask } = useAuth();
  const [softwareList, setSoftwareList] = useState<Software[]>([]);
  const [usersList, setUsersList] = useState<string[]>([]);
  const loading = state.loading;
  const [viewMode] = useState<"grid" | "cards">("grid");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [clientiList, setClientiList] = useState<Cliente[]>([]);
  const [tempAllegati, setTempAllegati] = useState<File[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [filterScadenza, setFilterScadenza] = useState<
    "all" | "scaduti" | "non-scaduti"
  >("all");
  const [filterStato, setFilterStato] = useState<
    "all" | "aperto" | "in corso" | "chiuso" | "testing" | "test fallito"
  >("all");
  const [filterUtente, setFilterUtente] = useState("all");

  // Stato per editing inline
  const [editingCell, setEditingCell] = useState<{
    taskId: number;
    field: "stato" | "priorità" | "commenti";
  } | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const [formData, setFormData] = useState({
    rifTicket: "", // Cambiato da "#" a ""
    descrizione: "",
    priorità: "media" as "media" | "bassa" | "alta",
    clienti: "SkillPower Srl",
    utente: "",
    utenti: [] as string[],
    software: "",
    progetto: "",
    ordine: "",
    tipoTask: "Bug" as
      | "Bug"
      | "Improvement"
      | "Development"
      | "Marketing"
      | "Debugging"
      | "Assistenza"
      | "Altro",
    stato: "aperto" as
      | "aperto"
      | "in corso"
      | "chiuso"
      | "testing"
      | "test fallito",
    dataScadenza: "",
    oreStimate: 0,
  });

  const [taskHours, setTaskHours] = useState<Record<number, number>>({});

  // Funzioni per allegati
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Verifica dimensione file (max 10MB per file)
    const validFiles = files.filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`Il file ${file.name} è troppo grande. Massimo 10MB per file.`);
        return false;
      }
      return true;
    });

    setTempAllegati((prev) => [...prev, ...validFiles]);

    // Reset input
    e.target.value = "";
  };

  const removeFileFromTemp = (index: number) => {
    setTempAllegati((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith("image/"))
      return <Image className="h-5 w-5 text-blue-600" />;
    if (type.includes("pdf"))
      return <FileText className="h-5 w-5 text-red-600" />;
    if (type.includes("excel") || type.includes("spreadsheet"))
      return <FileText className="h-5 w-5 text-green-600" />;
    if (type.includes("word") || type.includes("document"))
      return <FileText className="h-5 w-5 text-blue-600" />;
    if (type.includes("powerpoint") || type.includes("presentation"))
      return <FileText className="h-5 w-5 text-orange-600" />;
    return <FileText className="h-5 w-5 text-gray-600" />;
  };

  // Funzione per caricare gli allegati dopo la creazione/aggiornamento del task
  const uploadAllegati = async (taskId: number) => {
    if (tempAllegati.length === 0) return;

    try {
      for (const file of tempAllegati) {
        const reader = new FileReader();
        await new Promise((resolve, reject) => {
          reader.onload = async () => {
            try {
              const base64 = reader.result as string;
              const nuovoAllegato: Omit<Allegato, "id"> = {
                allegato: base64,
                idTask: taskId,
              };
              await apiService.createAllegato(nuovoAllegato);
              resolve(true);
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
    } catch (error) {
      console.error("Errore durante il caricamento degli allegati:", error);
      dispatch({
        type: "SET_ERROR",
        payload: "Errore durante il caricamento degli allegati",
      });
    }
  };

  // Funzione per ottenere tutti gli utenti dai task (inclusi quelli multi-assegnati)
  const getAllUsersFromTasks = () => {
    const users = new Set<string>();
    tasks.forEach((task) => {
      // Priorità al nuovo campo utenti
      if (task.utenti && Array.isArray(task.utenti)) {
        task.utenti.forEach((u) => users.add(u));
      } else if (task.utente) {
        // Fallback al vecchio campo utente
        users.add(task.utente);
      }
    });
    return Array.from(users);
  };

  const refreshTaskHours = async (taskId: number) => {
    if (taskId) {
      await loadTaskHours(taskId);
    }
  };

  const allUsers = getAllUsersFromTasks();

  const fetchUsers = async () => {
    try {
      const data = await apiService.getUsers();
      setUsersList(data.map((u: { username: string }) => u.username));
    } catch (err) {
      console.error("Errore nel caricamento utenti", err);
      dispatch({ type: "SET_ERROR", payload: "Errore nel caricamento utenti" });
    }
  };

  useEffect(() => {
    if (searchTerm.startsWith("stato:")) {
      const filter = searchTerm.split(":")[1];
      setFilterStato(
        filter as
          | "all"
          | "aperto"
          | "in corso"
          | "chiuso"
          | "testing"
          | "test fallito"
      );
    }
  }, [searchTerm]);

  // Funzione per verificare se un task è visibile all'utente corrente
  const isTaskVisibleToUser = (task: Task) => {
    if (!user) return false;

    // Admin vede tutto
    if (user.role === "Admin") return true;

    // Se la ricerca è per software, mostra tutti i task di quel software
    if (searchTerm.startsWith("software:")) {
      return true;
    }

    // Utente normale vede solo:
    // 1. Task creati da lui
    // 2. Task assegnati a lui (singolo o multiplo)
    const isCreatedByUser = task.createdBy === user.id;
    let isAssignedToUser = false;

    // Controlla assegnazione in entrambi i campi
    if (task.utenti && Array.isArray(task.utenti)) {
      isAssignedToUser = task.utenti.includes(user.username);
    } else if (task.utente) {
      isAssignedToUser = task.utente === user.username;
    }

    return isCreatedByUser || isAssignedToUser;
  };

  const getTaskUsers = (task: Task): string[] => {
    if (task.utenti && Array.isArray(task.utenti) && task.utenti.length > 0) {
      return task.utenti;
    } else if (task.utente) {
      return [task.utente];
    }
    return [];
  };

  // Nella funzione filteredTasks, sostituisci questa parte:

  const filteredTasks = tasks.filter((task) => {
    // Verifica la visibilità del task
    if (!isTaskVisibleToUser(task)) return false;

    // Filtro per searchTerm
    if (searchTerm.startsWith("stato:")) {
      const statoFiltro = searchTerm.split(":")[1];
      if (statoFiltro !== "all" && task.stato !== statoFiltro) return false;
    } else if (searchTerm.startsWith("software:")) {
      const softwareFiltro = searchTerm.split(":")[1];
      if (task.software !== softwareFiltro) return false;
    } else if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      const descrizione = task.descrizione?.toLowerCase() || "";
      const codiceTask = task.codiceTask?.toLowerCase() || "";
      const rifTicket = task.rifTicket?.toLowerCase() || "";
      const software = task.software?.toLowerCase() || "";
      const progetto = task.progetto?.toLowerCase() || "";
      const ordine = task.ordine?.toLowerCase() || "";

      if (
        !descrizione.includes(lowerSearch) &&
        !codiceTask.includes(lowerSearch) &&
        !rifTicket.includes(lowerSearch) &&
        !software.includes(lowerSearch) &&
        !progetto.includes(lowerSearch) &&
        !ordine.includes(lowerSearch)
      ) {
        return false;
      }
    }

    // Filtro stato
    const matchesStato = filterStato === "all" || task.stato === filterStato;

    // Filtro scadenza
    const taskDate = new Date(task.dataScadenza);
    const isScaduto = taskDate < new Date();
    const matchesScadenza =
      filterScadenza === "all" ||
      (filterScadenza === "scaduti" && isScaduto) ||
      (filterScadenza === "non-scaduti" && !isScaduto);

    // Filtro utente
    const matchesUtente = (() => {
      if (user?.role !== "Admin" || filterUtente === "all") return true;
      const taskUsers = getTaskUsers(task);
      return taskUsers.includes(filterUtente);
    })();

    return matchesStato && matchesScadenza && matchesUtente;
  });

  const canInlineEdit = (field: "stato" | "priorità" | "commenti") => {
    return ["stato", "priorità", "commenti"].includes(field);
  };

  const startInlineEdit = (
    taskId: number,
    field: "stato" | "priorità" | "commenti",
    currentValue: string
  ) => {
    if (!canInlineEdit(field)) return;
    setEditingCell({ taskId, field });
    setEditingValue(currentValue);
  };

  const cancelInlineEdit = () => {
    setEditingCell(null);
    setEditingValue("");
  };

  const saveInlineEdit = async () => {
    if (!editingCell) return;

    const taskToUpdate = tasks.find((t) => t.id === editingCell.taskId);
    if (!taskToUpdate) return;

    try {
      const updatedTask = { ...taskToUpdate };

      if (editingCell.field === "stato") {
        updatedTask.stato = editingValue as typeof updatedTask.stato;
      } else if (editingCell.field === "priorità") {
        updatedTask.priorità = editingValue as typeof updatedTask.priorità;
      }

      await apiService.updateTask(taskToUpdate.id!, updatedTask);
      dispatch({ type: "UPDATE_TASK", payload: updatedTask });

      setEditingCell(null);
      setEditingValue("");
    } catch (error) {
      console.error("Errore aggiornamento task", error);
      dispatch({
        type: "SET_ERROR",
        payload: "Errore durante l'aggiornamento",
      });
    }
  };

  const clientiOptions = clientiList.map((cliente) => ({
    value: cliente.ragioneSociale,
    label: cliente.ragioneSociale,
  }));

  const loadTaskHours = async (taskId: number) => {
    try {
      const result = await apiService.getTaskOreDedicate(taskId);
      setTaskHours((prev) => ({
        ...prev,
        [taskId]: result.totalOreDedicate,
      }));
    } catch (error) {
      console.error(`Errore caricamento ore per task ${taskId}:`, error);
    }
  };

  // Carica le ore per tutti i task visibili
  const loadAllTaskHours = async () => {
    const promises = filteredTasks.map((task) => {
      if (task.id) {
        return loadTaskHours(task.id);
      }
    });

    await Promise.allSettled(promises);
  };
  const safeToLocaleDateString = (date: Date): string => {
    try {
      const d = date instanceof Date ? date : new Date(date);
      return isNaN(d.getTime()) ? "Data non valida" : d.toLocaleDateString();
    } catch {
      return "Data non valida";
    }
  };

  useEffect(() => {
    if (filteredTasks.length > 0) {
      loadAllTaskHours();
    }
  }, [filteredTasks.length]);

  const fetchTasks = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const res = (await apiService.getTasks()) as Task[];
      const formatted = res.map((task: Task) => ({
        ...task,
        dataSegnalazione: task.dataSegnalazione
          ? new Date(task.dataSegnalazione)
          : new Date(),
        dataScadenza: task.dataScadenza
          ? new Date(task.dataScadenza)
          : new Date(),
      }));
      dispatch({ type: "SET_TASK", payload: formatted });
    } catch (error) {
      console.error("Errore nel caricamento dei task", error);
      dispatch({
        type: "SET_ERROR",
        payload: "Errore nel caricamento dei task",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const fetchSoftwareData = async () => {
    try {
      const data = await apiService.getAllSoftware();
      setSoftwareList(data);
    } catch (error) {
      console.error("Errore nel caricamento dei software", error);
    }
  };

  const getSoftwareLogo = (softwareName: string) => {
    const software = softwareList.find((s) => s.nomeSoftware === softwareName);
    return software?.logo || "";
  };

  const handleDelete = (id: number, codiceTask: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Conferma Eliminazione",
      message: `Sei sicuro di voler eliminare il task "${codiceTask}"?`,
      onConfirm: async () => {
        dispatch({ type: "SET_LOADING", payload: true });
        try {
          await apiService.deleteTask(id);
          dispatch({ type: "DELETE_TASK", payload: id });
        } catch (error) {
          console.error("Errore durante eliminazione task", error);
          dispatch({
            type: "SET_ERROR",
            payload: "Errore durante eliminazione",
          });
        } finally {
          dispatch({ type: "SET_LOADING", payload: false });
          closeConfirmModal();
        }
      },
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleEdit = (task: Task) => {
    const taskUsers = getTaskUsers(task);

    setFormData({
      rifTicket: task.rifTicket || "",
      descrizione: task.descrizione,
      priorità: task.priorità,
      clienti: task.clienti,
      utente: task.utente,
      utenti: taskUsers,
      software: task.software,
      progetto: task.progetto || "",
      ordine: task.ordine || "",
      tipoTask: task.tipoTask,
      stato: task.stato,
      dataScadenza:
        task.dataScadenza instanceof Date
          ? task.dataScadenza.toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      oreStimate: task.oreStimate || 0,
    });
    setEditingTask(task);
    setTempAllegati([]); // Reset allegati temporanei
    setShowForm(true);
  };

  const validateFormData = () => {
    if (!formData.descrizione || !formData.software) {
      return "Completa tutti i campi obbligatori";
    }

    // Verifica che ci sia almeno un utente assegnato
    if (formData.utenti.length === 0 && !formData.utente) {
      return "È necessario assegnare almeno un utente";
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateFormData();
    if (validationError) {
      dispatch({ type: "SET_ERROR", payload: validationError });
      return;
    }

    dispatch({ type: "SET_LOADING", payload: true });
    try {
      // Gestione del campo rifTicket: se è vuoto, diventa undefined
      const processedRifTicket =
        formData.rifTicket.trim() === "" ? undefined : formData.rifTicket;

      // Prepara dataScadenza
      const dataScadenza = formData.dataScadenza
        ? new Date(formData.dataScadenza)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      if (editingTask) {
        const updatedTask: Task = {
          ...editingTask,
          ...formData,
          rifTicket: processedRifTicket,
          dataScadenza: dataScadenza,
        };
        await apiService.updateTask(editingTask.id!, updatedTask);
        dispatch({ type: "UPDATE_TASK", payload: updatedTask });

        if (tempAllegati.length > 0) {
          await uploadAllegati(editingTask.id!);
        }
      } else {
        const tipoCodeMap = {
          Bug: "BUG",
          Improvement: "IMP",
          Development: "DEV",
          Marketing: "MKT",
          Debugging: "DBG",
          Assistenza: "ASS",
          Altro: "ALT",
        };

        const tipoCode = tipoCodeMap[formData.tipoTask] || "ALT";

        const prefix = formData.software.substring(0, 3).toUpperCase();
        const codiceBase = `${prefix}_${tipoCode}`;

        const existing = tasks.filter((t) =>
          t.codiceTask.startsWith(codiceBase)
        );
        const numbers = existing.map((t) => {
          const parts = t.codiceTask.split("_");
          return parseInt(parts[2], 10) || 0;
        });
        const maxNumber = numbers.length ? Math.max(...numbers) : 0;
        const progressive = String(maxNumber + 1).padStart(4, "0");
        const finalCodice = `${codiceBase}_${progressive}`;

        const newTask: Task = {
          codiceTask: finalCodice,
          ...formData,
          rifTicket: processedRifTicket,
          utenti: formData.utenti.length > 0 ? formData.utenti : undefined,
          dataSegnalazione: new Date(),
          dataScadenza: dataScadenza,
          createdBy: user?.id,
          oreStimate: formData.oreStimate,
          ordine: formData.ordine || "",
        };

        const createdTask = await apiService.createTask(newTask);

        // Carica allegati se presenti
        if (tempAllegati.length > 0 && createdTask.id) {
          await uploadAllegati(createdTask.id);
        }

        await fetchTasks();
      }

      resetForm();
    } catch (error) {
      console.error("Errore durante il salvataggio del task", error);
      dispatch({ type: "SET_ERROR", payload: "Errore durante il salvataggio" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const resetForm = () => {
    setFormData({
      rifTicket: "", // Cambiato da "#" a ""
      descrizione: "",
      priorità: "media",
      clienti: "SkillPower Srl",
      utente: "",
      utenti: [],
      software: "",
      progetto: "",
      ordine: "",
      tipoTask: "Bug",
      stato: "aperto",
      dataScadenza: "",
      oreStimate: 0,
    });
    setEditingTask(null);
    setTempAllegati([]);
    setShowForm(false);
  };

  const getPriorityColor = (priority: "alta" | "media" | "bassa") => {
    switch (priority) {
      case "alta":
        return "bg-red-100 text-red-800";
      case "media":
        return "bg-yellow-100 text-yellow-800";
      case "bassa":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatoColor = (
    stato: "aperto" | "in corso" | "chiuso" | "testing" | "test fallito"
  ) => {
    switch (stato) {
      case "aperto":
        return "bg-red-100 text-red-800";
      case "in corso":
        return "bg-blue-100 text-blue-800";
      case "chiuso":
        return "bg-green-100 text-green-800";
      case "testing":
        return "bg-purple-100 text-purple-800";
      case "test fallito":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatoIcon = (
    stato: "aperto" | "in corso" | "chiuso" | "testing" | "test fallito"
  ) => {
    switch (stato) {
      case "aperto":
        return <AlertCircle className="h-4 w-4" />;
      case "in corso":
        return <Clock className="h-4 w-4" />;
      case "chiuso":
        return <CheckCircle className="h-4 w-4" />;
      case "testing":
        return <FlaskConical className="h-4 w-4" />;
      case "test fallito":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const groupTasksByStato = () => {
    const stati = ["aperto", "in corso", "testing", "test fallito", "chiuso"];
    const priorityOrder = { alta: 0, media: 1, bassa: 2 };

    const grouped: Record<string, Task[]> = {};

    // Se c'è un filtro specifico, mostra solo quello
    if (filterStato !== "all") {
      const tasksForFilteredStato = filteredTasks
        .filter((task) => task.stato === filterStato)
        .sort((a, b) => priorityOrder[a.priorità] - priorityOrder[b.priorità]);

      if (tasksForFilteredStato.length > 0) {
        grouped[filterStato] = tasksForFilteredStato;
      }
      return grouped;
    }

    // Se il filtro è "all", mostra tutti gli stati (anche vuoti)
    stati.forEach((stato) => {
      const tasksForStato = filteredTasks
        .filter((task) => task.stato === stato)
        .sort((a, b) => priorityOrder[a.priorità] - priorityOrder[b.priorità]);

      grouped[stato] = tasksForStato;
    });

    return grouped;
  };

  const groupedTasks = groupTasksByStato();

  const handleView = (task: Task, e?: React.MouseEvent) => {
    if (e && (e.target as HTMLElement).closest(".inline-edit-action")) {
      return;
    }

    if (!task.id) {
      console.error("Task ID is undefined");
      return;
    }
    navigate(`/task/${task.id}`);
  };

  const fetchClienti = async () => {
    try {
      const data = await apiService.getClienti();
      setClientiList(data);
    } catch (error) {
      console.error("Errore nel caricamento dei clienti", error);
      dispatch({
        type: "SET_ERROR",
        payload: "Errore nel caricamento dei clienti",
      });
    }
  };

  const fetchProgetti = async () => {
    const data = await apiService.getProgetti();
    setProgettiList(data);
  };

  const fetchOrdini = async () => {
    const data = await apiService.getOrdini();
    setOrdiniList(data);
  };

  useEffect(() => {
    fetchTasks();
    fetchSoftwareData();
    fetchClienti();
    fetchUsers();
    fetchProgetti();
    fetchOrdini();
  }, []);

  const handleCreateProgetto = async (inputValue: string) => {
    try {
      // Se hai un endpoint per creare progetti
      // await apiService.createProgetto(inputValue);

      // Altrimenti aggiungi semplicemente alla lista locale
      const nuovoProgetto = inputValue.trim();
      if (nuovoProgetto && !progettiList.includes(nuovoProgetto)) {
        setProgettiList((prev) => [...prev, nuovoProgetto]);
      }

      // Aggiorna il form
      setFormData((prev) => ({
        ...prev,
        progetto: nuovoProgetto,
      }));

      return { value: nuovoProgetto, label: nuovoProgetto };
    } catch (error) {
      console.error("Errore nella creazione del progetto", error);
      return null;
    }
  };

  const progettiOptions = progettiList.map((progetto) => ({
    value: progetto,
    label: progetto,
  }));

  const handleCreateOrdine = async (inputValue: string) => {
    try {
      // Se hai un endpoint per creare ordini
      // await apiService.createOrdine(inputValue);

      // Altrimenti aggiungi semplicemente alla lista locale
      const nuovoOrdine = inputValue.trim();
      if (nuovoOrdine && !ordiniList.includes(nuovoOrdine)) {
        setOrdiniList((prev) => [...prev, nuovoOrdine]);
      }

      // Aggiorna il form
      setFormData((prev) => ({
        ...prev,
        ordine: nuovoOrdine,
      }));

      return { value: nuovoOrdine, label: nuovoOrdine };
    } catch (error) {
      console.error("Errore nella creazione del ordine", error);
      return null;
    }
  };

  const ordiniOptions = ordiniList.map((ordine) => ({
    value: ordine,
    label: ordine,
  }));

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Gestione Task
          </h1>
          <p className="text-gray-600 mt-1 text-sm lg:text-base">
            Traccia e gestisci le segnalazioni
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowForm(true)}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 text-sm lg:text-base disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span>Nuovo Task</span>
          </button>
        </div>
      </div>
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        {/* Search input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca task per codice, software, descrizione, progetto e ordine..."
            value={searchTerm}
            onChange={(e) => {
              const term = e.target.value;
              const newSearchParams = new URLSearchParams(searchParams);

              if (term) {
                newSearchParams.set("search", term);
              } else {
                newSearchParams.delete("search");
              }
              setSearchParams(newSearchParams);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
          />
        </div>

        {/* Filtro stato */}
        <div className="relative">
          <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            value={filterStato}
            onChange={(e) =>
              setFilterStato(
                e.target.value as
                  | "all"
                  | "aperto"
                  | "in corso"
                  | "chiuso"
                  | "testing"
                  | "test fallito"
              )
            }
            className="w-full sm:w-auto pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
          >
            <option value="all">Tutti gli stati</option>
            <option value="aperto">Aperto</option>
            <option value="in corso">In Corso</option>
            <option value="chiuso">Chiuso</option>
            <option value="testing">Testing</option>
            <option value="test fallito">Test Fallito</option>
          </select>
        </div>

        {/* Filtro scadenza */}
        <div className="relative">
          <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            value={filterScadenza}
            onChange={(e) =>
              setFilterScadenza(
                e.target.value as "all" | "scaduti" | "non-scaduti"
              )
            }
            className="w-full sm:w-auto pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
          >
            <option value="all">Tutte le scadenze</option>
            <option value="scaduti">Scaduti</option>
            <option value="non-scaduti">Non scaduti</option>
          </select>
        </div>

        {/* Nuovo filtro utente */}
        {user?.role === "Admin" && (
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <select
              value={filterUtente}
              onChange={(e) => setFilterUtente(e.target.value)}
              className="w-full sm:w-auto pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
            >
              <option value="all">Tutti gli utenti</option>
              {allUsers.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {/* Mobile Cards View */}
      {viewMode === "grid" && (
        <div className="space-y-8">
          {Object.entries(groupedTasks).map(([stato, tasks]) => (
            <div key={stato}>
              <h2 className="text-xl font-semibold text-gray-800 capitalize mb-2">
                {stato} ({tasks.length})
              </h2>
              {tasks.length > 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Codice / Descrizione
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rif. Ticket
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Software
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Progetto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ordine
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dettagli
                        </th>
                        {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th> */}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ore dedicate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avanzamento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Priorità
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stato
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Azioni
                        </th>
                      </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                      {tasks.map((task) => {
                        const softwareLogo = getSoftwareLogo(task.software);
                        return (
                          <tr
                            key={task.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={(e) => handleView(task, e)}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  {softwareLogo ? (
                                    <img
                                      src={softwareLogo}
                                      alt={task.software}
                                      className="h-10 w-10 rounded-lg object-contain"
                                    />
                                  ) : (
                                    <div className="bg-blue-100 rounded-lg p-2">
                                      <FileText className="h-5 w-5 text-blue-600" />
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {task.codiceTask}
                                  </div>
                                  <div
                                    className="text-sm text-gray-500 max-w-xs break-words"
                                    title={task.descrizione}
                                  >
                                    {task.descrizione}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {task.rifTicket || "-"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {task.software}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {task.progetto || "-"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {task.ordine || "-"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <div className="flex items-center space-x-1">
                                  <User className="h-4 w-4 text-gray-400" />
                                  <span>
                                    {task.utenti && task.utenti.length > 0
                                      ? task.utenti.join(", ")
                                      : task.utente}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  {task.clienti}
                                </div>
                              </div>
                            </td>
                            {/* <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4 text-gray-400" />
                                  <span>
                                    Segnalato:{" "}
                                    {safeToLocaleDateString(
                                      task.dataSegnalazione
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1 mt-1">
                                  <Calendar className="h-4 w-4 text-gray-400" />
                                  <span>
                                    Scadenza:{" "}
                                    {safeToLocaleDateString(task.dataScadenza)}
                                  </span>
                                </div>
                              </div>
                            </td> */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  <span>
                                    {taskHours[task.id as number] || 0}h /{" "}
                                    {task.oreStimate || 0}h
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {task.oreStimate
                                    ? `${Math.round(
                                        ((taskHours[task.id as number] || 0) /
                                          task.oreStimate) *
                                          100
                                      )}% completate`
                                    : "Nessuna stima"}
                                </div>
                              </div>
                            </td>

                            {/* Stato avanzamento con barra di progresso */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              {(() => {
                                const percent = task.oreStimate
                                  ? Math.round(
                                      ((taskHours[task.id as number] || 0) /
                                        task.oreStimate) *
                                        100
                                    )
                                  : 0;

                                let colorClass = "bg-green-600"; // default
                                if (percent >= 61 && percent <= 99) {
                                  colorClass = "bg-orange-500";
                                } else if (percent >= 100) {
                                  colorClass = "bg-red-600";
                                }

                                return (
                                  <>
                                    <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                      <div
                                        className={`${colorClass} h-2.5 rounded-full`}
                                        style={{
                                          width: `${Math.min(100, percent)}%`,
                                        }}
                                      ></div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {task.oreStimate ? `${percent}%` : "N/A"}
                                    </div>
                                  </>
                                );
                              })()}
                            </td>

                            {/* Priorità */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editingCell?.taskId === task.id &&
                              editingCell?.field === "priorità" ? (
                                <div className="flex items-center space-x-2 inline-edit-action">
                                  <select
                                    value={editingValue}
                                    onChange={(e) =>
                                      setEditingValue(e.target.value)
                                    }
                                    className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="bassa">Bassa</option>
                                    <option value="media">Media</option>
                                    <option value="alta">Alta</option>
                                  </select>
                                  <button
                                    onClick={saveInlineEdit}
                                    className="text-green-600 hover:text-green-800"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={cancelInlineEdit}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <span
                                  className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold cursor-pointer ${getPriorityColor(
                                    task.priorità
                                  )} hover:opacity-80 inline-edit-action`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startInlineEdit(
                                      task.id as number,
                                      "priorità",
                                      task.priorità
                                    );
                                  }}
                                >
                                  {task.priorità}
                                </span>
                              )}
                            </td>

                            {/* Stato */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editingCell?.taskId === task.id &&
                              editingCell?.field === "stato" ? (
                                <div className="flex items-center space-x-2 inline-edit-action">
                                  <select
                                    value={editingValue}
                                    onChange={(e) =>
                                      setEditingValue(e.target.value)
                                    }
                                    className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="aperto">Aperto</option>
                                    <option value="in corso">In Corso</option>
                                    <option value="chiuso">Chiuso</option>
                                    <option value="testing">Testing</option>
                                    <option value="test fallito">
                                      Test Fallito
                                    </option>
                                  </select>
                                  <button
                                    onClick={saveInlineEdit}
                                    className="text-green-600 hover:text-green-800"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={cancelInlineEdit}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold cursor-pointer ${getStatoColor(
                                    task.stato
                                  )} hover:opacity-80 inline-edit-action`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startInlineEdit(
                                      task.id as number,
                                      "stato",
                                      task.stato
                                    );
                                  }}
                                >
                                  {getStatoIcon(task.stato)}
                                  <span className="ml-1">{task.stato}</span>
                                </span>
                              )}
                            </td>

                            {/* Azioni (solo admin) */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(task);
                                  }}
                                  disabled={loading || !canModifyTask(task)}
                                  className={`${
                                    canModifyTask(task)
                                      ? "text-blue-600 hover:text-blue-900"
                                      : "text-gray-400 cursor-not-allowed"
                                  } disabled:opacity-50`}
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(
                                      task.id as number,
                                      task.codiceTask
                                    );
                                  }}
                                  disabled={loading || !canModifyTask(task)}
                                  className={`${
                                    canModifyTask(task)
                                      ? "text-red-600 hover:text-red-900"
                                      : "text-gray-400 cursor-not-allowed"
                                  } disabled:opacity-50`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nessun task trovato</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {filteredTasks.length === 0 && (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nessun task trovato</p>
        </div>
      )}
      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg lg:text-xl font-bold">
                {editingTask ? "Modifica Task" : "Nuovo Task"}
              </h2>
              {editingTask && (
                <div className="text-lg font-bold text-blue-700 bg-blue-100 px-4 py-2 rounded-md shadow-md">
                  Codice: {editingTask.codiceTask}
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {/* Riferimento Ticket e Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Riferimento Ticket
                </label>
                <input
                  type="text"
                  value={formData.rifTicket}
                  onChange={(e) =>
                    setFormData({ ...formData, rifTicket: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                  placeholder="Es: #0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente *
                </label>
                <Select
                  options={clientiOptions}
                  value={clientiOptions.find(
                    (option) => option.value === formData.clienti
                  )}
                  onChange={(selected) =>
                    setFormData({
                      ...formData,
                      clienti: selected?.value || "SkillPower Srl",
                    })
                  }
                  className="text-sm"
                  placeholder="Seleziona cliente"
                />
              </div>

              {/* Descrizione */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrizione *
                </label>
                <textarea
                  value={formData.descrizione}
                  onChange={(e) =>
                    setFormData({ ...formData, descrizione: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                  placeholder="Descrivi il task..."
                  required
                />
              </div>

              {/* Priorità e Tipo Task */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priorità *
                </label>
                <select
                  value={formData.priorità}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priorità: e.target.value as "alta" | "media" | "bassa",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                  required
                >
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="bassa">Bassa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo Task *
                </label>
                <select
                  value={formData.tipoTask}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tipoTask: e.target.value as
                        | "Bug"
                        | "Improvement"
                        | "Development"
                        | "Marketing"
                        | "Debugging"
                        | "Assistenza"
                        | "Altro",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                  required
                >
                  <option value="Bug">Bug</option>
                  <option value="Improvement">Improvement</option>
                  <option value="Development">Development</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Debugging">Debugging</option>
                  <option value="Assistenza">Assistenza</option>
                  <option value="Altro">Altro</option>
                </select>
              </div>

              {/* Stato e Software */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stato *
                </label>
                <select
                  value={formData.stato}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stato: e.target.value as
                        | "aperto"
                        | "in corso"
                        | "chiuso"
                        | "testing"
                        | "test fallito",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                  required
                >
                  <option value="aperto">Aperto</option>
                  <option value="in corso">In Corso</option>
                  <option value="chiuso">Chiuso</option>
                  <option value="testing">Testing</option>
                  <option value="test fallito">Test Fallito</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Software *
                </label>
                <select
                  value={formData.software}
                  onChange={(e) =>
                    setFormData({ ...formData, software: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                  required
                >
                  <option value="">Seleziona software</option>
                  {softwareList.map((software) => (
                    <option key={software.id} value={software.nomeSoftware}>
                      {software.nomeSoftware}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ordine e Progetto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ordine
                </label>
                <CreatableSelect
                  isClearable
                  options={ordiniOptions}
                  value={
                    formData.ordine
                      ? { value: formData.ordine, label: formData.ordine }
                      : null
                  }
                  onChange={(selected) => {
                    setFormData({
                      ...formData,
                      ordine: selected?.value || "",
                    });
                  }}
                  onCreateOption={async (inputValue) => {
                    const newOption = await handleCreateOrdine(inputValue);
                    if (newOption) {
                      setFormData({
                        ...formData,
                        ordine: newOption.value,
                      });
                    }
                  }}
                  placeholder="Seleziona o crea un ordine..."
                  formatCreateLabel={(inputValue) =>
                    `Crea ordine: "${inputValue}"`
                  }
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Progetto
                </label>
                <CreatableSelect
                  isClearable
                  options={progettiOptions}
                  value={
                    formData.progetto
                      ? { value: formData.progetto, label: formData.progetto }
                      : null
                  }
                  onChange={(selected) => {
                    setFormData({
                      ...formData,
                      progetto: selected?.value || "",
                    });
                  }}
                  onCreateOption={async (inputValue) => {
                    const newOption = await handleCreateProgetto(inputValue);
                    if (newOption) {
                      setFormData({
                        ...formData,
                        progetto: newOption.value,
                      });
                    }
                  }}
                  placeholder="Seleziona o crea un progetto..."
                  formatCreateLabel={(inputValue) =>
                    `Crea progetto: "${inputValue}"`
                  }
                  className="text-sm"
                />
              </div>

              {/* Ore Stimate, Data Scadenza e Utenti Assegnati */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ore Stimate
                  </label>
                  <input
                    type="number"
                    value={formData.oreStimate === 0 ? "" : formData.oreStimate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        oreStimate:
                          e.target.value === ""
                            ? 0
                            : Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                    min={0}
                    step={0.1}
                    placeholder="0.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Scadenza
                  </label>
                  <input
                    type="date"
                    value={formData.dataScadenza}
                    onChange={(e) =>
                      setFormData({ ...formData, dataScadenza: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Utenti Assegnati *
                  </label>
                  <Select
                    isMulti
                    options={usersList.map((user) => ({
                      value: user,
                      label: user,
                    }))}
                    value={formData.utenti.map((user) => ({
                      value: user,
                      label: user,
                    }))}
                    onChange={(selected) =>
                      setFormData({
                        ...formData,
                        utenti: selected.map((s) => s.value),
                      })
                    }
                    className="text-sm"
                    placeholder="Seleziona utenti"
                  />
                </div>
              </div>

              {/* Allegati */}
              {!editingTask && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Allegati
                  </label>
                  <div className="mb-3">
                    <label className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md border border-gray-300 cursor-pointer hover:bg-gray-200 transition-colors duration-200">
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi file
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Massimo 10MB per file
                    </p>
                  </div>

                  {tempAllegati.length > 0 && (
                    <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        File selezionati:
                      </h4>
                      <div className="space-y-2">
                        {tempAllegati.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-white rounded border"
                          >
                            <div className="flex items-center">
                              {getFileIcon(file)}
                              <span className="ml-2 text-sm text-gray-700 truncate max-w-xs">
                                {file.name}
                              </span>
                              <span className="ml-2 text-xs text-gray-500">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFileFromTemp(index)}
                              className="text-red-500 hover:text-red-700 ml-2"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {previewImage && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-lg p-4 max-w-3xl max-h-full">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium">
                            Anteprima immagine
                          </h3>
                          <button
                            onClick={() => setPreviewImage(null)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X className="h-6 w-6" />
                          </button>
                        </div>
                        <img
                          src={previewImage}
                          alt="Anteprima"
                          className="max-w-full max-h-96 object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pulsanti */}
              <div className="md:col-span-2 flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors duration-200 text-sm lg:text-base"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 text-sm lg:text-base"
                >
                  {loading
                    ? "Salvataggio..."
                    : editingTask
                    ? "Modifica"
                    : "Crea"}{" "}
                  Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
        type="danger"
      />
    </div>
  );
};

export default TaskManager;
