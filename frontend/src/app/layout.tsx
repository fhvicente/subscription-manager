import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ApiProvider } from "@/lib/api";
import { AnalyticsProvider } from "@/lib/analytics";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "SubTrack",
    description: "Manage your subscriptions and save money",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <AuthProvider>
            <ApiProvider>
                <AnalyticsProvider>
                    <html lang="en" suppressHydrationWarning>
                        <body
                            className={inter.className}
                            suppressHydrationWarning
                        >
                            {children}
                        </body>
                    </html>
                </AnalyticsProvider>
            </ApiProvider>
        </AuthProvider>
    );
}
