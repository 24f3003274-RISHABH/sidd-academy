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
      if (token && token !== 'undefined' && token !== 'null') {
        try {
          const res = await getMe();
          const userData = res.data?.data?.user || res.data?.user || res.data;
          if (userData && (userData.id || userData._id || userData.email)) {
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('siddToken');
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          localStorage.removeItem('siddToken');
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        localStorage.removeItem('siddToken');
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (credentials) => {
    const res = await apiLogin(credentials);
    const payload = res.data?.data || res.data;
    const token = payload?.token;
    const userData = payload?.user;
    if (token) {
      localStorage.setItem('siddToken', token);
    }
    setUser(userData);
    setIsAuthenticated(true);
    return payload;
  };

  const register = async (data) => {
    const res = await apiRegister(data);
    const payload = res.data?.data || res.data;
    const token = payload?.token;
    const userData = payload?.user;
    if (token) {
      localStorage.setItem('siddToken', token);
    }
    setUser(userData);
    setIsAuthenticated(true);
    return payload;
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

  const completeAuthSession = (payload) => {
    const token = payload?.token;
    const userData = payload?.user;
    if (token) {
      localStorage.setItem('siddToken', token);
    }
    setUser(userData);
    setIsAuthenticated(true);
    return payload;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, register, logout, updateUser, completeAuthSession }}>
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
