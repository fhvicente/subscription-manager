"use client";

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './auth';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create API context with proper typing
const ApiContext = createContext<AxiosInstance | null>(null);

// Add proper type for children props
interface ApiProviderProps {
  children: ReactNode;
}

export function ApiProvider({ children }: ApiProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const [apiClient] = useState<AxiosInstance>(() => {
    // Create axios instance once
    return axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });
  
  // Set up the interceptor only once
  useEffect(() => {
    const interceptorId = apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      try {
        if (!isAuthenticated()) {
          console.warn("User not authenticated");
          return config;
        }

        const token = Cookies.get('token');
        
        if (!token) {
          console.warn("Token not available");
          return config;
        }

        config.headers.set('Authorization', `Bearer ${token}`);
        return config;
      } catch (error) {
        console.error('Error getting token:', error);
        return Promise.reject(error);
      }
    });
    
    // Clean up interceptor when component unmounts
    return () => {
      apiClient.interceptors.request.eject(interceptorId);
    };
  }, [apiClient, isAuthenticated, user]);

  return (
    <ApiContext.Provider value={apiClient}>
      {children}
    </ApiContext.Provider>
  );
}

// Hook to use the API client with proper return type
export function useApi(): AxiosInstance {
  const apiClient = useContext(ApiContext);
  if (!apiClient) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return apiClient;
}