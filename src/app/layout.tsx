import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ApiProvider } from "@/lib/api";
import { AnalyticsProvider } from "@/lib/analytics";
import { DialogProvider } from "@/components/DialogProvider";

const archivo = Archivo({
    subsets: ["latin", "latin-ext"],
    axes: ["wdth"],
    variable: "--font-archivo",
});

export const metadata: Metadata = {
    title: "SubTrack: plug the subscription leak",
    description:
        "Every subscription on one list, reminders before renewals, and the real yearly cost.",
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
                    <html
                        lang="en"
                        className={archivo.variable}
                        suppressHydrationWarning
                    >
                        <head>
                            {/* lets CSS hide [data-reveal] until GSAP animates it in */}
                            <script
                                dangerouslySetInnerHTML={{
                                    __html: "document.documentElement.classList.add('js')",
                                }}
                            />
                        </head>
                        <body className="font-sans" suppressHydrationWarning>
                            <DialogProvider>{children}</DialogProvider>
                        </body>
                    </html>
                </AnalyticsProvider>
            </ApiProvider>
        </AuthProvider>
    );
}
