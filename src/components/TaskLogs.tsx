import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { apiService } from "../services/api";
import { TaskLog } from "../types";
import {
  FileText,
  Search,
  Calendar,
  User,
  Clock,
  Shield,
  Activity,
  RefreshCw,
} from "lucide-react";

const TaskLogs: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUser, setFilterUser] = useState("all");
  const [filterTask, setFilterTask] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  if (currentUser?.role !== "Admin") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-500">
            Accesso negato. Solo gli amministratori possono accedere ai log.
          </p>
        </div>
      </div>
    );
  }

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await apiService.getTaskLogs();
      setLogs(data);
    } catch (error) {
      console.error("Errore nel caricamento dei log:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const uniqueUsers = Array.from(new Set(logs.map((log) => log.utente))).filter(
    Boolean
  );

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchTerm ||
      log.eventLog.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.codiceTask.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesUser = filterUser === "all" || log.utente === filterUser;
    const matchesTask =
      !filterTask ||
      log.codiceTask.toLowerCase().includes(filterTask.toLowerCase());

    let matchesDate = true;
    if (dateFilter !== "all") {
      const logDate = new Date(log.data);
      const now = new Date();
      const daysDiff = Math.floor(
        (now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      switch (dateFilter) {
        case "today":
          matchesDate = daysDiff === 0;
          break;
        case "week":
          matchesDate = daysDiff <= 7;
          break;
        case "month":
          matchesDate = daysDiff <= 30;
          break;
      }
    }

    return matchesSearch && matchesUser && matchesTask && matchesDate;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEventIcon = (eventLog: string) => {
    if (eventLog.includes("creato"))
      return <FileText className="h-4 w-4 text-green-600" />;
    if (eventLog.includes("aggiornato") || eventLog.includes("modificato"))
      return <RefreshCw className="h-4 w-4 text-blue-600" />;
    if (eventLog.includes("eliminato"))
      return <FileText className="h-4 w-4 text-red-600" />;
    if (eventLog.includes("commento"))
      return <Activity className="h-4 w-4 text-purple-600" />;
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  const getEventColor = (eventLog: string) => {
    if (eventLog.includes("creato")) return "bg-green-50 border-green-200";
    if (eventLog.includes("aggiornato") || eventLog.includes("modificato"))
      return "bg-blue-50 border-blue-200";
    if (eventLog.includes("eliminato")) return "bg-red-50 border-red-200";
    if (eventLog.includes("commento")) return "bg-purple-50 border-purple-200";
    return "bg-gray-50 border-gray-200";
  };

  if (loading && logs.length === 0) {
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
            Log Attività Task
          </h1>
          <p className="text-gray-600 mt-1 text-sm lg:text-base">
            Cronologia di tutte le azioni sui task ({filteredLogs.length}{" "}
            eventi)
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 text-sm lg:text-base disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span>Aggiorna</span>
        </button>
      </div>

      {/* Filtri */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca nei log..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">Tutti gli utenti</option>
            {uniqueUsers.map((user) => (
              <option key={user} value={user}>
                {user}
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filtra per task..."
            value={filterTask}
            onChange={(e) => setFilterTask(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">Tutte le date</option>
            <option value="today">Oggi</option>
            <option value="week">Ultima settimana</option>
            <option value="month">Ultimo mese</option>
          </select>
        </div>
      </div>

      {/* Lista Log con scroll orizzontale */}
      <div className="overflow-x-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredLogs.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2 hover:bg-gray-50 transition-colors border-l-4 ${getEventColor(
                    log.eventLog
                  )}`}
                >
                  <div className="flex items-start justify-between space-x-2">
                    <div className="flex-shrink-0 mt-1">
                      {getEventIcon(log.eventLog)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1 text-xs sm:text-sm">
                        <span className="font-medium text-blue-600">
                          {log.codiceTask}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600">{log.utente}</span>
                      </div>
                      <p className="text-gray-900 mb-1 text-sm sm:text-base whitespace-pre-wrap">
                        {log.eventLog}
                      </p>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(log.data)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {logs.length === 0
                  ? "Nessun log disponibile"
                  : "Nessun log corrisponde ai filtri selezionati"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Statistiche rapide */}
      {logs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg p-2 mr-3">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Task Creati</p>
                <p className="text-lg font-bold text-gray-900">
                  {logs.filter((log) => log.eventLog.includes("creato")).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-2 mr-3">
                <RefreshCw className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Modifiche</p>
                <p className="text-lg font-bold text-gray-900">
                  {
                    logs.filter(
                      (log) =>
                        log.eventLog.includes("aggiornato") ||
                        log.eventLog.includes("modificato")
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-lg p-2 mr-3">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Utenti Attivi
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {uniqueUsers.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskLogs;
