"use client";

import { IconClock, IconCoinOff, IconChart } from "./icons";

export default function Features() {
    return (
        <section
            id="features"
            className="py-16 bg-gradient-to-b from-slate-50 to-slate-100"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
                    Why Use Our SubTrack?
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                            <IconClock className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3">
                            Track Everything
                        </h3>
                        <p className="text-slate-600">
                            Never miss a renewal date again. Keep all your
                            subscriptions in one place with automatic reminders
                            and notifications.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                            <IconCoinOff className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3">
                            Save Money
                        </h3>
                        <p className="text-slate-600">
                            Identify unused subscriptions and unnecessary
                            expenses. Our smart analysis helps you cut costs
                            where you don&apos;t need to spend.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                            <IconChart className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3">
                            Visualize Spending
                        </h3>
                        <p className="text-slate-600">
                            See detailed reports and analytics about your
                            recurring expenses, categorized by service type,
                            frequency, and total costs.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
