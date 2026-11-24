import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '../api/authApi';
import axiosInstance, { clearGetCache } from '../api/axiosInstance';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('siddToken');
    if (!token || token === 'undefined' || token === 'null') {
      return null;
    }
    try {
      clearGetCache();
      const res = await axiosInstance.get('/auth/me', { cache: false });
      const userData = res.data?.data?.user || res.data?.user || res.data;
      if (userData && (userData.id || userData._id || userData.email)) {
        setUser(userData);
        setIsAuthenticated(true);
        return userData;
      }
    } catch (err) {
      console.warn('refreshUser warning:', err?.message);
    }
    return null;
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('siddToken');
      if (token && token !== 'undefined' && token !== 'null') {
        try {
          const res = await axiosInstance.get('/auth/me', { cache: false });
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
          const status = error.response?.status;
          // Clear token on explicit auth rejection; avoid wiping valid sessions during transient cold starts
          if (!status || status === 401 || status === 403) {
            if (status === 401 || status === 403) {
              localStorage.removeItem('siddToken');
            }
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } else {
        localStorage.removeItem('siddToken');
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      localStorage.removeItem('siddToken');
      setUser(null);
      setIsAuthenticated(false);
    };
    window.addEventListener('sidd-auth-expired', handleAuthExpired);
    return () => window.removeEventListener('sidd-auth-expired', handleAuthExpired);
  }, []);

  const login = async (credentials) => {
    const res = await apiLogin(credentials);
    const payload = res.data?.data || res.data;
    const token = payload?.token;
    const userData = payload?.user;
    if (!token || !userData) {
      throw new Error('Login response did not include a valid session token.');
    }
    localStorage.setItem('siddToken', token);
    clearGetCache();
    setUser(userData);
    setIsAuthenticated(true);
    return payload;
  };

  const register = async (data) => {
    const res = await apiRegister(data);
    const payload = res.data?.data || res.data;
    const token = payload?.token;
    const userData = payload?.user;
    if (!token || !userData) {
      throw new Error('Registration response did not include a valid session token.');
    }
    localStorage.setItem('siddToken', token);
    clearGetCache();
    setUser(userData);
    setIsAuthenticated(true);
    return payload;
  };

  const logout = () => {
    // Clear client session synchronously BEFORE hitting the network so a slow logout never races with a fresh login
    localStorage.removeItem('siddToken');
    clearGetCache();
    setUser(null);
    setIsAuthenticated(false);
    apiLogout().catch(() => {});
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
