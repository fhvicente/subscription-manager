"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function SignInPage() {
    const router = useRouter();
    const { login, error } = useAuth();
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
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
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-lg">
                <div className="mb-6 text-center">
                    <h1 className="text-xl font-bold text-slate-900">Sign In</h1>
                    <p className="text-slate-600">Welcome back to SubTrack</p>
                </div>
                
                {error && (
                    <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
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
                    
                    <div className="mb-6">
                        <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
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
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 focus:outline-none disabled:opacity-70"
                    >
                        {isLoading ? "Signing in..." : "Sign In"}
                    </button>
                </form>
                
                <div className="mt-6 text-center text-sm">
                    <span className="text-slate-600">Don&apos;t have an account? </span>
                    <Link href="/sign-up" className="font-medium text-slate-900 hover:underline">
                        Sign Up
                    </Link>
                </div>
            </div>
        </div>
    );
}
