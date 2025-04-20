'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePayment } from "@/hooks/usePayment";

// Define subscription type
interface Subscription {
  premiumUntil?: string;
  isActive?: boolean;
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const { getSubscriptionStatus } = usePayment();
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!sessionId) return;
      
      try {
        const status = await getSubscriptionStatus();
        setSubscription(status);
      } catch (error) {
        console.error('Error fetching subscription status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, [sessionId, getSubscriptionStatus]);

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
              <span className="font-medium">Plano:</span> Premium
            </p>
            {subscription.premiumUntil && (
              <p className="text-sm text-slate-600 mb-1">
                <span className="font-medium">Válido até:</span> {new Date(subscription.premiumUntil).toLocaleDateString('pt-BR')}
              </p>
            )}
            <p className="text-sm text-slate-600">
              <span className="font-medium">Status:</span> {subscription.isActive ? 'Ativo' : 'Inativo'}
            </p>
          </div>
        ) : null}

        <div className="space-y-3">
          <Button className="w-full" asChild>
            <Link href="/dashboard">Ir para o Dashboard</Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/subscriptions">Gerenciar Assinaturas</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
