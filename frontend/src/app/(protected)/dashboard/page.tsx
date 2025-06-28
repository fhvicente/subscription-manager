"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { api } from "@/lib/auth";
import { Loader2 } from "lucide-react";

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

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                <Button asChild>
                    <Link href="/subscriptions/new">Add Subscription</Link>
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6 bg-white shadow-sm">
                    <h2 className="text-sm font-medium text-slate-500">
                        Monthly Total
                    </h2>
                    <p className="text-3xl font-bold text-slate-900">
                        € {dashboardData.monthlyTotal.toFixed(2)}
                    </p>
                </Card>
                <Card className="p-6 bg-white shadow-sm">
                    <h2 className="text-sm font-medium text-slate-500">
                        Active Subscriptions
                    </h2>
                    <p className="text-3xl font-bold text-slate-900">
                        {dashboardData.totalSubscriptions}
                    </p>
                </Card>
                <Card className="p-6 bg-white shadow-sm">
                    <h2 className="text-sm font-medium text-slate-500">
                        Next Renewal
                    </h2>
                    <p className="text-3xl font-bold text-slate-900">
                        {dashboardData.upcomingRenewals.length > 0
                            ? new Date(
                                  dashboardData.upcomingRenewals[0].renewalDate
                              ).toLocaleDateString("en-US")
                            : "None"}
                    </p>
                </Card>
            </div>

            {/* Upcoming Renewals */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900">
                    Upcoming Renewals
                </h2>
                <Card className="bg-white shadow-sm overflow-hidden">
                    {dashboardData.upcomingRenewals.length > 0 ? (
                        <div className="divide-y divide-slate-200">
                            {dashboardData.upcomingRenewals.map((sub) => (
                                <div
                                    key={sub.id}
                                    className="p-4 flex justify-between items-center"
                                >
                                    <div>
                                        <h3 className="font-medium text-slate-900">
                                            {sub.name}
                                        </h3>
                                        <p className="text-sm text-slate-500">
                                            {new Date(
                                                sub.renewalDate
                                            ).toLocaleDateString("en-US")}{" "}
                                            • {sub.category}
                                        </p>
                                    </div>
                                    <p className="font-medium text-slate-900">
                                        € {sub.amount.toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-slate-500">
                            No renewals in the next 30 days
                        </div>
                    )}
                </Card>
            </div>

            {/* Categories */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900">
                    Spending by Category
                </h2>
                <Card className="bg-white shadow-sm p-6">
                    {Object.keys(dashboardData.categories).length > 0 ? (
                        <div className="space-y-4">
                            {Object.entries(dashboardData.categories).map(
                                ([category, amount]) => (
                                    <div
                                        key={category}
                                        className="flex justify-between items-center"
                                    >
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 rounded-full bg-slate-700 mr-2"></div>
                                            <span className="text-slate-700">
                                                {category}
                                            </span>
                                        </div>
                                        <span className="font-medium text-slate-900">
                                            € {amount.toFixed(2)}
                                        </span>
                                    </div>
                                )
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-slate-500">
                            No category data available
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
