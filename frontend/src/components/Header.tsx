"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { usePathname } from "next/navigation";

export default function Header() {
    const { isAuthenticated, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();

    // Detects scroll to add shadow to the navbar
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 10) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Closes the mobile menu when page changes
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const isActive = (path: string) => {
        if (path.startsWith("#")) return false;
        return pathname === path;
    };

    return (
        <nav
            className={`fixed top-0 left-0 right-0 w-full bg-white z-50 transition-all duration-300 ${
                scrolled ? "shadow-md" : ""
            }`}
        >
            <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
                <Link
                    href="/"
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

                {/* Desktop menu */}
                <div className="hidden md:flex items-center space-x-6">
                    {/* Public options */}
                    <Link
                        href="/#features"
                        className="text-gray-700 hover:text-primary transition"
                    >
                        Features
                    </Link>
                    <Link
                        href="/#how-it-works"
                        className="text-gray-700 hover:text-primary transition"
                    >
                        How It Works
                    </Link>

                    {/* Options for authenticated users */}
                    {isAuthenticated() ? (
                        <>
                            <Link
                                href="/dashboard"
                                className={`transition ${
                                    isActive("/dashboard")
                                        ? "text-primary font-medium"
                                        : "text-gray-700 hover:text-primary"
                                }`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/settings"
                                className={`transition ${
                                    isActive("/settings")
                                        ? "text-primary font-medium"
                                        : "text-gray-700 hover:text-primary"
                                }`}
                            >
                                Profile
                            </Link>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={logout}
                                className="cursor-pointer"
                            >
                                Sign Out
                            </Button>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/sign-in"
                                className={`transition ${
                                    isActive("/sign-in")
                                        ? "text-primary font-medium"
                                        : "text-gray-700 hover:text-primary"
                                }`}
                            >
                                Sign In
                            </Link>
                            <Button
                                asChild
                                size="sm"
                                className="bg-primary hover:bg-primary/90"
                            >
                                <Link href="/sign-up">Sign Up</Link>
                            </Button>
                        </>
                    )}
                </div>

                {/* Mobile menu button */}
                <div className="md:hidden">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleMobileMenu}
                        className="p-2"
                        aria-label="Menu"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            {mobileMenuOpen ? (
                                <>
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </>
                            ) : (
                                <>
                                    <line x1="3" y1="12" x2="21" y2="12"></line>
                                    <line x1="3" y1="6" x2="21" y2="6"></line>
                                    <line x1="3" y1="18" x2="21" y2="18"></line>
                                </>
                            )}
                        </svg>
                    </Button>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white shadow-lg border-t">
                    <div className="flex flex-col space-y-3 px-4 py-3">
                        {/* Public options */}
                        <Link
                            href="/#features"
                            className="text-gray-700 hover:text-primary transition py-2 px-3 hover:bg-gray-50 rounded"
                        >
                            Features
                        </Link>
                        <Link
                            href="/#how-it-works"
                            className="text-gray-700 hover:text-primary transition py-2 px-3 hover:bg-gray-50 rounded"
                        >
                            How It Works
                        </Link>

                        {/* Options for authenticated users */}
                        {isAuthenticated() ? (
                            <>
                                <Link
                                    href="/dashboard"
                                    className={`transition py-2 px-3 hover:bg-gray-50 rounded ${
                                        isActive("/dashboard")
                                            ? "text-primary font-medium bg-gray-50"
                                            : "text-gray-700 hover:text-primary"
                                    }`}
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    href="/settings"
                                    className={`transition py-2 px-3 hover:bg-gray-50 rounded ${
                                        isActive("/settings")
                                            ? "text-primary font-medium bg-gray-50"
                                            : "text-gray-700 hover:text-primary"
                                    }`}
                                >
                                    Profile
                                </Link>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        logout();
                                        setMobileMenuOpen(false);
                                    }}
                                    className="w-full justify-center mt-2"
                                >
                                    Sign Out
                                </Button>
                            </>
                        ) : (
                            <div className="flex flex-col space-y-3 pt-2">
                                <Link
                                    href="/sign-in"
                                    className={`transition py-2 px-3 hover:bg-gray-50 rounded ${
                                        isActive("/sign-in")
                                            ? "text-primary font-medium bg-gray-50"
                                            : "text-gray-700 hover:text-primary"
                                    }`}
                                >
                                    Sign In
                                </Link>
                                <Button
                                    asChild
                                    size="sm"
                                    className="bg-primary hover:bg-primary/90 w-full justify-center"
                                >
                                    <Link href="/sign-up">Sign Up</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
