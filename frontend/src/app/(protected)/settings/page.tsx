"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { usePayment } from "@/hooks/usePayment";

// Interfaces para tipagem
interface NotificationSettings {
  id?: string;
  user_id?: string;
  email_enabled: number;
  sms_enabled: number;
  push_enabled: number;
  days_before_renewal: number;
  phone_number: string;
  created_at?: string;
  updated_at?: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  plan: string;
  premiumUntil?: string;
  created_at?: string;
  updated_at?: string;
}

interface SubscriptionStatus {
  plan: string;
  premiumUntil?: string;
  isActive: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const { getSubscriptionStatus, cancelSubscription } = usePayment();
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [showSuccessProfile, setShowSuccessProfile] = useState(false);
  const [showSuccessNotifications, setShowSuccessNotifications] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [error, setError] = useState("");

  // Estados para formulários
  const [profileForm, setProfileForm] = useState({
    name: ""
  });

  const [notificationsForm, setNotificationsForm] = useState({
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: false,
    daysBeforeRenewal: 3,
    phoneNumber: ""
  });

  // Buscar status da assinatura
  const fetchSubscriptionStatus = async () => {
    try {
      const status = await getSubscriptionStatus();
      setSubscriptionStatus(status);
      return status;
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      return null;
    }
  };

