import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setAccessToken, clearAccessToken } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session via rotating refresh token cookie on application load
  const restoreSession = useCallback(async () => {
    try {
      const response = await api.post('/auth/refresh');
      const { user: refreshedUser, accessToken } = response.data.data;
      setUser(refreshedUser);
      setToken(accessToken);
      setAccessToken(accessToken);
      connectSocket(accessToken);
    } catch (err) {
      // Session expired or unauthenticated; silently clear state
      setUser(null);
      setToken(null);
      clearAccessToken();
      disconnectSocket();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { user: loggedInUser, accessToken } = response.data.data;
    setUser(loggedInUser);
    setToken(accessToken);
    setAccessToken(accessToken);
    connectSocket(accessToken);
    return loggedInUser;
  };

  const signup = async (userData) => {
    const response = await api.post('/auth/signup', userData);
    const { user: registeredUser, accessToken } = response.data.data;
    setUser(registeredUser);
    setToken(accessToken);
    setAccessToken(accessToken);
    connectSocket(accessToken);
    return registeredUser;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout API warning:', err.message);
    } finally {
      setUser(null);
      setToken(null);
      clearAccessToken();
      disconnectSocket();
    }
  };

  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    restoreSession,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
