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

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        function handleKey(event: KeyboardEvent) {
            if (event.key === "Escape") setIsOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKey);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKey);
        };
    }, []);

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
                aria-expanded={isOpen}
                aria-haspopup="menu"
                className="grid size-10 cursor-pointer place-items-center rounded-full bg-acid text-sm font-extrabold text-ink transition-colors hover:bg-ink hover:text-acid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
                aria-label="User menu"
            >
                {initials}
            </button>

            {isOpen && (
                <div
                    role="menu"
                    className="absolute right-0 z-40 mt-2 w-60 origin-top-right overflow-hidden rounded-xl bg-ink text-paper animate-in fade-in-0 zoom-in-95 duration-200"
                >
                    <div className="border-b border-paper/10 px-4 py-3">
                        <p className="truncate text-sm font-bold">{user.name}</p>
                        <p className="truncate text-xs text-paper/60">{user.email}</p>
                    </div>
                    <Link
                        role="menuitem"
                        href="/settings"
                        className="block px-4 py-2.5 text-sm font-medium hover:bg-paper/10"
                        onClick={() => setIsOpen(false)}
                    >
                        Account settings
                    </Link>
                    <button
                        role="menuitem"
                        onClick={handleSignOut}
                        className="block w-full cursor-pointer px-4 py-2.5 text-left text-sm font-medium text-leak hover:bg-paper/10"
                    >
                        Sign out
                    </button>
                </div>
            )}
        </div>
    );
}
