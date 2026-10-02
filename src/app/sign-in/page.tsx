"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStaggerReveal } from "@/lib/gsap";

export default function SignInPage() {
    const router = useRouter();
    const { login, error } = useAuth();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    useStaggerReveal(root);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { email, password } = formData;
            const result = await login(email, password);

            if (result.success) {
                router.push("/dashboard");
            }
        } catch (error) {
            console.error("Login failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            ref={root}
            className="flex min-h-svh flex-col bg-paper text-ink lg:grid lg:grid-cols-2"
        >
            <aside className="flex flex-col justify-between gap-8 bg-acid px-5 py-6 text-ink sm:px-8 lg:min-h-svh lg:p-12">
                <Link
                    href="/"
                    aria-label="SubTrack home"
                    className="w-fit rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-acid"
                >
                    <Logo />
                </Link>
                <p
                    data-reveal
                    className="display max-w-[12ch] text-[clamp(2.25rem,9vw,3.5rem)] lg:text-[clamp(4rem,7vw,7rem)]"
                >
                    Back to plugging leaks.
                </p>
            </aside>

            <main className="flex flex-1 items-center px-5 py-12 sm:px-8 lg:px-16">
                <div className="w-full max-w-sm">
                    <div data-reveal className="mb-8">
                        <p className="eyebrow text-ink-soft">Sign in</p>
                        <h1 className="display mt-3 text-4xl">Welcome back.</h1>
                    </div>

                    {error && (
                        <div
                            role="alert"
                            className="mb-6 rounded-xl border-[1.5px] border-leak-deep bg-leak-deep/5 p-4 text-sm font-medium text-leak-deep"
                        >
                            Error: {error}
                        </div>
                    )}

                    <form
                        data-reveal
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            disabled={isLoading}
                            className="mt-3 w-full"
                        >
                            {isLoading ? "Signing in..." : "Sign in"}
                        </Button>
                    </form>

                    <p data-reveal className="mt-8 text-sm text-ink-soft">
                        No account yet?{" "}
                        <Button
                            asChild
                            variant="link"
                            className="h-auto text-sm"
                        >
                            <Link href="/sign-up">Create one, free</Link>
                        </Button>
                    </p>
                </div>
            </main>
        </div>
    );
}
