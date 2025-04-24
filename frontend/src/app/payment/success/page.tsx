'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePayment } from "@/hooks/usePayment";
import Cookies from 'js-cookie';
import { useAuth } from "@/lib/auth";

// Define subscription type
interface Subscription {
  plan?: string;
  premiumUntil?: string;
  isActive?: boolean;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const { isTokenValid, getSubscriptionStatusBySession } = usePayment();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const { isAuthenticated } = useAuth();

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!isAuthenticated() || !Cookies.get('token')) {
      console.warn("Usuário não autenticado, redirecionando para login");
      setAuthError(true);
      
      // Redirecionar após um breve delay
      setTimeout(() => {
        router.push('/login?redirect=/payment/success');
      }, 2000);
    }
  }, [isAuthenticated, router]);

  // Configurar contador para redirecionamento automático
  useEffect(() => {
    if (subscription?.isActive) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/settings');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [subscription, router]);

  // Função para buscar status da assinatura
  const fetchSubscriptionStatus = useCallback(async () => {
    if (!sessionId || authError || !isTokenValid) return;
    
    try {
      setRefreshing(true);
      const status = await getSubscriptionStatusBySession(sessionId);
      setSubscription(status);
      return status;
    } catch (error) {
      console.error('Erro ao buscar status da assinatura:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sessionId, authError, isTokenValid, getSubscriptionStatusBySession]);

  useEffect(() => {
    if (isAuthenticated() && isTokenValid) {
      fetchSubscriptionStatus();
      
      // Tentar buscar o status novamente após 5 segundos se não estiver ativo
      const timeoutId = setTimeout(() => {
        if (subscription && !subscription.isActive) {
          fetchSubscriptionStatus();
        }
      }, 5000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [sessionId, getSubscriptionStatusBySession, isAuthenticated, isTokenValid, fetchSubscriptionStatus, subscription]);

  if (authError) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white shadow-sm p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Sessão Expirada</h1>
            <p className="text-slate-600 mb-6">
              Sua sessão expirou. Por favor, faça login novamente para verificar o status do seu pagamento.
            </p>
            <Button className="w-full" asChild>
              <Link href="/login?redirect=/payment/success">Fazer Login</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Card className="max-w-md w-full bg-white shadow-sm p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Pagamento Confirmado!</h1>
          <p className="text-slate-600">
            Seu plano premium foi ativado com sucesso. Agora você tem acesso a todos os recursos premium.
          </p>
        </div>

        {loading ? (
          <p className="text-slate-600">Carregando detalhes da assinatura...</p>
        ) : subscription ? (
          <div className="bg-slate-50 p-4 rounded-md mb-6 text-left">
            <h2 className="font-medium text-slate-900 mb-2">Detalhes da Assinatura</h2>
            <p className="text-sm text-slate-600 mb-1">
              <span className="font-medium">Plano:</span> {subscription.plan === 'premium' ? 'Premium' : 'Gratuito'}
            </p>
            {subscription.premiumUntil && (
              <p className="text-sm text-slate-600 mb-1">
                <span className="font-medium">Válido até:</span> {new Date(subscription.premiumUntil).toLocaleDateString('pt-BR')}
              </p>
            )}
            <p className="text-sm text-slate-600">
              <span className="font-medium">Status:</span> {subscription.isActive ? 'Ativo' : 'Inativo'}
            </p>
            
            {!subscription.isActive && (
              <div className="mt-3">
                <p className="text-xs text-amber-700">
                  Seu pagamento foi processado, mas o plano premium ainda não foi ativado. 
                  Isso pode levar alguns instantes.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 text-xs" 
                  onClick={fetchSubscriptionStatus}
                  disabled={refreshing}
                >
                  {refreshing ? 'Atualizando...' : 'Verificar novamente'}
                </Button>
              </div>
            )}
            
            {subscription.isActive && (
              <div className="mt-4 text-center">
                <p className="text-xs text-slate-500 mb-2">
                  Redirecionando para configurações em {timeLeft} segundos...
                </p>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(10 - timeLeft) * 10}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="space-y-3">
          <Button className="w-full" asChild>
            <Link href="/dashboard">Ir para o Dashboard</Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/settings">Ver Configurações</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

// Loading fallback component
function PaymentLoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Card className="max-w-md w-full bg-white shadow-sm p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="animate-spin h-8 w-8 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Carregando...</h1>
          <p className="text-slate-600">
            Estamos verificando seu pagamento.
          </p>
        </div>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentLoadingFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
