"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

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
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-lg">
                <div className="mb-6 text-center">
                    <h1 className="text-xl font-bold text-slate-900">
                        Create an Account
                    </h1>
                    <p className="text-slate-600">
                        Join SubTrack to manage your subscriptions
                    </p>
                </div>

                {(error || validationError) && (
                    <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
                        {validationError || error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label
                            htmlFor="name"
                            className="mb-1 block text-sm font-medium text-slate-700"
                        >
                            Name
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            className="w-full rounded-md border border-slate-300 p-2 focus:border-slate-500 focus:outline-none"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="mb-4">
                        <label
                            htmlFor="email"
                            className="mb-1 block text-sm font-medium text-slate-700"
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="w-full rounded-md border border-slate-300 p-2 focus:border-slate-500 focus:outline-none"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="mb-4">
                        <label
                            htmlFor="password"
                            className="mb-1 block text-sm font-medium text-slate-700"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="w-full rounded-md border border-slate-300 p-2 focus:border-slate-500 focus:outline-none"
                            value={formData.password}
                            onChange={handleChange}
                        />
                        <p className="mt-1 text-xs text-slate-500">
                            Password must be at least 8 characters
                        </p>
                    </div>

                    <div className="mb-6">
                        <label
                            htmlFor="confirmPassword"
                            className="mb-1 block text-sm font-medium text-slate-700"
                        >
                            Confirm Password
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            required
                            className="w-full rounded-md border border-slate-300 p-2 focus:border-slate-500 focus:outline-none"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 focus:outline-none disabled:opacity-70"
                    >
                        {isLoading ? "Creating account..." : "Sign Up"}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <span className="text-slate-600">
                        Already have an account?{" "}
                    </span>
                    <Link
                        href="/sign-in"
                        className="font-medium text-slate-900 hover:underline"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
