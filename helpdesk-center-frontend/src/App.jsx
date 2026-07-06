import { createBrowserRouter, RouterProvider, redirect, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TicketDetailPage from './pages/TicketDetailPage';

/**
 * Layout route that protects children — redirects to /login if not authenticated.
 * Uses React Router v7 loader pattern (Data API routing).
 */
function AuthGuard() {
  const { user } = useAuth();
  if (!user) {
    // We return null and let the router handle the redirect
    // (loaders cannot call hooks, so we use a component guard)
    window.location.replace('/login');
    return null;
  }
  return <Outlet />;
}

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return null;
  const role = user.role?.toLowerCase?.();
  if (role === 'employee')     { window.location.replace('/dashboard'); return null; }
  if (role === 'sys_admin')    { window.location.replace('/admin');     return null; }
  window.location.replace('/agent');
  return null;
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AuthGuardWrapper />,
    children: [
      { path: 'dashboard',   element: <EmployeeDashboard /> },
      { path: 'agent',       element: <AgentDashboard /> },
      { path: 'admin',       element: <AdminDashboard /> },
      { path: 'tickets/:id', element: <TicketDetailPage /> },
      { path: '*',           element: <RoleRedirect /> },
    ],
  },
  {
    path: '*',
    element: <RoleRedirect />,
  },
]);

function AuthGuardWrapper() {
  return (
    <AuthGuard />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
