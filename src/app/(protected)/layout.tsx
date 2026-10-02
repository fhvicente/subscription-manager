"use client";

import React from "react";
// import { Card } from "@/components/ui/card";
import { UserButton } from "@/components/UserButton";
import Link from "next/link";
import Image from "next/image";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navigation header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <Link
                        href="/dashboard"
                        className="flex items-center justify-center gap-2 text-center text-2xl md:text-2xl font-bold text-slate-900 hover:opacity-80 transition-opacity"
                    >
                        <Image
                            src="/images/logo.png"
                            alt="logo"
                            width={40}
                            height={40}
                        />
                        {process.env.NEXT_PUBLIC_APP_NAME || "SubTrack"}
                    </Link>
                    <nav className="hidden md:flex space-x-6">
                        <Link
                            href="/dashboard"
                            className="text-slate-600 hover:text-slate-900"
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/subscriptions"
                            className="text-slate-600 hover:text-slate-900"
                        >
                            Subscriptions
                        </Link>
                        <Link
                            href="/settings"
                            className="text-slate-600 hover:text-slate-900"
                        >
                            Settings
                        </Link>
                    </nav>
                    <div className="flex items-center space-x-4">
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </header>

            {/* Mobile navigation */}
            <div className="md:hidden bg-white border-b border-slate-200 py-2">
                <div className="container mx-auto px-4 flex justify-between">
                    <Link
                        href="/dashboard"
                        className="text-sm text-slate-600 hover:text-slate-900"
                    >
                        Dashboard
                    </Link>
                    <Link
                        href="/subscriptions"
                        className="text-sm text-slate-600 hover:text-slate-900"
                    >
                        Subscriptions
                    </Link>
                    <Link
                        href="/settings"
                        className="text-sm text-slate-600 hover:text-slate-900"
                    >
                        Settings
                    </Link>
                </div>
            </div>

            {/* Main content */}
            <main className="container mx-auto px-4 py-6">{children}</main>
        </div>
    );
}
