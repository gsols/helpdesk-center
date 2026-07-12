/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, logout as apiLogout } from '../api/authApi';
import { queryClient } from '../main';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('hd_user');
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('hd_token') || null);

  // useNavigate requires this component to be inside a Router.
  // AuthProvider is mounted above RouterProvider in App.jsx — so we cannot call
  // useNavigate here directly. Instead we use a ref to the navigate function that
  // is injected by a child component once the router is ready.
  const navigateRef = useRef(null);

  const clearSession = useCallback(() => {
    queryClient.removeQueries();
    setUser(null);
    setToken(null);
    localStorage.removeItem('hd_user');
    localStorage.removeItem('hd_token');
  }, []);

  // Listen for the 'auth:unauthorized' event fired by axiosInstance when any
  // protected API call returns 401 (expired or invalid token).
  // Use a ref-flag to deduplicate: only the first 401 in a burst triggers the redirect.
  useEffect(() => {
    let redirecting = false;
    const handler = () => {
      if (redirecting) return;
      // If there is no token in localStorage at all, the user is already logged out
      // (e.g. they explicitly logged out in another tab) — skip.
      if (!localStorage.getItem('hd_token')) return;
      redirecting = true;
      clearSession();
      // Navigate via the ref if available (in-app SPA navigation), otherwise hard redirect.
      if (navigateRef.current) {
        navigateRef.current('/login', { replace: true });
      } else {
        window.location.href = '/login';
      }
    };
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
  }, [clearSession]);

  const login = async (email, password) => {
    const res = await apiLogin(email, password);
    const data = res.data;
    // Backend returns { token, userId, name, email, role, companyId, departmentId }
    const userData = {
      id: data.userId,
      name: data.name,
      email: data.email,
      role: data.role?.toLowerCase?.() ?? data.role,
      companyId: data.companyId,
      companyName: data.companyName ?? null,
      departmentId: data.departmentId,
      departmentName: data.departmentName ?? null,
    };
    // Clear any stale cache from a previous session before setting the new user —
    // prevents React Query from serving empty/wrong data on first render after login.
    queryClient.removeQueries();
    setUser(userData);
    setToken(data.token);
    localStorage.setItem('hd_user', JSON.stringify(userData));
    localStorage.setItem('hd_token', data.token);
    return userData;
  };

  const logout = async () => {
    try { await apiLogout(); } catch { /* ignore */ }
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, navigateRef }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Mounts inside the Router (via AuthGuard) and wires the navigate function
 * into AuthProvider's ref so force-logout can use SPA navigation.
 */
export function NavigateInjector() {
  const navigate = useNavigate();
  const { navigateRef } = useContext(AuthContext);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate, navigateRef]);
  return null;
}

// Exported separately to satisfy react-refresh (only components as default export)
export function useAuth() { return useContext(AuthContext); }
