"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@/components/UserButton";
import Logo from "@/components/Logo";
import { useAuth } from "@/lib/auth";

const NAV = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/subscriptions", label: "Subscriptions" },
    { href: "/settings", label: "Settings" },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { user } = useAuth();
    const home = user?.isAdmin ? "/admin" : "/dashboard";
    const nav = user?.isAdmin ? [{ href: home, label: "Admin" }, ...NAV.slice(1)] : NAV;
    const isActive = (href: string) =>
        pathname === href || pathname.startsWith(`${href}/`);

    return (
        <div className="min-h-screen bg-paper">
            <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
                    <Link href={home} aria-label="SubTrack home" className="text-ink">
                        <Logo />
                    </Link>
                    <nav
                        aria-label="Main"
                        className="hidden items-center gap-1 rounded-full bg-ink/[0.05] p-1 md:flex"
                    >
                        {nav.map((n) => (
                            <Link
                                key={n.href}
                                href={n.href}
                                aria-current={isActive(n.href) ? "page" : undefined}
                                className="rounded-full px-4 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:text-ink aria-[current=page]:bg-ink aria-[current=page]:text-paper"
                            >
                                {n.label}
                            </Link>
                        ))}
                    </nav>
                    <UserButton afterSignOutUrl="/" />
                </div>

                {/* Mobile navigation */}
                <nav
                    aria-label="Main"
                    className="flex gap-1 overflow-x-auto px-5 pb-3 md:hidden"
                >
                    {nav.map((n) => (
                        <Link
                            key={n.href}
                            href={n.href}
                            aria-current={isActive(n.href) ? "page" : undefined}
                            className="rounded-full px-4 py-1.5 text-sm font-semibold text-ink-soft aria-[current=page]:bg-ink aria-[current=page]:text-paper"
                        >
                            {n.label}
                        </Link>
                    ))}
                </nav>
            </header>

            <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 md:py-14">
                {children}
            </main>
        </div>
    );
}
