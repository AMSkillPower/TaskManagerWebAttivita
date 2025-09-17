import  { useEffect } from "react";
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import LoginForm from "./components/LoginForm";
import Dashboard from "./components/Dashboard";
import TaskManager from "./components/TaskManager";
import TaskDetail from "./components/TaskDetail";
import SoftwareManager from "./components/SoftwareManager";
import UserManager from "./components/UserManager";
import TaskEdit from "./components/TaskEdit";
import TaskLogs from "./components/TaskLogs";

function App() {
  const { isAuthenticated } = useAuth();
  const [, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Aggiungi l'event listener per navigateWithSearch
  useEffect(() => {
    const handleNavigateWithSearch = (event: CustomEvent) => {
      const { page, searchTerm } = event.detail;
      navigate(`/${page}?search=${encodeURIComponent(searchTerm)}`);
    };

    window.addEventListener(
      "navigateWithSearch",
      handleNavigateWithSearch as EventListener
    );

    return () => {
      window.removeEventListener(
        "navigateWithSearch",
        handleNavigateWithSearch as EventListener
      );
    };
  }, [navigate]);

  // Se l'utente non è autenticato, mostra il form di login
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Determina la pagina corrente in base al percorso
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.startsWith("/task")) return "task";
    if (path.startsWith("/software")) return "software";
    if (path.startsWith("/users")) return "users";
    if (path.startsWith("/logs")) return "logs";
    return "dashboard";
  };

  const currentPage = getCurrentPage();

  const handlePageChange = (page: string) => {
    const newSearchParams = new URLSearchParams();
    setSearchParams(newSearchParams);
    navigate(page === "dashboard" ? "/" : `/${page}`);
  };

  return (
    <Layout currentPage={currentPage} onPageChange={handlePageChange}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/task" element={<TaskManager />} />
        <Route path="/task/:taskId" element={<TaskDetail />} />
        <Route path="/software" element={<SoftwareManager />} />
        <Route path="/users" element={<UserManager />} />
        <Route path="/task/:taskId/edit" element={<TaskEdit />} />
        <Route path="/logs" element={<TaskLogs />} />
      </Routes>
    </Layout>
  );
}

export default App;
