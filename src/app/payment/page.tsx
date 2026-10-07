"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePayment } from "@/hooks/usePayment";
import { useRef, useState } from "react";
import { Check, Minus } from "lucide-react";
import Logo from "@/components/Logo";
import { cn } from "@/lib/utils";
import { useStaggerReveal } from "@/lib/gsap";
import { useDialog } from "@/components/DialogProvider";
import { FREE_PLAN_LIMIT } from "@/lib/subscription-schema";

export default function PaymentPage() {
    const { createCheckoutSession, loading } = usePayment();
    const { alert } = useDialog();
    const [processingPlan, setProcessingPlan] = useState<string | null>(null);
    const root = useRef<HTMLDivElement>(null);
    useStaggerReveal(root);

    // ponytail: one Stripe price (STRIPE_MONTHLY_PRICE_ID); the €9,99 shown here must match it.
    const features: { label: string; free: string | boolean; premium: string | boolean }[] = [
        { label: "Subscriptions tracked", free: `Up to ${FREE_PLAN_LIMIT}`, premium: "Unlimited" },
        { label: "Dashboard and spending overview", free: true, premium: true },
        { label: "Email alerts before renewals", free: false, premium: true },
        { label: "Calendar sync (Google, Outlook, Apple)", free: false, premium: true },
        { label: "AI assistant chat", free: false, premium: "Fair-use limit" },
    ];

    const plans = [
        { id: "free", name: "Free", price: "€0", period: "forever", key: "free" as const },
        { id: "monthly", name: "Premium", price: "€9,99", period: "per month", key: "premium" as const, recommended: true },
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
                        One plan. Everything in it.
                    </h1>
                    <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                        Free covers the basics. Premium adds alerts, calendar
                        sync and the AI assistant.
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
                                {features.map((feature) => {
                                    const value = feature[plan.key];
                                    return (
                                        <li
                                            key={feature.label}
                                            className={cn(
                                                "flex items-center gap-3 py-2.5",
                                                !value && "opacity-50",
                                            )}
                                        >
                                            {value ? (
                                                <Check aria-hidden="true" className="size-4 shrink-0" strokeWidth={3} />
                                            ) : (
                                                <Minus aria-hidden="true" className="size-4 shrink-0" strokeWidth={3} />
                                            )}
                                            <span className="flex-1">
                                                {feature.label}
                                                {!value && <span className="sr-only"> (not included)</span>}
                                            </span>
                                            {typeof value === "string" && (
                                                <span className="text-sm font-semibold">{value}</span>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                            {plan.recommended ? (
                                <Button
                                    size="lg"
                                    className="mt-8 w-full hover:bg-paper hover:text-ink"
                                    onClick={() => handleSelectPlan(plan.id)}
                                    disabled={loading || processingPlan !== null}
                                >
                                    {processingPlan === plan.id ? "Processing..." : "Go Premium"}
                                </Button>
                            ) : (
                                <p className="mt-8 py-2.5 text-center text-sm text-ink-soft">
                                    Included with every account
                                </p>
                            )}
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
