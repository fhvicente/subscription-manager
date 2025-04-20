"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { api } from "@/lib/auth";
import { Loader2, Trash2 } from "lucide-react";

// Tipos
interface Subscription {
  id: string;
  name: string;
  price: number;
  description?: string;
  due_date: string;
  status: string;
  category?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export default function SubscriptionsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Fetch subscriptions on component mount
  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Fetch subscriptions from API
  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/subscriptions');
      setSubscriptions(response.data);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      alert("Não foi possível carregar suas assinaturas. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete subscription
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta assinatura?")) {
      return;
    }

    try {
      setIsDeleting(id);
      await api.delete(`/subscriptions/${id}`);
      // Update local state by filtering out the deleted subscription
      setSubscriptions(prevSubscriptions => 
        prevSubscriptions.filter(sub => sub.id !== id)
      );
    } catch (error) {
      console.error("Error deleting subscription:", error);
      alert("Não foi possível excluir a assinatura. Tente novamente mais tarde.");
    } finally {
      setIsDeleting(null);
    }
  };

  // Calculate monthly amount (placeholder for frequency logic)
  const getFrequency = (subscription: Subscription) => {
    // This is placeholder logic - in a real app, you'd have a frequency field
    return subscription.description?.includes('yearly') ? 'yearly' : 'monthly';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Minhas Assinaturas</h1>
        <Button asChild>
          <Link href="/subscriptions/new">Adicionar Assinatura</Link>
        </Button>
      </div>

      {/* Subscriptions List */}
      <Card className="bg-white shadow-sm overflow-hidden">
        {subscriptions.length > 0 ? (
          <div className="divide-y divide-slate-200">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-slate-900">{sub.name}</h3>
                  <p className="text-sm text-slate-500">
                    Renovação: {new Date(sub.due_date).toLocaleDateString('pt-BR')} • {sub.category || 'Outros'}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <p className="font-medium text-slate-900">€ {sub.price.toFixed(2)}/{getFrequency(sub) === 'monthly' ? 'mês' : 'ano'}</p>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/subscriptions/${sub.id}`}>Editar</Link>
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDelete(sub.id)}
                      disabled={isDeleting === sub.id}
                    >
                      {isDeleting === sub.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500">
            Você não tem assinaturas cadastradas. Adicione sua primeira assinatura!
          </div>
        )}
      </Card>
    </div>
  );
}
