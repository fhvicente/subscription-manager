'use client';

import { useApi } from '@/lib/api';
import { useState, useCallback, useEffect } from 'react';
import Cookies from 'js-cookie';

// Hook to manage payment and subscription functionality
export function usePayment() {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTokenValid, setIsTokenValid] = useState(true);

  // Check if the token is present and valid
  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      console.warn("Token not found, redirecting to login");
      setIsTokenValid(false);
    } else {
      setIsTokenValid(true);
    }
  }, []);

  // Function to handle errors (no longer specifically 401)
  const handleApiError = useCallback((err: Error & { response?: { status: number } }) => {
    // The global Axios interceptor already handles 401 (removes token and redirects)
    // We can log other errors here if needed, or just return the error.
    console.error('API Error caught in usePayment:', err);
    // No more redirects from here, let the interceptor handle it.
    return err;
  }, []); // Removed [router] as dependency
  
  // Create checkout session - use useCallback to prevent recreation on renders
  const createCheckoutSession = useCallback(async (plan: string) => {
    if (!isTokenValid) {
      setError('Session expired. Please login again.');
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/payments/session', { plan });
      return response.data;
    } catch (err: unknown) {
      if (err && typeof err === 'object') {
         // Calling the generic error function now
        handleApiError(err as Error & { response?: { status: number } });
      }
      console.error('Error creating checkout session:', err);
      setError('Failed to create checkout session');
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, handleApiError, isTokenValid]); // Updated dependency
  
  // Get payment history - use useCallback to prevent recreation on renders
  const getPaymentHistory = useCallback(async () => {
    if (!isTokenValid) {
      setError('Session expired. Please login again.');
      return [];
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/payments/history');
      return response.data;
    } catch (err: unknown) {
      if (err && typeof err === 'object') {
        handleApiError(err as Error & { response?: { status: number } });
      }
      console.error('Error fetching payment history:', err);
      setError('Failed to fetch payment history');
      return [];
    } finally {
      setLoading(false);
    }
  }, [api, handleApiError, isTokenValid]); // Updated dependency
  
  // Get subscription status - use useCallback to prevent recreation on renders
  const getSubscriptionStatus = useCallback(async () => {
    if (!isTokenValid) {
      setError('Session expired. Please login again.');
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/payments/status');
      return response.data;
    } catch (err: unknown) {
      if (err && typeof err === 'object') {
        handleApiError(err as Error & { response?: { status: number } });
      }
      console.error('Error fetching subscription status:', err);
      setError('Failed to fetch subscription status');
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, handleApiError, isTokenValid]); // Updated dependency
  
  // Cancel subscription - use useCallback to prevent recreation on renders
  const cancelSubscription = useCallback(async () => {
    if (!isTokenValid) {
      setError('Session expired. Please login again.');
      throw new Error('Session expired');
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/payments/cancel-subscription');
      return response.data;
    } catch (err: unknown) {
      if (err && typeof err === 'object') {
        handleApiError(err as Error & { response?: { status: number } });
      }
      console.error('Error canceling subscription:', err);
      setError('Failed to cancel subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api, handleApiError, isTokenValid]); // Updated dependency
  
  // Get subscription status by session ID - use useCallback to prevent recreation on renders
  const getSubscriptionStatusBySession = useCallback(async (sessionId: string) => {
    if (!isTokenValid) {
      setError('Session expired. Please login again.');
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/payments/status/session?session_id=${sessionId}`);
      return response.data;
    } catch (err: unknown) {
      const axiosError = err as Error & { response?: { status: number } }; // Type assertion for clarity
      handleApiError(axiosError); // Log the error
      
      console.error('Error fetching subscription status by session:', err);
      
      // Only set the generic error message if it's *not* a 401 error
      // because the interceptor will handle the 401 redirect.
      if (axiosError.response?.status !== 401) {
         setError('Failed to fetch subscription status');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, handleApiError, isTokenValid]); // Updated dependency
  
  return {
    loading,
    error,
    isTokenValid,
    createCheckoutSession,
    getPaymentHistory,
    getSubscriptionStatus,
    getSubscriptionStatusBySession,
    cancelSubscription
  };
}
