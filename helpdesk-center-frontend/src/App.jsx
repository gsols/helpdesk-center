import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TicketDetailPage from './pages/TicketDetailPage';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function RoleRoute() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'employee')      return <Navigate to="/dashboard" replace />;
  if (user.role === 'administrator') return <Navigate to="/admin"     replace />;
  return <Navigate to="/agent" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"       element={<LoginPage />} />
      <Route path="/dashboard"   element={<ProtectedRoute><EmployeeDashboard /></ProtectedRoute>} />
      <Route path="/agent"       element={<ProtectedRoute><AgentDashboard /></ProtectedRoute>} />
      <Route path="/admin"       element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/tickets/:id" element={<ProtectedRoute><TicketDetailPage /></ProtectedRoute>} />
      <Route path="*"            element={<RoleRoute />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
