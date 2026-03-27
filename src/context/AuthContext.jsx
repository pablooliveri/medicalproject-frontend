import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { generateSessionId, setSessionId, clearSession } from '../utils/session';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const { data } = await authAPI.login({ username, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    const sessionId = generateSessionId();
    setSessionId(sessionId);
    setUser(data.user);
    return { ...data, sessionId };
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearSession();
    setUser(null);
  };

  const isSuperAdmin = user?.role === 'superadmin';

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    isSuperAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
