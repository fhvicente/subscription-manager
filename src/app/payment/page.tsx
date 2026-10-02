"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePayment } from "@/hooks/usePayment";
import { useRef, useState } from "react";
import { Check } from "lucide-react";
import Logo from "@/components/Logo";
import { cn } from "@/lib/utils";
import { useStaggerReveal } from "@/lib/gsap";

export default function PaymentPage() {
    const { createCheckoutSession, loading } = usePayment();
    const [processingPlan, setProcessingPlan] = useState<string | null>(null);
    const root = useRef<HTMLDivElement>(null);
    useStaggerReveal(root);

    const plans = [
        {
            id: "monthly",
            name: "Monthly Plan",
            price: "€3,99",
            period: "per month",
            features: [
                "Unlimited subscriptions",
                "Email and SMS notifications",
                "Detailed reports",
                "Priority support",
            ],
        },
        {
            id: "yearly",
            name: "Annual Plan",
            price: "€39,99",
            period: "per year",
            features: [
                "Unlimited subscriptions",
                "Email and SMS notifications",
                "Detailed reports",
                "Priority support",
                "Save 16%",
            ],
            recommended: true,
        },
    ];

    const handleSelectPlan = async (planId: string) => {
        setProcessingPlan(planId);
        try {
            const session = await createCheckoutSession(planId);

            if (session && session.url) {
                // Redirect to Stripe Checkout
                window.location.href = session.url;
            } else {
                alert("Unable to start payment process. Please try again.");
            }
        } catch (error) {
            console.error("Error creating checkout session:", error);
            alert(
                "An error occurred while processing your request. Please try again.",
            );
        } finally {
            setProcessingPlan(null);
        }
    };

    return (
        <div ref={root} className="min-h-svh bg-paper text-ink">
            <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:py-12">
                <Link
                    href="/"
                    aria-label="SubTrack home"
                    className="inline-flex w-fit rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                >
                    <Logo />
                </Link>

                <header data-reveal className="mt-12 max-w-2xl lg:mt-16">
                    <p className="eyebrow text-ink-soft">Premium</p>
                    <h1 className="display mt-3 text-[clamp(2.25rem,5vw,3.5rem)]">
                        Pick a plan.
                    </h1>
                    <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                        Unlock the premium features and keep every renewal in
                        check.
                    </p>
                </header>

                <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
                    {plans.map((plan) => (
                        <section
                            key={plan.id}
                            data-reveal
                            aria-labelledby={`plan-${plan.id}`}
                            className={cn(
                                "flex flex-col rounded-xl p-6 sm:p-8",
                                plan.recommended
                                    ? "bg-acid text-ink"
                                    : "border-[1.5px] border-ink bg-card",
                            )}
                        >
                            <div className="flex items-center justify-between gap-4">
                                <h2
                                    id={`plan-${plan.id}`}
                                    className="font-wide text-xl font-extrabold tracking-[-0.03em]"
                                >
                                    {plan.name}
                                </h2>
                                {plan.recommended && (
                                    <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-bold text-acid">
                                        Recommended
                                    </span>
                                )}
                            </div>
                            <p className="mt-6 flex items-baseline gap-2">
                                <span className="display text-[clamp(3rem,8vw,4.5rem)] tabular-nums">
                                    {plan.price}
                                </span>
                                <span
                                    className={cn(
                                        "text-sm font-medium",
                                        !plan.recommended && "text-ink-soft",
                                    )}
                                >
                                    {plan.period}
                                </span>
                            </p>
                            <ul
                                className={cn(
                                    "mt-6 flex-1 divide-y border-y",
                                    plan.recommended
                                        ? "divide-ink/20 border-ink/20"
                                        : "divide-ink/10 border-ink/10",
                                )}
                            >
                                {plan.features.map((feature, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center gap-3 py-2.5"
                                    >
                                        <Check
                                            aria-hidden="true"
                                            className="size-4 shrink-0"
                                            strokeWidth={3}
                                        />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <Button
                                size="lg"
                                className={cn(
                                    "mt-8 w-full",
                                    plan.recommended &&
                                        "hover:bg-paper hover:text-ink",
                                )}
                                onClick={() => handleSelectPlan(plan.id)}
                                disabled={loading || processingPlan !== null}
                            >
                                {processingPlan === plan.id
                                    ? "Processing..."
                                    : `Select ${plan.name}`}
                            </Button>
                        </section>
                    ))}
                </div>

                <div
                    data-reveal
                    className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                >
                    <p className="text-sm text-ink-soft">
                        Secure payment processed by Stripe. You can cancel
                        anytime.
                    </p>
                    <Button variant="outline" asChild>
                        <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
