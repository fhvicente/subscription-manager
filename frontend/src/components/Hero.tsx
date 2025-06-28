"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Hero() {
    return (
        <section className="bg-gradient-to-br from-slate-50 to-slate-100 pt-32 pb-16 md:py-24 min-h-screen flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
                            Manage Your{" "}
                            <span className="text-[#349793]">
                                Subscriptions
                            </span>{" "}
                            Effortlessly
                        </h1>
                        <p className="text-xl text-gray-700 mb-8">
                            Track all your subscriptions in one place, get
                            renewal reminders, and save money by identifying
                            unused services.
                        </p>
                        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                            <Button
                                asChild
                                size="lg"
                                className="bg-[#349793] hover:bg-[#386872]"
                            >
                                <Link href="/sign-up">Start For Free</Link>
                            </Button>
                            <Button asChild size="lg" variant="outline">
                                <Link href="#how-it-works">Learn More</Link>
                            </Button>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <div className="bg-slate-200 h-80 w-full rounded-lg shadow-xl overflow-hidden relative">
                            <div className="relative w-full h-full bg-[#EFEDE9]">
                                <Image
                                    src="/images/hero.png"
                                    alt="hero image"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
