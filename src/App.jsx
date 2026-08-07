import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTraineesPage from "./pages/AdminTraineesPage";
import HistoryPage from "./pages/HistoryPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ResultPage from "./pages/ResultPage";
import ScenarioListPage from "./pages/ScenarioListPage";
import ScenarioManagerPage from "./pages/ScenarioManagerPage";
import ScenarioPlayerPage from "./pages/ScenarioPlayerPage";
import TraineeDashboard from "./pages/TraineeDashboard";

function HomeRedirect() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="page-content loading-screen"><div className="loader" /><p>Opening DrillDeck...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<HomeRedirect />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<ProtectedRoute roles={["trainee"]}><TraineeDashboard /></ProtectedRoute>} />
        <Route path="/scenarios" element={<ProtectedRoute roles={["trainee"]}><ScenarioListPage /></ProtectedRoute>} />
        <Route path="/scenarios/:id" element={<ProtectedRoute roles={["trainee"]}><ScenarioPlayerPage /></ProtectedRoute>} />
        <Route path="/result" element={<ProtectedRoute roles={["trainee"]}><ResultPage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute roles={["trainee"]}><HistoryPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/scenarios" element={<ProtectedRoute roles={["admin"]}><ScenarioManagerPage /></ProtectedRoute>} />
        <Route path="/admin/trainees" element={<ProtectedRoute roles={["admin"]}><AdminTraineesPage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
