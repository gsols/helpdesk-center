/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import { login as apiLogin, logout as apiLogout } from '../api/authApi';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('hd_user');
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('hd_token') || null);

  const login = async (username, password) => {
    const res = await apiLogin(username, password);
    const data = res.data;
    // Backend returns { token, userId, name, email, role, companyId, departmentId }
    const userData = {
      id: data.userId,
      name: data.name,
      email: data.email,
      role: data.role?.toLowerCase?.() ?? data.role,
      companyId: data.companyId,
      departmentId: data.departmentId,
    };
    setUser(userData);
    setToken(data.token);
    localStorage.setItem('hd_user', JSON.stringify(userData));
    localStorage.setItem('hd_token', data.token);
    return userData;
  };

  const logout = async () => {
    try { await apiLogout(); } catch { /* ignore */ }
    setUser(null);
    setToken(null);
    localStorage.removeItem('hd_user');
    localStorage.removeItem('hd_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Exported separately to satisfy react-refresh (only components as default export)
export function useAuth() { return useContext(AuthContext); }
