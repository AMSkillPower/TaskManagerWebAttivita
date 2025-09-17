import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { apiService } from "../services/api";
import { Task } from "../types";
import { Notification } from "../types";
import {
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  Calendar,
  Filter,
  PieChart,
  AlertTriangle,
  Bell,
  BellOff,
  Trash2,
  CheckCheck,
  Eye,
} from "lucide-react";
import {
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
} from "recharts";

const Dashboard: React.FC = () => {
  const { state } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filterScadenza, setFilterScadenza] = useState("7days");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Carica notifiche
  React.useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;

      setLoadingNotifications(true);
      try {
        const data = await apiService.getNotifications(true); // Include anche quelle lette
        setNotifications(data);
      } catch (error) {
        console.error("Errore nel caricamento notifiche:", error);
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchNotifications();
  }, [user]);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );

      // Invia evento per aggiornare il conteggio nel Layout
      window.dispatchEvent(new CustomEvent("notificationsUpdated"));
    } catch (error) {
      console.error("Errore nel marcare notifica come letta:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

      // Invia evento per aggiornare il conteggio nel Layout
      window.dispatchEvent(new CustomEvent("notificationsUpdated"));
    } catch (error) {
      console.error("Errore nel marcare tutte le notifiche come lette:", error);
    }
  };

  const handleDeleteNotification = async (notificationId: number) => {
    try {
      await apiService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

      // Invia evento per aggiornare il conteggio nel Layout
      window.dispatchEvent(new CustomEvent("notificationsUpdated"));
    } catch (error) {
      console.error("Errore nell'eliminazione notifica:", error);
    }
  };

  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Ora";
    if (diffInHours < 24) return `${diffInHours}h fa`;
    if (diffInHours < 48) return "Ieri";
    return date.toLocaleDateString("it-IT");
  };
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getFilteredTaskInScadenza = () => {
    const oggi = new Date();
    // eslint-disable-next-line prefer-const
    let dataLimite = new Date();

    switch (filterScadenza) {
      case "7days":
        dataLimite.setDate(oggi.getDate() + 7);
        break;
      case "15days":
        dataLimite.setDate(oggi.getDate() + 15);
        break;
      case "30days":
        dataLimite.setDate(oggi.getDate() + 30);
        break;
      case "60days":
        dataLimite.setDate(oggi.getDate() + 60);
        break;
      default:
        dataLimite.setDate(oggi.getDate() + 7);
    }

    return state.task.filter((t) => {
      const scadenza = new Date(t.dataScadenza);
      return scadenza >= oggi && scadenza <= dataLimite && t.stato !== "chiuso";
    });
  };

  // Statistiche dei task
  const taskStats = {
    total: state.task.length,
    aperti: state.task.filter((t) => t.stato === "aperto").length,
    inCorso: state.task.filter((t) => t.stato === "in corso").length,
    chiusi: state.task.filter((t) => t.stato === "chiuso").length,
    testing: state.task.filter((t) => t.stato === "testing").length,
    falliti: state.task.filter((t) => t.stato === "test fallito").length,
    inScadenza: getFilteredTaskInScadenza().length,
    scaduti: state.task.filter(
      (t) => t.stato !== "chiuso" && new Date(t.dataScadenza) < new Date()
    ).length,
  };

  // Funzione di utilità
const isTaskOfCurrentUser = (task: Task, username: string) => {
  if (!username) return false;
  return (
    task.utente === username ||
    (task.utenti && task.utenti.includes(username))
  );
};

// Task in scadenza
const taskInScadenzaFiltrati = getFilteredTaskInScadenza().filter((t) =>
  isTaskOfCurrentUser(t, user?.username || "")
);

// Task scaduti
const taskScadutiRecenti = state.task
  .filter(
    (t) =>
      t.stato !== "chiuso" &&
      new Date(t.dataScadenza) < new Date() &&
      isTaskOfCurrentUser(t, user?.username || "")
  )
  .slice(0, 5);

