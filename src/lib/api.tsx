"use client";

import axios, { AxiosInstance } from 'axios';
import { createContext, useContext, useState, ReactNode } from 'react';

const API_URL = '/api';

// Create API context with proper typing
const ApiContext = createContext<AxiosInstance | null>(null);

// Add proper type for children props
interface ApiProviderProps {
  children: ReactNode;
}

export function ApiProvider({ children }: ApiProviderProps) {
  // The session cookie is HttpOnly and sent automatically on same-origin requests, so no auth header.
  const [apiClient] = useState<AxiosInstance>(() =>
    axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  );

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