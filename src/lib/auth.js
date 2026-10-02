'use client'

import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
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

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get('token');
      if (token) {
        try {
          const userData = await getCurrentUser(token);
          setUser(userData);
        } catch (error) {
          console.error('Error checking auth:', error);
          Cookies.remove('token');
          setUser(null);
          router.push('/sign-in');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  // Get current user
  const getCurrentUser = async (token) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      const { token, user } = response.data;
      
      // Save token to cookie
      Cookies.set('token', token, { expires: 7 }); // 7 days expiry
      
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
      const { token, user } = response.data;
      
      // Save token to cookie
      Cookies.set('token', token, { expires: 7 }); // 7 days expiry
      
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
  const logout = () => {
    Cookies.remove('token');
    setUser(null);
    router.push('/sign-in');
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    const token = Cookies.get('token');
    return !!token; // Simplified check - if there's a token, consider authenticated
  };

  // Refresh user data
  const refreshUser = async () => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const userData = await getCurrentUser(token);
        setUser(userData);
        return userData;
      } catch (error) {
        console.error('Error refreshing user:', error);
        if (error.response?.status === 401) {
          logout();
        }
        throw error;
      }
    }
    return null;
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

// Create axios instance with auth token
export const createAuthenticatedApi = () => {
  const api = axios.create({
    baseURL: API_URL
  });

  // Add request interceptor to include auth token
  api.interceptors.request.use(
    (config) => {
      const token = Cookies.get('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add response interceptor to handle 401 errors
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        Cookies.remove('token');
        window.location.href = '/sign-in';
      }
      return Promise.reject(error);
    }
  );

  return api;
};

export const api = createAuthenticatedApi(); 