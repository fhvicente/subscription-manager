"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { api } from "@/lib/auth";
import { Loader2, Trash2 } from "lucide-react";
import { useStaggerReveal } from "@/lib/gsap";

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

export default function SubscriptionsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);

    useStaggerReveal(rootRef, [isLoading]);

    // Fetch subscriptions from API
    const fetchSubscriptions = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await api.get("/subscriptions");
            setSubscriptions(response.data);
        } catch (error) {
            console.error("Error fetching subscriptions:", error);
            alert("Unable to load your subscriptions. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch subscriptions on component mount
    useEffect(() => {
        fetchSubscriptions();
    }, [fetchSubscriptions]);

    // Delete subscription
    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this subscription?")) {
            return;
        }

        try {
            setIsDeleting(id);
            await api.delete(`/subscriptions/${id}`);
            // Update local state by filtering out the deleted subscription
            setSubscriptions((prevSubscriptions) =>
                prevSubscriptions.filter((sub) => sub.id !== id)
            );
        } catch (error) {
            console.error("Error deleting subscription:", error);
            alert("Unable to delete the subscription. Please try again later.");
        } finally {
            setIsDeleting(null);
        }
    };

    // Calculate monthly amount (placeholder for frequency logic)
    const getFrequency = (subscription: Subscription) => {
        // This is placeholder logic - in a real app, you'd have a frequency field
        return subscription.description?.includes("yearly")
            ? "yearly"
            : "monthly";
    };

    const statusPill = (status: string) =>
        status === "active"
            ? "bg-acid text-ink"
            : status === "overdue" || status === "failed"
              ? "bg-leak-deep text-paper"
              : "bg-paper-2 text-ink-soft";

    if (isLoading) {
        return (
            <div ref={rootRef} className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-ink" aria-label="Loading subscriptions" />
            </div>
        );
    }

    return (
        <div ref={rootRef} className="space-y-10">
            <header
                data-reveal
                className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
            >
                <div>
                    <p className="eyebrow text-ink-soft">
                        <span className="tabular-nums">{subscriptions.length}</span>{" "}
                        tracked
                    </p>
                    <h1 className="display mt-3 text-[clamp(2.25rem,5vw,3.5rem)] text-ink">
                        Subscriptions
                    </h1>
                </div>
                <Button asChild className="self-start sm:self-auto">
                    <Link href="/subscriptions/new">Add subscription</Link>
                </Button>
            </header>

            {subscriptions.length > 0 ? (
                <div data-reveal>
                    <div
                        aria-hidden="true"
                        className="eyebrow hidden grid-cols-[1fr_7rem_6rem_9rem_7rem] gap-4 rounded-md bg-paper-2 px-4 py-2.5 text-ink-soft md:grid"
                    >
                        <span>Name</span>
                        <span>Renews</span>
                        <span>Status</span>
                        <span className="text-right">Price</span>
                        <span />
                    </div>
                    <ul className="divide-y divide-ink/10">
                        {subscriptions.map((sub) => (
                            <li
                                key={sub.id}
                                className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-4 md:grid-cols-[1fr_7rem_6rem_9rem_7rem]"
                            >
                                <div className="min-w-0">
                                    <p className="truncate font-semibold text-ink">
                                        {sub.name}
                                    </p>
                                    <p className="text-sm text-ink-soft">
                                        {sub.category || "Other"}
                                        <span className="md:hidden">
                                            {" "}· Renews{" "}
                                            <span className="tabular-nums">
                                                {new Date(sub.due_date).toLocaleDateString("en-GB")}
                                            </span>
                                        </span>
                                    </p>
                                </div>
                                <time
                                    dateTime={sub.due_date}
                                    className="hidden text-sm text-ink tabular-nums md:block"
                                >
                                    {new Date(sub.due_date).toLocaleDateString("en-GB")}
                                </time>
                                <span className="order-2 md:order-none">
                                    <span
                                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${statusPill(sub.status)}`}
                                    >
                                        {sub.status}
                                    </span>
                                </span>
                                <p className="text-right font-semibold text-ink tabular-nums">
                                    €{sub.price.toFixed(2)}
                                    <span className="text-sm font-normal text-ink-soft">
                                        /{getFrequency(sub) === "monthly" ? "mo" : "yr"}
                                    </span>
                                </p>
                                <div className="order-3 flex justify-end gap-2 md:order-none">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link
                                            href={`/subscriptions/${sub.id}`}
                                            aria-label={`Edit ${sub.name}`}
                                        >
                                            Edit
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-leak-deep hover:bg-leak-deep hover:text-paper"
                                        onClick={() => handleDelete(sub.id)}
                                        disabled={isDeleting === sub.id}
                                        aria-label={`Delete ${sub.name}`}
                                    >
                                        {isDeleting === sub.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div data-reveal className="rounded-xl bg-paper-2 p-8 sm:p-12">
                    <p className="font-wide text-2xl font-extrabold tracking-[-0.03em] text-ink">
                        Nothing tracked yet.
                    </p>
                    <p className="mt-2 max-w-md text-ink-soft">
                        Add the first one. Start with whatever charged you most recently.
                    </p>
                    <Button asChild className="mt-6">
                        <Link href="/subscriptions/new">Add subscription</Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
