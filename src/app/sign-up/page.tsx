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

export default function SignUpPage() {
    const router = useRouter();
    const { register, error } = useAuth();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [validationError, setValidationError] = useState("");
    const root = useRef<HTMLDivElement>(null);
    useStaggerReveal(root);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear validation error when user types
        if (validationError) {
            setValidationError("");
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setValidationError("");

        const { name, email, password, confirmPassword } = formData;

        // Validate passwords match
        if (password !== confirmPassword) {
            setValidationError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        // Validate password strength
        if (password.length < 8) {
            setValidationError("Password must be at least 8 characters long");
            setIsLoading(false);
            return;
        }

        try {
            const result = await register({ name, email, password });

            if (result.success) {
                router.push("/dashboard");
            }
        } catch (error) {
            console.error("Registration failed:", error);
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
                    className="display max-w-[14ch] text-[clamp(2.25rem,9vw,3.5rem)] lg:text-[clamp(4rem,7vw,7rem)]"
                >
                    Stop paying for things you forgot.
                </p>
            </aside>

            <main className="flex flex-1 items-center px-5 py-12 sm:px-8 lg:px-16">
                <div className="w-full max-w-sm">
                    <div data-reveal className="mb-8">
                        <p className="eyebrow text-ink-soft">Create account</p>
                        <h1 className="display mt-3 text-4xl">
                            Free to start.
                        </h1>
                    </div>

                    {(error || validationError) && (
                        <div
                            role="alert"
                            className="mb-6 rounded-xl border-[1.5px] border-leak-deep bg-leak-deep/5 p-4 text-sm font-medium text-leak-deep"
                        >
                            Error: {validationError || error}
                        </div>
                    )}

                    <form
                        data-reveal
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>

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
                                autoComplete="new-password"
                                required
                                aria-describedby="password-hint"
                                value={formData.password}
                                onChange={handleChange}
                            />
                            <p
                                id="password-hint"
                                className="text-xs text-ink-soft"
                            >
                                At least 8 characters.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">
                                Confirm password
                            </Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            disabled={isLoading}
                            className="mt-3 w-full"
                        >
                            {isLoading
                                ? "Creating account..."
                                : "Create account"}
                        </Button>
                    </form>

                    <p data-reveal className="mt-8 text-sm text-ink-soft">
                        Already have an account?{" "}
                        <Button
                            asChild
                            variant="link"
                            className="h-auto text-sm"
                        >
                            <Link href="/sign-in">Sign in</Link>
                        </Button>
                    </p>
                </div>
            </main>
        </div>
    );
}
