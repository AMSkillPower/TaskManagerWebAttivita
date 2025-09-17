import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { apiService } from "../services/api";
import {
  Home,
  Users,
  BarChart3,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  LayoutList,
  FolderCode,
  Bell,
  ArrowUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  currentPage,
  onPageChange,
}) => {
  const { state } = useApp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        setShowScrollButton(contentRef.current.scrollTop > 300);
      }
    };

    const node = contentRef.current;
    node?.addEventListener("scroll", handleScroll);

    return () => node?.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updateUnreadCount = async () => {
    if (!user) return;

    try {
      const { count } = await apiService.getUnreadNotificationsCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Errore nel caricamento conteggio notifiche:", error);
    }
  };

  // Modifica l'useEffect esistente per esporre la funzione globalmente
  React.useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) return;

      try {
        const { count } = await apiService.getUnreadNotificationsCount();
        setUnreadCount(count);
      } catch (error) {
        console.error("Errore nel caricamento conteggio notifiche:", error);
      }
    };

    fetchUnreadCount();

    // Listener per evento personalizzato
    const handleNotificationUpdate = () => {
      fetchUnreadCount();
    };

    window.addEventListener("notificationsUpdated", handleNotificationUpdate);

    // Aggiorna ogni 30 secondi
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => {
      clearInterval(interval);
      window.removeEventListener(
        "notificationsUpdated",
        handleNotificationUpdate
      );
    };
  }, [user]);

  const menuItems = [
    { id: "dashboard", icon: Home, label: "Dashboard", count: null },
    { id: "task", icon: LayoutList, label: "Task", count: state.task.length },
    {
      id: "software",
      icon: FolderCode,
      label: "Software",
      count: state.software.length,
    },
    // Mostra la voce "Utenti" solo per gli utenti Admin
    ...(user?.role === "Admin"
      ? [
          { id: "users", icon: Users, label: "Utenti", count: null },
          { id: "logs", icon: BarChart3, label: "Log Attività", count: null },
        ]
      : []),
  ];

  const handlePageChange = (page: string) => {
    navigate(page === "dashboard" ? "/" : `/${page}`, { replace: true });
    setSidebarOpen(false);
  };

  // const handlePageChange = (page: string) => {
  //   onPageChange(page);
  //   setSidebarOpen(false); // Close sidebar on mobile after navigation
  //   // Dispatch navigate event to clear search term
  //   window.dispatchEvent(new CustomEvent('navigate', { detail: page }));
  // };

  const handleLogoClick = () => {
    onPageChange("dashboard");
    setSidebarOpen(false);
    // Dispatch navigate event to clear search term
    window.dispatchEvent(new CustomEvent("navigate", { detail: "dashboard" }));
  };
  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleLogoClick}
            >
              <BarChart3 className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
              <h1 className="text-lg lg:text-xl font-bold text-gray-800">
                TasksManager
              </h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <UserIcon className="h-4 w-4 text-gray-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.fullName}
                </p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
              {unreadCount > 0 && (
                <div
                  className="relative cursor-pointer"
                  onClick={() => handlePageChange("dashboard")}
                >
                  <Bell className="h-4 w-4 text-blue-600" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <nav className="mt-4 lg:mt-8">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handlePageChange(item.id)}
              className={`w-full flex items-center px-4 lg:px-6 py-3 text-left transition-colors duration-200 ${
                currentPage === item.id
                  ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              <span className="font-medium">{item.label}</span>
              {item.count !== null && (
                <span className="ml-auto bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={logout}
            className="w-full flex items-center px-4 py-3 text-left text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors duration-200"
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span className="font-medium">Esci</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <h1 className="text-lg font-bold text-gray-800">TasksManager</h1>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto">
          <div className="min-h-full p-4 lg:p-8">{children}</div>
        </div>
      </div>

      {/* Pulsante fisso per tornare all'header - AGGIUNGI QUESTO */}
      {showScrollButton && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg z-50 transition-all duration-300 transform hover:scale-110"
          aria-label="Torna all'inizio"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default Layout;
