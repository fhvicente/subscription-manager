import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">Bem-vindo ao Gestor de Assinaturas</h1>
          <p className="mt-2 text-slate-600">Vamos configurar sua conta para começar a economizar</p>
        </div>

        <Card className="bg-white shadow-sm p-6">
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Seu Nome</Label>
              <Input id="name" placeholder="Nome Completo" />
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-slate-900">Preferências de Notificação</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-700">Notificações por Email</p>
                  <p className="text-xs text-slate-500">Receba lembretes antes das renovações</p>
                </div>
                <input 
                  type="checkbox" 
                  id="emailEnabled" 
                  className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-500"
                  defaultChecked={true}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="daysBeforeRenewal">Dias de Antecedência para Notificações</Label>
                <select 
                  id="daysBeforeRenewal" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue="3"
                >
                  <option value="1">1 dia antes</option>
                  <option value="2">2 dias antes</option>
                  <option value="3">3 dias antes</option>
                  <option value="5">5 dias antes</option>
                  <option value="7">7 dias antes</option>
                </select>
              </div>
            </div>

            <div className="pt-4">
              <Button className="w-full" asChild>
                <Link href="/dashboard">Continuar para o Dashboard</Link>
              </Button>
            </div>
          </form>
        </Card>

        <div className="text-center text-sm text-slate-500">
          <p>Você pode adicionar suas assinaturas e ajustar suas configurações a qualquer momento.</p>
        </div>
      </div>
    </div>
  );
}