// Task attivi (in corso)
const taskAttivi = state.task
  .filter((t) => t.stato === "in corso" && isTaskOfCurrentUser(t, user?.username || ""))
  .slice(0, 10);/*  */

  // Dati per grafici

  const statoDistribution = [
    { name: "Aperti", value: taskStats.aperti, color: "#EF4444" },
    { name: "In Corso", value: taskStats.inCorso, color: "#3B82F6" },
    { name: "Chiusi", value: taskStats.chiusi, color: "#10B981" },
  ];

  const statCards = [
    {
      title: "Task Totali",
      value: taskStats.total,
      icon: FileText,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      filter: "all",
    },
    {
      title: "Task Aperti",
      value: taskStats.aperti,
      icon: AlertCircle,
      color: "bg-red-500",
      textColor: "text-red-600",
      filter: "aperto",
    },
    {
      title: "In Corso",
      value: taskStats.inCorso,
      icon: Clock,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      filter: "in corso",
    },
    {
      title: "Chiusi",
      value: taskStats.chiusi,
      icon: CheckCircle,
      color: "bg-green-500",
      textColor: "text-green-600",
      filter: "chiuso",
    },
  ];

  const handleCardClick = (filter: string) => {
    switch (filter) {
      case "all":
        navigate("/task");
        break;
      case "scaduti":
        navigate("/task?search=scaduti");
        break;
      case "inScadenza":
        navigate("/task?search=prossimi");
        break;
      default:
        navigate(`/task?search=stato:${filter}`);
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Dashboard Task
          </h1>
          <p className="text-gray-600 mt-1 text-sm lg:text-base">
            Panoramica dei task e attività
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-xs lg:text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>
              Ultimo aggiornamento: {formatDate(new Date())}{" "}
              {new Date().toLocaleTimeString("it-IT")}
            </span>
          </div>
        </div>
      </div>

      {/* Statistics Cards - Clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            onClick={() => handleCardClick(card.filter)}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-2 lg:mb-0">
                <p className="text-xs lg:text-sm font-medium text-gray-600">
                  {card.title}
                </p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">
                  {card.value}
                </p>
              </div>
              <div
                className={`${card.color} p-2 lg:p-3 rounded-lg self-end lg:self-auto`}
              >
                <card.icon className="h-4 w-4 lg:h-6 lg:w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}

      {/* 
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              <div 
                onClick={() => navigate('/software')}
                className="cursor-pointer bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900">Software Attivi</h3>
                  <Package className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-blue-600">{state.software.length}</div>
                <p className="text-xs lg:text-sm text-gray-500 mt-1">Software con task</p>
              </div>
              <div 
                onClick={() => handleCardClick('scaduti')}
                className="cursor-pointer bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900">Task Scaduti</h3>
                  <AlertTriangle className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-red-600">{taskStats.scaduti}</div>
                <p className="text-xs lg:text-sm text-gray-500 mt-1">Richiedono attenzione</p>
              </div>
              <div 
                onClick={() => handleCardClick('inScadenza')}
                className="cursor-pointer bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900">Task in Scadenza</h3>
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-yellow-600">{taskStats.inScadenza}</div>
                <p className="text-xs lg:text-sm text-gray-500 mt-1">Prossimi 7 giorni</p>
              </div>
            </div>
        */}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Task in corso */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-gray-900">
              Task in Corso
            </h3>
            <div className="flex space-x-2"></div>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {taskAttivi.length > 0 ? (
              taskAttivi.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg"
                >
                  <Clock className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm lg:text-base truncate">
                      {task.codiceTask}
                    </p>
                    <p className="text-xs lg:text-sm text-gray-600 truncate">
                      {task.descrizione}
                    </p>
                    <p className="text-xs lg:text-sm text-blue-600">
                      Software: {task.software}
                    </p>
                    <p className="text-xs lg:text-sm text-blue-600">
                      Scade il {formatDate(new Date(task.dataScadenza))}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Nessun task in corso</p>
            )}
          </div>
        </div>

        {/* Task in scadenza */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-gray-900">
              Task in Scadenza
            </h3>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterScadenza}
                onChange={(e) => setFilterScadenza(e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="7days">7 giorni</option>
                <option value="15days">15 giorni</option>
                <option value="30days">30 giorni</option>
                <option value="60days">60 giorni</option>
              </select>
            </div>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {taskInScadenzaFiltrati.length > 0 ? (
              taskInScadenzaFiltrati.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg"
                >
                  <AlertTriangle className="h-4 w-4 lg:h-5 lg:w-5 text-yellow-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm lg:text-base truncate">
                      {task.codiceTask}
                    </p>
                    <p className="text-xs lg:text-sm text-gray-600 truncate">
                      {task.descrizione}
                    </p>
                    <p className="text-xs lg:text-sm text-yellow-600">
                      Software: {task.software}
                    </p>
                    <p className="text-xs lg:text-sm text-yellow-600">
                      Scade il {formatDate(new Date(task.dataScadenza))}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Nessun task in scadenza</p>
            )}
          </div>
        </div>

        {/* Task scaduti */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-gray-900">
              Task Scaduti
            </h3>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {taskScadutiRecenti.length > 0 ? (
              taskScadutiRecenti.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg"
                >
                  <XCircle className="h-4 w-4 lg:h-5 lg:w-5 text-red-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm lg:text-base truncate">
                      {task.codiceTask}
                    </p>
                    <p className="text-xs lg:text-sm text-gray-600 truncate">
                      {task.descrizione}
                    </p>
                    <p className="text-xs lg:text-sm text-red-600">
                      Software: {task.software}
                    </p>
                    <p className="text-xs lg:text-sm text-red-600">
                      Scaduto il {formatDate(new Date(task.dataScadenza))}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Nessun task scaduto</p>
            )}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifiche */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-blue-600" />
              Le tue Notifiche ({notifications.filter((n) => !n.isRead).length})
            </h3>
            <div className="flex space-x-2">
              {notifications.some((n) => !n.isRead) && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={loadingNotifications}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Segna tutte
                </button>
              )}
            </div>
          </div>
          <div className="h-64 overflow-y-auto">
            {loadingNotifications ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      notification.isRead
                        ? "bg-gray-50 border-gray-200"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                          )}
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatNotificationDate(notification.createdAt)}
                          </span>
                          {notification.codiceTask && (
                            <button
                              onClick={() =>
                                navigate(`/task/${notification.taskId}`)
                              }
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              {notification.codiceTask}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-1 ml-2">
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Segna come letta"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            handleDeleteNotification(notification.id)
                          }
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Elimina notifica"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <BellOff className="h-8 w-8 mb-2" />
                <p className="text-sm">Nessuna notifica</p>
              </div>
            )}
          </div>
        </div>

        {/* Distribuzione stati task */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Distribuzione Stati Task
            </h3>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={statoDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statoDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
