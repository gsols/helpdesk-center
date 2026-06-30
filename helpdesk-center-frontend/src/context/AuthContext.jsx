import { createContext, useContext, useState } from 'react';
import { login as apiLogin, logout as apiLogout } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('hd_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (username, password) => {
    const res = await apiLogin(username, password);
    setUser(res.data);
    localStorage.setItem('hd_user', JSON.stringify(res.data));
    return res.data;
  };

  const logout = async () => {
    try { await apiLogout(); } catch (_) {}
    setUser(null);
    localStorage.removeItem('hd_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
