'use client'

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Hero() {
    return (
        <section className="bg-gradient-to-br from-slate-50 to-slate-100 pt-32 pb-16 md:py-24 min-h-screen flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
                            Manage Your <span className="text-primary">Subscriptions</span> Effortlessly
                        </h1>
                        <p className="text-xl text-gray-700 mb-8">
                            Track all your subscriptions in one place, get renewal reminders, and save money by identifying unused services.
                        </p>
                        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                            <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                                <Link href="/sign-up">
                                    Start For Free
                                </Link>
                            </Button>
                            <Button asChild size="lg" variant="outline">
                                <Link href="#how-it-works">
                                    Learn More
                                </Link>
                            </Button>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <div className="bg-slate-200 h-80 w-full rounded-lg shadow-xl overflow-hidden relative">
                            <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="18" height="18" x="3" y="3" rx="2" />
                                    <path d="M3 9h18" />
                                    <path d="M9 21V9" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}