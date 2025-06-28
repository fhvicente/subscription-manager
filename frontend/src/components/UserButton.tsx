"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

export function UserButton({
    afterSignOutUrl = "/",
}: {
    afterSignOutUrl?: string;
}) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleSignOut = () => {
        logout();
        router.push(afterSignOutUrl);
    };

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuRef]);

    if (!user) {
        return null;
    }

    const initials = user.name
        ? user.name
              .split(" ")
              .map((n: string) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()
        : user.email?.[0]?.toUpperCase() || "?";

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-medium hover:bg-slate-300 transition-colors"
                aria-label="User menu"
            >
                {initials}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-slate-200 py-1 z-20">
                    <div className="px-4 py-2 border-b border-slate-200">
                        <p className="text-sm font-medium text-slate-900 truncate">
                            {user.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                            {user.email}
                        </p>
                    </div>

                    <Link
                        href="/settings/account"
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        onClick={() => setIsOpen(false)}
                    >
                        Account settings
                    </Link>

                    <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-100"
                    >
                        Sign out
                    </button>
                </div>
            )}
        </div>
    );
}
