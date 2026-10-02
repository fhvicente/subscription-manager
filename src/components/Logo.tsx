import { cn } from "@/lib/utils";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "SubTrack";

// A coin with the charge struck out.
export function LogoMark({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 32 32"
            aria-hidden="true"
            className={cn("size-8 shrink-0", className)}
        >
            <circle cx="16" cy="16" r="15" fill="var(--ink)" />
            <circle
                cx="16"
                cy="16"
                r="9"
                fill="none"
                stroke="var(--paper)"
                strokeWidth="2.5"
            />
            <path
                d="M5 24 27 8"
                stroke="var(--acid)"
                strokeWidth="4.5"
                strokeLinecap="round"
            />
        </svg>
    );
}

export default function Logo({ className }: { className?: string }) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-2 text-xl font-extrabold tracking-[-0.04em] font-wide",
                className
            )}
        >
            <LogoMark />
            {APP_NAME}
        </span>
    );
}
