interface IconProps {
    className?: string;
}

export function IconClock({ className = "" }: IconProps) {
    return (
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
            className={className}
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}

export function IconCoinOff({ className = "" }: IconProps) {
    return (
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
            className={className}
        >
            <path d="m2 2 20 20" />
            <path d="M14.5 6.5C16.667 7.333 18 9.5 18 12c0 1.667-.67 3.167-1.76 4.24" />
            <path d="M8.53 15.764C6.454 14.865 5 12.91 5 11c0-1.178.413-2.24 1.068-3.124" />
            <path d="M7.642 7.643a7 7 0 0 0-1.408 1.7" />
            <path d="M19.95 13.078a7.757 7.757 0 0 1-1.586 2.262" />
            <path d="M12 17c-2.015 0-3.51-.661-4.818-1.5" />
            <path d="M12 6c.685 0 1.318.077 1.896.221" />
        </svg>
    );
}

export function IconChart({ className = "" }: IconProps) {
    return (
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
            className={className}
        >
            <path d="M3 3v18h18" />
            <path d="M18 17V9" />
            <path d="M13 17V5" />
            <path d="M8 17v-3" />
        </svg>
    );
}

export function IconSteps({ className = "" }: IconProps) {
    return (
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
            className={className}
        >
            <path d="M4 10h16" />
            <path d="M4 14h16" />
            <path d="M10 4v16" />
            <path d="M4 4h16" />
        </svg>
    );
}

export function IconList({ className = "" }: IconProps) {
    return (
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
            className={className}
        >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
    );
}

export function IconCalculator({ className = "" }: IconProps) {
    return (
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
            className={className}
        >
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="8" y1="10" x2="16" y2="10" />
            <line x1="8" y1="14" x2="16" y2="14" />
            <line x1="8" y1="18" x2="16" y2="18" />
            <line x1="8" y1="6" x2="16" y2="6" />
        </svg>
    );
}
