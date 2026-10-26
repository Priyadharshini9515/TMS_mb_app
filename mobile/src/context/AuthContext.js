import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load saved token from AsyncStorage on startup
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        if (storedToken) {
          setToken(storedToken);
          const res = await authService.getProfile();
          setUser(res.data);
        }
      } catch (err) {
        const status = err.response?.status;
        const profileNotFound = err.response?.data?.message === 'User not found';

        if (status === 401 || (status === 404 && profileNotFound)) {
          await AsyncStorage.removeItem('token');
        } else {
          console.error('Session restore failed:', err);
        }

        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadStoredAuth();
  }, []);

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    const { token: newToken, user: userData } = response.data;
    await AsyncStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    return response.data;
  };

  const register = async (userData) => {
    const response = await authService.register(userData);
    return response.data;
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
    } catch (e) {
      console.error('Error during logout storage removal:', e);
    }
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const res = await authService.getProfile();
      setUser(res.data);
    } catch (err) {
      console.error('Failed to refresh profile', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
