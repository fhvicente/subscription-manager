"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CTA() {
    return (
        <section className="py-16 bg-gradient-to-b from-primary/5 to-primary/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                    <div className="text-center justify-center">
                        <div className="p-8 justify-center">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                Ready to take control of your subscriptions?
                            </h2>
                            <p className="text-lg text-slate-600 mb-8">
                                Join hundreds of users who save money every
                                month by tracking and managing their
                                subscriptions in one place.
                            </p>
                            <div className="flex gap-10 text-center justify-center">
                                <Button
                                    asChild
                                    size="lg"
                                    className="bg-primary hover:bg-primary/90"
                                >
                                    <Link href="/sign-up">
                                        Get Started Free
                                    </Link>
                                </Button>
                                <Button asChild size="lg" variant="outline">
                                    <Link href="/pricing">View Pricing</Link>
                                </Button>
                            </div>
                            <p className="text-sm text-slate-500 mt-4">
                                No credit card required. Free plan available.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
