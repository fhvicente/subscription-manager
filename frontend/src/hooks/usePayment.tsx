'use client';

import { useApi } from '@/lib/api';
import { useState, useCallback } from 'react';

// Hook to manage payment and subscription functionality
export function usePayment() {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Create checkout session - use useCallback to prevent recreation on renders
  const createCheckoutSession = useCallback(async (plan: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Creating checkout session for plan: ${plan}`);
      const response = await api.post('/payments/session', { plan });
      return response.data;
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError('Failed to create checkout session');
      return null;
    } finally {
      setLoading(false);
    }
  }, [api]);
  
  // Get payment history - use useCallback to prevent recreation on renders
  const getPaymentHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/payments/history');
      return response.data;
    } catch (err) {
      console.error('Error fetching payment history:', err);
      setError('Failed to fetch payment history');
      return [];
    } finally {
      setLoading(false);
    }
  }, [api]);
  
  // Get subscription status - use useCallback to prevent recreation on renders
  const getSubscriptionStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/payments/subscription-status');
      return response.data;
    } catch (err) {
      console.error('Error fetching subscription status:', err);
      setError('Failed to fetch subscription status');
      return null;
    } finally {
      setLoading(false);
    }
  }, [api]);
  
  return {
    loading,
    error,
    createCheckoutSession,
    getPaymentHistory,
    getSubscriptionStatus
  };
}
