import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe, login as apiLogin, register as apiRegister, logout as apiLogout } from '../api/authApi';
import toast from 'react-hot-toast';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('siddToken');
      if (token) {
        try {
          const res = await getMe();
          setUser(res.data.user || res.data); // depends on backend response
          setIsAuthenticated(true);
        } catch (error) {
          localStorage.removeItem('siddToken');
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (credentials) => {
    const res = await apiLogin(credentials);
    localStorage.setItem('siddToken', res.data.token);
    setUser(res.data.user);
    setIsAuthenticated(true);
    return res.data;
  };

  const register = async (data) => {
    const res = await apiRegister(data);
    localStorage.setItem('siddToken', res.data.token);
    setUser(res.data.user);
    setIsAuthenticated(true);
    return res.data;
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch(e) {
      console.error(e);
    }
    localStorage.removeItem('siddToken');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Convenience hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
