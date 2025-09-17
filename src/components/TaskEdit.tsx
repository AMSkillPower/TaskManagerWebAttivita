import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiService } from "../services/api";
import { Task } from "../types";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  Save,
  X,
  Calendar,
  User,
  Tag,
  MessageSquare,
  AlertTriangle,
  Clock,
} from "lucide-react";
import Select from "react-select";

const TaskEdit: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { dispatch } = useApp();
  const { canModifyTask } = useAuth();
  const [usersList, setUsersList] = useState<string[]>([]);

  // Caricamento utenti
  const fetchUsers = async () => {
    try {
      const data = await apiService.getUsers();
      setUsersList(data.map((u: { username: string }) => u.username));
    } catch (err) {
      console.error("Errore nel caricamento utenti:", err);
      dispatch({ type: "SET_ERROR", payload: "Errore nel caricamento utenti" });
    }
  };

  // Caricamento task + utenti
  useEffect(() => {
    const fetchTask = async () => {
      try {
        const taskData = await apiService.getTaskById(taskId!);
        setTask(taskData as Task);
      } catch (error) {
        console.error("Errore caricamento task:", error);
        dispatch({
          type: "SET_ERROR",
          payload: "Errore nel caricamento del task",
        });
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
    fetchUsers();
  }, [taskId, dispatch, navigate]);

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    if (!canModifyTask(task)) {
      dispatch({
        type: "SET_ERROR",
        payload: "Non hai i permessi per modificare questo task",
      });
      return;
    }

    setSaving(true);
    try {
      await apiService.updateTask(task.id!, task);
      navigate(`/task/${task.id}`);
    } catch (error) {
      console.error("Errore aggiornamento task:", error);
      dispatch({ type: "SET_ERROR", payload: "Errore durante il salvataggio" });
    } finally {
      setSaving(false);
    }
  };

  // Cambio valori (ora supporta string e number)
  const handleChange = (field: keyof Task, value: string | number) => {
    if (!task) return;
    setTask({ ...task, [field]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12 text-gray-500">
        <X className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-medium">Task non trovato</h2>
      </div>
    );
  }

  const stati = ["aperto", "in corso", "testing", "test fallito", "chiuso"];
  const priorita = ["alta", "media", "bassa"];

  return (
    <div className="max-w-5xl mx-auto p-3 lg:p-4 space-y-4">
      {/* Torna indietro */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors duration-200"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Torna indietro
      </button>

      {/* Card principale */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Modifica Task:{" "}
          <span className="text-blue-600">{task.codiceTask}</span>
        </h1>
        <p className="text-gray-600 mb-6 text-sm">
          Modifica i dettagli del task e salva le modifiche
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dati principali */}
          <section className="bg-gray-50 p-4 rounded-xl">
            <h2 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
              <Tag className="h-4 w-4 mr-1 text-blue-600" /> Dati principali
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Colonna 1 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Codice Task *
                  </label>
                  <input
                    type="text"
                    value={task.codiceTask || ""}
                    onChange={(e) => handleChange("codiceTask", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                    readOnly={true} // Disabilita la modifica del campo
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Riferimento Ticket
                  </label>
                  <input
                    type="text"
                    value={task.rifTicket || ""}
                    onChange={(e) => handleChange("rifTicket", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Es: #0000"
                  />
                </div>
              </div>

              {/* Colonna 2 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1 text-gray-500" />{" "}
                    Priorità
                  </label>
                  <select
                    value={task.priorità || ""}
                    onChange={(e) => handleChange("priorità", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Seleziona priorità</option>
                    {priorita.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Stato
                  </label>
                  <select
                    value={task.stato || ""}
                    onChange={(e) => handleChange("stato", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Seleziona stato</option>
                    {stati.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Colonna 3: Ore */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <Clock className="h-3 w-3 mr-1 text-gray-500" /> Ore Stimate
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={task.oreStimate ?? ""}
                    onChange={(e) =>
                      handleChange("oreStimate", parseFloat(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Es: 10.50"
                  />
                </div>
              </div>

              {/* Colonna 4: progetto e ordine */}
              <div className="space-y-4">
                {task.progetto && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Progetto
                    </label>
                    <input
                      type="text"
                      value={task.progetto || ""}
                      onChange={(e) =>
                        handleChange("progetto", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>
                )}
                {task.ordine && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Ordine
                    </label>
                    <input
                      type="text"
                      value={task.ordine || ""}
                      onChange={(e) =>
                        handleChange("ordine", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Es: #0000"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Descrizione */}
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                <MessageSquare className="h-3 w-3 mr-1 text-gray-500" />{" "}
                Descrizione
              </label>
              <textarea
                value={task.descrizione || ""}
                onChange={(e) => handleChange("descrizione", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Inserisci una descrizione dettagliata del task..."
              />
            </div>
          </section>

          {/* Assegnazioni e Date */}
          <section className="bg-gray-50 p-4 rounded-xl">
            <h2 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
              <User className="h-4 w-4 mr-1 text-blue-600" /> Assegnazioni &
              Date
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Utenti */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Utenti Assegnati
                </label>
                <Select
                  isMulti
                  options={usersList.map((u) => ({ value: u, label: u }))}
                  value={
                    task.utenti?.map((u) => ({ value: u, label: u })) ||
                    (task.utente
                      ? [{ value: task.utente, label: task.utente }]
                      : [])
                  }
                  onChange={(selected) => {
                    const selectedUsers = selected
                      ? selected.map((s) => s.value)
                      : [];
                    setTask({
                      ...task,
                      utenti: selectedUsers,
                      utente: selectedUsers[0] || "",
                    });
                  }}
                  placeholder="Seleziona utenti..."
                  isClearable
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: 36,
                      fontSize: "0.875rem",
                    }),
                  }}
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                  <Calendar className="h-3 w-3 mr-1 text-gray-500" /> Data
                  Segnalazione
                </label>
                <input
                  type="date"
                  value={
                    task.dataSegnalazione
                      ? new Date(task.dataSegnalazione)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    handleChange("dataSegnalazione", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <label className="block text-xs font-medium text-gray-700 mb-1 mt-2 flex items-center">
                  <Calendar className="h-3 w-3 mr-1 text-gray-500" /> Data
                  Scadenza
                </label>
                <input
                  type="date"
                  value={
                    task.dataScadenza
                      ? new Date(task.dataScadenza).toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => handleChange("dataScadenza", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </section>

          {/* Pulsanti */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm flex items-center"
            >
              <X className="h-4 w-4 mr-1" /> Annulla
            </button>
            <button
              type="submit"
              disabled={saving || !canModifyTask(task)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center"
            >
              <Save className="h-4 w-4 mr-1" />{" "}
              {saving ? "Salvataggio..." : "Salva Modifiche"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskEdit;
