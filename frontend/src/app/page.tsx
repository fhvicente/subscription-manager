import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-slate-100">
            <div className="max-w-4xl w-full text-center">
                <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
                    {process.env.NEXT_PUBLIC_APP_NAME}
                </h1>
                <p className="text-xl md:text-2xl text-slate-700 mb-8">
                    Never forget to cancel subscriptions you don&apost use again. Save money and manage all your subscriptions in one place.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="bg-slate-900 hover:bg-slate-800">
                        <Link href="/sign-up">Começar Grátis</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                        <Link href="/sign-in">Entrar</Link>
                    </Button>
                </div>
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-3">Rastreie Assinaturas</h2>
                    <p className="text-slate-600">Acompanhe todas as suas assinaturas em um único lugar, com lembretes automáticos antes das renovações.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-3">Economize Dinheiro</h2>
                    <p className="text-slate-600">Identifique assinaturas não utilizadas e evite cobranças desnecessárias em sua conta.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-3">Visualize Gastos</h2>
                    <p className="text-slate-600">Veja relatórios detalhados dos seus gastos mensais com assinaturas por categoria.</p>
                </div>
            </div>
        </main>
    );
}