  // Força uma atualização ao montar o componente e a cada 30 segundos
  useEffect(() => {
    fetchSubscriptionStatus();
    
    // Verificar as configurações de usuário periodicamente
    const intervalId = setInterval(fetchSubscriptionStatus, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Buscar dados do usuário e configurações de notificação
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        setError("");

        // Buscar perfil do usuário
        const userResponse = await api.get('/users/profile');
        const userData = userResponse.data;
        setUser(userData);
        setProfileForm({
          name: userData.name
        });

        // Buscar status da assinatura
        const status = await fetchSubscriptionStatus();
        
        // Buscar configurações de notificação
        try {
          const notificationsResponse = await api.get('/notifications/settings');
          const notificationsData = notificationsResponse.data;
          setNotificationSettings(notificationsData);
          
          // Configurar o estado do formulário de notificações
          setNotificationsForm({
            emailEnabled: notificationsData.email_enabled === 1,
            smsEnabled: notificationsData.sms_enabled === 1,
            pushEnabled: notificationsData.push_enabled === 1,
            daysBeforeRenewal: notificationsData.days_before_renewal,
            phoneNumber: notificationsData.phone_number || ""
          });
        } catch (notifError) {
          console.error("Error fetching notification settings:", notifError);
          // Se não conseguir buscar as configurações, mantemos os valores padrão
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Não foi possível carregar suas configurações. Tente novamente mais tarde.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Handlers para alterações nos formulários
  const handleProfileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, name, value, type } = e.target;
    const fieldName = id || name;
    
    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;
      setNotificationsForm(prev => ({ 
        ...prev, 
        [fieldName]: checkbox.checked 
      }));
    } else {
      setNotificationsForm(prev => ({ 
        ...prev, 
        [fieldName]: value 
      }));
    }
  };

  // Handlers para submissão dos formulários
  const handleProfileSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setIsSavingProfile(true);
      
      await api.put('/users/profile', { 
        name: profileForm.name 
      });
      
      // Mostrar mensagem de sucesso
      setShowSuccessProfile(true);
      setTimeout(() => setShowSuccessProfile(false), 3000);
      
      // Atualizar o estado do usuário
      if (user) {
        setUser({
          ...user,
          name: profileForm.name
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Não foi possível atualizar o perfil. Tente novamente mais tarde.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleNotificationsSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setIsSavingNotifications(true);
      
      const payload = {
        email_enabled: notificationsForm.emailEnabled ? 1 : 0,
        sms_enabled: notificationsForm.smsEnabled ? 1 : 0,
        push_enabled: notificationsForm.pushEnabled ? 1 : 0,
        days_before_renewal: parseInt(notificationsForm.daysBeforeRenewal.toString()),
        phone_number: notificationsForm.phoneNumber
      };
      
      console.log("Sending notification settings:", payload);
      
      await api.put('/notifications/settings', payload);
      
      // Mostrar mensagem de sucesso
      setShowSuccessNotifications(true);
      setTimeout(() => setShowSuccessNotifications(false), 3000);
      
      // Atualizar o estado das configurações de notificação
      if (notificationSettings) {
        setNotificationSettings({
          ...notificationSettings,
          email_enabled: payload.email_enabled,
          sms_enabled: payload.sms_enabled,
          push_enabled: payload.push_enabled,
          days_before_renewal: payload.days_before_renewal,
          phone_number: payload.phone_number
        });
      }
    } catch (error) {
      console.error("Error updating notification settings:", error);
      alert("Não foi possível atualizar as configurações de notificação. Tente novamente mais tarde.");
    } finally {
      setIsSavingNotifications(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-red-600">{error}</h1>
        <Button className="mt-4" onClick={() => router.refresh()}>
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>

      {/* Profile Settings */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Perfil</h2>
        <Card className="bg-white shadow-sm p-6 relative">
          {showSuccessProfile && (
            <div className="absolute top-2 right-2 flex items-center bg-green-100 text-green-600 px-3 py-1 rounded">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              <span className="text-sm">Salvo</span>
            </div>
          )}
          <form className="space-y-4" onSubmit={handleProfileSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input 
                id="name" 
                name="name"
                value={profileForm.name}
                onChange={handleProfileChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ""} disabled />
              <p className="text-xs text-slate-500">Email gerenciado pela sua conta de login</p>
            </div>
            <div className="pt-2">
              <Button type="submit" disabled={isSavingProfile}>
                {isSavingProfile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Notification Settings */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Notificações</h2>
        <Card className="bg-white shadow-sm p-6 relative">
          {showSuccessNotifications && (
            <div className="absolute top-2 right-2 flex items-center bg-green-100 text-green-600 px-3 py-1 rounded">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              <span className="text-sm">Salvo</span>
            </div>
          )}
          <form className="space-y-4" onSubmit={handleNotificationsSubmit}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-slate-900">Notificações por Email</h3>
                <p className="text-sm text-slate-500">Receba lembretes por email antes das renovações</p>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="emailEnabled" 
                  className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-500"
                  checked={notificationsForm.emailEnabled}
                  onChange={handleNotificationChange}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-slate-900">Notificações por SMS</h3>
                <p className="text-sm text-slate-500">Receba lembretes por SMS antes das renovações</p>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="smsEnabled" 
                  className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-500"
                  checked={notificationsForm.smsEnabled}
                  onChange={handleNotificationChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Número de Telefone (para SMS)</Label>
              <Input 
                id="phoneNumber" 
                placeholder="+55 (11) 98765-4321" 
                value={notificationsForm.phoneNumber}
                onChange={handleNotificationChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="daysBeforeRenewal">Dias de Antecedência para Notificações</Label>
              <select 
                id="daysBeforeRenewal" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={notificationsForm.daysBeforeRenewal}
                onChange={handleNotificationChange}
              >
                <option value="1">1 dia antes</option>
                <option value="2">2 dias antes</option>
                <option value="3">3 dias antes</option>
                <option value="5">5 dias antes</option>
                <option value="7">7 dias antes</option>
              </select>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={isSavingNotifications}>
                {isSavingNotifications ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : "Salvar Configurações"}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Subscription Plan */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Plano de Assinatura</h2>
        <Card className="bg-white shadow-sm p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-slate-900">
                Plano Atual: {subscriptionStatus?.plan === 'premium' ? 'Premium' : 'Gratuito'}
              </h3>
              {subscriptionStatus?.plan === 'premium' && subscriptionStatus.premiumUntil && (
                <p className="text-sm text-slate-700 mt-1">
                  <span className="font-medium">Válido até:</span> {new Date(subscriptionStatus.premiumUntil).toLocaleDateString('pt-BR')}
                </p>
              )}
              <p className="text-sm text-slate-500 mt-2">
                {subscriptionStatus?.plan !== 'premium' 
                  ? 'Limitado a 3 assinaturas. Atualize para o plano premium para recursos ilimitados.' 
                  : 'Você tem acesso a todos os recursos premium.'}
              </p>
            </div>
            
            {subscriptionStatus?.plan !== 'premium' ? (
              <Button asChild>
                <a href="/payment">Atualizar para Premium</a>
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">Você pode cancelar seu plano Premium a qualquer momento. Após o cancelamento, você continuará tendo acesso aos recursos premium até o final do período pago.</p>
                <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={async () => {
                  if (confirm("Tem certeza que deseja cancelar seu plano Premium? Você continuará tendo acesso aos recursos premium até o final do período pago.")) {
                    try {
                      await cancelSubscription();
                      alert("Seu plano foi cancelado com sucesso!");
                      // Atualizar o status da assinatura após o cancelamento
                      await fetchSubscriptionStatus();
                      router.refresh();
                    } catch (error) {
                      console.error("Erro ao cancelar assinatura:", error);
                      alert("Não foi possível cancelar sua assinatura. Tente novamente mais tarde.");
                    }
                  }
                }}>
                  Cancelar Assinatura
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
