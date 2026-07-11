import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TicketDetailPage from './pages/TicketDetailPage';
import TicketsIndexPage from './pages/TicketsIndexPage';
import SettingsPage from './pages/SettingsPage';
import ForbiddenPage from './pages/ForbiddenPage';
import ManagerDashboard from './pages/ManagerDashboard';
import TeamPage from './pages/TeamPage';
import TeammateWorkspacePage from './pages/TeammateWorkspacePage';

/**
 * Guards the protected subtree.
 * Must be rendered INSIDE the router (so useAuth / useNavigate work),
 * but AuthProvider is above the router — both live inside <AppRoot>.
 */
function AuthGuard() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/**
 * Redirects an authenticated user to their role-appropriate dashboard.
 * Shown on `/` and any unknown protected path.
 */
function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const role = user.role?.toLowerCase?.() ?? '';
  if (role === 'employee')     return <Navigate to="/dashboard" replace />;
  if (role === 'sys_admin')    return <Navigate to="/admin"     replace />;
  if (role === 'dept_manager') return <Navigate to="/manager"   replace />;
  return <Navigate to="/agent" replace />;
}

/**
 * The router is created once at module level.
 * AuthGuard and RoleRedirect are React components — they call useAuth()
 * only when they render, at which point AuthProvider is already mounted.
 * (Module-level createBrowserRouter just builds a config object; no hooks
 * are called until the route components actually render inside RouterProvider.)
 */
const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    // Protected subtree — AuthGuard checks auth before rendering children
    path: '/',
    element: <AuthGuard />,
    children: [
      { index: true,          element: <RoleRedirect /> },
      { path: 'dashboard',    element: <EmployeeDashboard /> },
      { path: 'agent',        element: <AgentDashboard /> },
      { path: 'agent/team',              element: <TeamPage /> },
      { path: 'agent/team/:peerId',      element: <TeammateWorkspacePage /> },
      { path: 'manager/team/:peerId',    element: <TeammateWorkspacePage /> },
      { path: 'agent/:id',    element: <AgentDashboard /> },
      { path: 'admin',        element: <AdminDashboard /> },
      { path: 'tickets',      element: <TicketsIndexPage /> },
      { path: 'tickets/:id',  element: <TicketDetailPage /> },
      { path: 'manager',      element: <ManagerDashboard /> },
      { path: 'manager/team',      element: <ManagerDashboard tab="team" /> },
      { path: 'manager/analytics', element: <ManagerDashboard tab="analytics" /> },
      { path: 'manager/risk',      element: <ManagerDashboard tab="risk" /> },
      { path: 'settings',     element: <SettingsPage /> },
      { path: '403',          element: <ForbiddenPage /> },
      { path: '*',            element: <RoleRedirect /> },
    ],
  },
  {
    // Catch-all outside the protected subtree
    path: '*',
    element: <RoleRedirect />,
  },
]);

/**
 * AppRoot mounts AuthProvider first, then RouterProvider.
 * All route components that call useAuth() will find the context populated.
 */
export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
