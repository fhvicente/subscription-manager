"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { api } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { gsap, useGSAP, useStaggerReveal, MOTION_OK } from "@/lib/gsap";

const money = (n: number) => `€${n.toFixed(2)}`;
const shortDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
const daysUntil = (d: string) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const days = Math.round((new Date(d).setHours(0, 0, 0, 0) - start.getTime()) / 86_400_000);
    return days <= 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`;
};

// Types
interface Subscription {
    id: string;
    name: string;
    price: number;
    description?: string;
    due_date: string;
    status: string;
    category?: string;
    user_id?: string;
    created_at?: string;
    updated_at?: string;
}

interface DashboardData {
    totalSubscriptions: number;
    monthlyTotal: number;
    upcomingRenewals: {
        id: string;
        name: string;
        amount: number;
        renewalDate: string;
        category: string;
    }[];
    categories: Record<string, number>;
}

export default function Dashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<DashboardData>({
        totalSubscriptions: 0,
        monthlyTotal: 0,
        upcomingRenewals: [],
        categories: {},
    });
    const rootRef = useRef<HTMLDivElement>(null);
    const totalRef = useRef<HTMLSpanElement>(null);

    useStaggerReveal(rootRef, [isLoading]);

    // Count the monthly total up and grow the category bars.
    useGSAP(
        () => {
            if (isLoading) return;
            gsap.matchMedia().add(MOTION_OK, () => {
                const el = totalRef.current;
                if (el) {
                    const n = { v: 0 };
                    gsap.to(n, {
                        v: dashboardData.monthlyTotal,
                        duration: 1.6,
                        onUpdate: () => {
                            el.textContent = money(n.v);
                        },
                    });
                }
                const bars = rootRef.current?.querySelectorAll("[data-bar]");
                if (!bars?.length) return;
                gsap.from(bars, {
                    scaleX: 0,
                    transformOrigin: "left center",
                    stagger: 0.05,
                    duration: 1.2,
                    delay: 0.2,
                });
            });
        },
        { scope: rootRef, dependencies: [isLoading, dashboardData.monthlyTotal] }
    );

    // Calculate dashboard metrics from subscriptions
    const calculateDashboardMetrics = useCallback((subs: Subscription[]) => {
        if (!subs || subs.length === 0) {
            setDashboardData({
                totalSubscriptions: 0,
                monthlyTotal: 0,
                upcomingRenewals: [],
                categories: {},
            });
            return;
        }

        // Total monthly spending
        const monthlyTotal = subs.reduce((total: number, sub: Subscription) => {
            return total + (sub.price || 0);
        }, 0);

        // Active subscriptions count
        const activeCount = subs.filter(
            (sub) => sub.status === "active"
        ).length;

        // Get upcoming renewals in the next 30 days
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setDate(today.getDate() + 30);

        const upcomingRenewals = subs
            .filter((sub) => {
                const dueDate = new Date(sub.due_date);
                return dueDate >= today && dueDate <= nextMonth;
            })
            .sort(
                (a, b) =>
                    new Date(a.due_date).getTime() -
                    new Date(b.due_date).getTime()
            )
            .map((sub) => ({
                id: sub.id,
                name: sub.name,
                amount: sub.price,
                renewalDate: sub.due_date,
                category: sub.category || "Other",
            }));

        // Group by categories (using description field as placeholder for category)
        const categories: Record<string, number> = {};
        subs.forEach((sub) => {
            const category = sub.category || sub.description || "Other";
            if (!categories[category]) {
                categories[category] = 0;
            }
            categories[category] += sub.price || 0;
        });

        setDashboardData({
            totalSubscriptions: activeCount,
            monthlyTotal,
            upcomingRenewals,
            categories,
        });
    }, []);

    // Fetch subscriptions on component mount
    useEffect(() => {
        const fetchSubscriptions = async () => {
            try {
                setIsLoading(true);
                const response = await api.get("/subscriptions");
                const subs: Subscription[] = response.data;

                // Calculate dashboard metrics
                calculateDashboardMetrics(subs);
            } catch (error) {
                console.error("Error fetching subscriptions:", error);
                // Use alert instead of toast since toast component might not be available
                alert(
                    "Unable to load your subscriptions. Please try again later."
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubscriptions();
    }, [calculateDashboardMetrics]);

    const { monthlyTotal, totalSubscriptions, upcomingRenewals, categories } =
        dashboardData;
    const nextRenewal = upcomingRenewals[0];
    const categoryRows = Object.entries(categories).sort((a, b) => b[1] - a[1]);
    const maxCategory = Math.max(...categoryRows.map(([, v]) => v), 0);

    if (isLoading) {
        return (
            <div ref={rootRef} className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-ink" aria-label="Loading dashboard" />
            </div>
        );
    }

    return (
        <div ref={rootRef} className="space-y-14">
            <header
                data-reveal
                className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
            >
                <div>
                    <p className="eyebrow text-ink-soft">Overview</p>
                    <h1 className="display mt-3 text-[clamp(2.25rem,5vw,3.5rem)] text-ink">
                        Dashboard
                    </h1>
                </div>
                <Button asChild className="self-start sm:self-auto">
                    <Link href="/subscriptions/new">Add subscription</Link>
                </Button>
            </header>

            {/* Totals */}
            <section
                data-reveal
                aria-label="Spending summary"
                className="grid gap-4 lg:grid-cols-[1fr_18rem]"
            >
                <div className="rounded-xl bg-acid p-6 text-ink sm:p-10">
                    <p className="eyebrow">You pay every month</p>
                    <p className="display mt-6 text-[clamp(3.5rem,11vw,8rem)] tabular-nums">
                        <span ref={totalRef}>{money(monthlyTotal)}</span>
                    </p>
                    <p className="mt-6 text-lg font-semibold">
                        That&apos;s{" "}
                        <span className="tabular-nums">{money(monthlyTotal * 12)}</span>{" "}
                        a year.
                    </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    <div className="rounded-xl bg-ink p-6 text-paper">
                        <p className="eyebrow text-paper/70">Active</p>
                        <p className="display mt-4 text-5xl tabular-nums">
                            {totalSubscriptions}
                        </p>
                        <p className="mt-2 text-sm text-paper/70">
                            {totalSubscriptions === 1 ? "subscription" : "subscriptions"}
                        </p>
                    </div>
                    <div className="rounded-xl border p-6">
                        <p className="eyebrow text-ink-soft">Next renewal</p>
                        {nextRenewal ? (
                            <>
                                <p className="font-wide mt-4 truncate text-2xl font-extrabold tracking-[-0.03em] text-ink">
                                    {nextRenewal.name}
                                </p>
                                <p className="mt-2 text-sm text-ink-soft tabular-nums">
                                    {shortDate(nextRenewal.renewalDate)} ·{" "}
                                    {daysUntil(nextRenewal.renewalDate)}
                                </p>
                            </>
                        ) : (
                            <p className="mt-4 text-sm text-ink-soft">
                                Nothing in the next 30 days.
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {/* Upcoming Renewals */}
            <section data-reveal aria-labelledby="renewals-heading" className="space-y-4">
                <div className="flex items-baseline justify-between gap-4">
                    <h2
                        id="renewals-heading"
                        className="font-wide text-xl font-extrabold tracking-[-0.03em] text-ink sm:text-2xl"
                    >
                        Upcoming renewals
                    </h2>
                    <p className="eyebrow text-ink-soft">Next 30 days</p>
                </div>
                {upcomingRenewals.length > 0 ? (
                    <ul className="divide-y divide-ink/10 border-y border-ink/10">
                        {upcomingRenewals.map((sub) => (
                            <li
                                key={sub.id}
                                className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-4 py-4"
                            >
                                <time
                                    dateTime={sub.renewalDate}
                                    className="font-semibold text-ink tabular-nums"
                                >
                                    {shortDate(sub.renewalDate)}
                                </time>
                                <div className="min-w-0">
                                    <p className="truncate font-semibold text-ink">
                                        {sub.name}
                                    </p>
                                    <p className="text-sm text-ink-soft">
                                        {sub.category} · {daysUntil(sub.renewalDate)}
                                    </p>
                                </div>
                                <p className="font-semibold text-ink tabular-nums">
                                    {money(sub.amount)}
                                </p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="rounded-xl bg-paper-2 p-8">
                        <p className="font-semibold text-ink">
                            No renewals in the next 30 days.
                        </p>
                        <p className="mt-1 text-sm text-ink-soft">
                            Quiet month. Add a subscription and we&apos;ll warn you before it charges.
                        </p>
                        <Button asChild variant="outline" size="sm" className="mt-4">
                            <Link href="/subscriptions/new">Add subscription</Link>
                        </Button>
                    </div>
                )}
            </section>

            {/* Categories */}
            <section data-reveal aria-labelledby="categories-heading" className="space-y-4">
                <h2
                    id="categories-heading"
                    className="font-wide text-xl font-extrabold tracking-[-0.03em] text-ink sm:text-2xl"
                >
                    Spending by category
                </h2>
                {categoryRows.length > 0 ? (
                    <ul className="space-y-5">
                        {categoryRows.map(([category, amount]) => (
                            <li key={category} className="space-y-2">
                                <div className="flex items-baseline justify-between gap-4">
                                    <span className="font-semibold text-ink">{category}</span>
                                    <span className="font-semibold text-ink tabular-nums">
                                        {money(amount)}
                                    </span>
                                </div>
                                <div className="h-3 overflow-hidden rounded-full bg-ink/[0.07]" aria-hidden="true">
                                    <div
                                        data-bar
                                        className="h-full rounded-full bg-ink"
                                        style={{
                                            width: `${maxCategory ? (amount / maxCategory) * 100 : 0}%`,
                                        }}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="rounded-xl bg-paper-2 p-8 text-ink-soft">
                        No categories yet. They show up once you add a subscription.
                    </p>
                )}
            </section>
        </div>
    );
}
