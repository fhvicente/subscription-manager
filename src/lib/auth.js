'use client'

import { createContext, useCallback, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const API_URL = '/api';

// Create auth context
export const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // The session lives in an HttpOnly cookie that JS can't read, so ask the server who we are.
  // A 401 just means "logged out": public pages render this provider too.
  useEffect(() => {
    axios.get(`${API_URL}/auth/me`)
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Get current user
  const getCurrentUser = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/auth/me`);
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register user
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      const { user } = response.data;

      // Set user state
      setUser(user);
      
      return { success: true, user };
    } catch (error) {
      setError(error.response?.data?.error || 'Registration failed');
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { user } = response.data;

      // Set user state
      setUser(user);
      
      return { success: true, user };
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed');
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    await axios.post(`${API_URL}/auth/logout`).catch(() => {});
    setUser(null);
    router.push('/sign-in');
  };

  // Check if user is authenticated (false while the initial /auth/me is still loading)
  const isAuthenticated = useCallback(() => !!user, [user]);

  // Refresh user data
  const refreshUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error refreshing user:', error);
      if (error.response?.status === 401) {
        logout();
      }
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        register,
        login,
        logout,
        isAuthenticated,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Axios instance for protected pages; the session cookie is sent automatically (same origin)
export const createAuthenticatedApi = () => {
  const api = axios.create({
    baseURL: API_URL
  });

  // Add response interceptor to handle 401 errors
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      // The server already cleared the stale cookie on the 401.
      if (error.response?.status === 401) {
        window.location.href = '/sign-in';
      }
      return Promise.reject(error);
    }
  );

  return api;
};

export const api = createAuthenticatedApi(); 