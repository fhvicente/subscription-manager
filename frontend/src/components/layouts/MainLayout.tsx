'use client'

import { ReactNode } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Footer from '@/components/Footer';

interface MainLayoutProps {
    children: ReactNode;
    showHero?: boolean;
}

export default function MainLayout({ children, showHero = false }: MainLayoutProps) {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            {showHero && <Hero />}
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
        </div>
    );
} 