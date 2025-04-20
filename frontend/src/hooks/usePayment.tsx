'use client';

import { useApi } from '@/lib/api';
import { useState, useCallback, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

// Hook to manage payment and subscription functionality
export function usePayment() {
  const api = useApi();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTokenValid, setIsTokenValid] = useState(true);

  // Verificar se o token está presente e válido
  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      console.warn("Token não encontrado, redirecionando para login");
      setIsTokenValid(false);
    } else {
      setIsTokenValid(true);
    }
  }, []);

  // Função para lidar com erros de autenticação
  const handleAuthError = useCallback((err: any) => {
    if (err.response && err.response.status === 401) {
      console.warn("Erro de autenticação, token inválido ou expirado");
      setIsTokenValid(false);
      
      // Redirecionar para login após um breve delay
      setTimeout(() => {
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      }, 1000);
    }
    return err;
  }, [router]);
  
  // Create checkout session - use useCallback to prevent recreation on renders
  const createCheckoutSession = useCallback(async (plan: string) => {
    if (!isTokenValid) {
      setError('Sessão expirada. Faça login novamente.');
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/payments/session', { plan });
      return response.data;
    } catch (err: any) {
      handleAuthError(err);
      console.error('Error creating checkout session:', err);
      setError('Failed to create checkout session');
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, handleAuthError, isTokenValid]);
  
  // Get payment history - use useCallback to prevent recreation on renders
  const getPaymentHistory = useCallback(async () => {
    if (!isTokenValid) {
      setError('Sessão expirada. Faça login novamente.');
      return [];
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/payments/history');
      return response.data;
    } catch (err: any) {
      handleAuthError(err);
      console.error('Error fetching payment history:', err);
      setError('Failed to fetch payment history');
      return [];
    } finally {
      setLoading(false);
    }
  }, [api, handleAuthError, isTokenValid]);
  
  // Get subscription status - use useCallback to prevent recreation on renders
  const getSubscriptionStatus = useCallback(async () => {
    if (!isTokenValid) {
      setError('Sessão expirada. Faça login novamente.');
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/payments/status');
      return response.data;
    } catch (err: any) {
      handleAuthError(err);
      console.error('Error fetching subscription status:', err);
      setError('Failed to fetch subscription status');
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, handleAuthError, isTokenValid]);
  
  // Cancel subscription - use useCallback to prevent recreation on renders
  const cancelSubscription = useCallback(async () => {
    if (!isTokenValid) {
      setError('Sessão expirada. Faça login novamente.');
      throw new Error('Sessão expirada');
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/payments/cancel-subscription');
      return response.data;
    } catch (err: any) {
      handleAuthError(err);
      console.error('Error canceling subscription:', err);
      setError('Failed to cancel subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api, handleAuthError, isTokenValid]);
  
  // Get subscription status by session ID - use useCallback to prevent recreation on renders
  const getSubscriptionStatusBySession = useCallback(async (sessionId: string) => {
    if (!isTokenValid) {
      setError('Sessão expirada. Faça login novamente.');
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/payments/status/session?session_id=${sessionId}`);
      return response.data;
    } catch (err: any) {
      handleAuthError(err);
      console.error('Error fetching subscription status by session:', err);
      setError('Failed to fetch subscription status');
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, handleAuthError, isTokenValid]);
  
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
