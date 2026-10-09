'use client'

import { createContext, useCallback, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { createAuthClient } from 'better-auth/react';
import { useRouter } from 'next/navigation';

const API_URL = '/api';

// Same origin, so no baseURL: it talks to /api/auth/* (better-auth).
const authClient = createAuthClient();

// Our user row (plan, isAdmin, ...), which the better-auth session doesn't carry.
const fetchProfile = async () => (await axios.get(`${API_URL}/users/profile`)).data;

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
    fetchProfile()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // better-auth answers { data, error } instead of throwing; map both to what the pages expect.
  const authenticate = async (call, fallback) => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await call();
      if (error) throw new Error(error.message || fallback);
      const user = await fetchProfile();
      setUser(user);
      return { success: true, user };
    } catch (e) {
      const message = e.message || fallback;
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const register = (userData) => authenticate(() => authClient.signUp.email(userData), 'Registration failed');

  const login = (email, password) => authenticate(() => authClient.signIn.email({ email, password }), 'Login failed');

  const logout = async () => {
    await authClient.signOut().catch(() => {});
    setUser(null);
    router.push('/sign-in');
  };

  // Check if user is authenticated (false while the initial profile load is still loading)
  const isAuthenticated = useCallback(() => !!user, [user]);

  // Refresh user data
  const refreshUser = async () => {
    try {
      const userData = await fetchProfile();
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