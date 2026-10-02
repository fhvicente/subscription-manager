"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { gsap, ScrollTrigger, useGSAP, MOTION_OK } from "@/lib/gsap";
import { cn } from "@/lib/utils";

export default function Header() {
    const { isAuthenticated, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    const barRef = useRef<HTMLElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const authed = isAuthenticated();

    useEffect(() => setOpen(false), [pathname]);

    // Solid pill once scrolled; slide away on scroll down, back on scroll up.
    useGSAP(() => {
        const st = ScrollTrigger.create({
            start: 0,
            end: "max",
            onUpdate: (self) => {
                setScrolled(self.scroll() > 24);
                if (!window.matchMedia(MOTION_OK).matches) return;
                gsap.to(barRef.current, {
                    yPercent: self.direction === 1 && self.scroll() > 400 ? -140 : 0,
                    duration: 0.6,
                    overwrite: "auto",
                });
            },
        });
        return () => st.kill();
    });

    useGSAP(
        () => {
            if (!open || !window.matchMedia(MOTION_OK).matches) return;
            gsap.from(".menu-item", { yPercent: 110, stagger: 0.06, duration: 0.9 });
        },
        { dependencies: [open], scope: menuRef }
    );

    const links = [
        { href: "/#features", label: "Features" },
        { href: "/#how-it-works", label: "How it works" },
        ...(authed
            ? [
                  { href: "/dashboard", label: "Dashboard" },
                  { href: "/settings", label: "Settings" },
              ]
            : [{ href: "/sign-in", label: "Sign in" }]),
    ];

    return (
        <>
            <header
                ref={barRef}
                className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4"
            >
                <nav
                    className={cn(
                        "mx-auto flex max-w-7xl items-center justify-between rounded-full py-2 pl-4 pr-2 transition-[background-color,border-color] duration-500",
                        scrolled || open
                            ? "border border-ink/10 bg-paper"
                            : "border border-transparent"
                    )}
                >
                    <Link href="/" aria-label="SubTrack home" className="text-ink">
                        <Logo />
                    </Link>

                    <div className="hidden items-center gap-1 md:flex">
                        {links.map((l) => (
                            <Link
                                key={l.href}
                                href={l.href}
                                aria-current={pathname === l.href ? "page" : undefined}
                                className="rounded-full px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink/[0.07] aria-[current=page]:bg-ink aria-[current=page]:text-paper"
                            >
                                {l.label}
                            </Link>
                        ))}
                        {authed ? (
                            <Button variant="outline" size="sm" onClick={logout} className="ml-2">
                                Sign out
                            </Button>
                        ) : (
                            <Button asChild className="ml-2">
                                <Link href="/sign-up">Start free</Link>
                            </Button>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => setOpen((o) => !o)}
                        aria-expanded={open}
                        aria-controls="mobile-menu"
                        aria-label={open ? "Close menu" : "Open menu"}
                        className="relative grid size-11 place-items-center rounded-full bg-ink text-paper md:hidden"
                    >
                        <span
                            className={cn(
                                "absolute h-[2px] w-5 bg-current transition-transform duration-500 ease-out-expo",
                                open ? "rotate-45" : "-translate-y-[4px]"
                            )}
                        />
                        <span
                            className={cn(
                                "absolute h-[2px] w-5 bg-current transition-transform duration-500 ease-out-expo",
                                open ? "-rotate-45" : "translate-y-[4px]"
                            )}
                        />
                    </button>
                </nav>
            </header>

            {open && (
                <div
                    id="mobile-menu"
                    ref={menuRef}
                    className="fixed inset-0 z-40 flex flex-col justify-end bg-ink px-5 pb-10 pt-28 text-paper md:hidden"
                >
                    <ul className="space-y-1">
                        {links.map((l) => (
                            <li key={l.href} className="overflow-hidden">
                                <Link
                                    href={l.href}
                                    onClick={() => setOpen(false)}
                                    className="menu-item display block py-1 text-[clamp(2.75rem,13vw,4.5rem)] hover:text-acid"
                                >
                                    {l.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-10">
                        {authed ? (
                            <Button variant="acid" size="lg" onClick={logout} className="w-full">
                                Sign out
                            </Button>
                        ) : (
                            <Button asChild variant="acid" size="lg" className="w-full">
                                <Link href="/sign-up">Start free</Link>
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
