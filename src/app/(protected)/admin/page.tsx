"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, useAuth } from "@/lib/auth";
import { useDialog } from "@/components/DialogProvider";
import { useStaggerReveal } from "@/lib/gsap";

const money = (n: number) => `€${n.toFixed(2)}`;
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const day = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const H2 = "font-wide text-xl font-extrabold tracking-[-0.03em] text-ink sm:text-2xl";

interface AdminUser {
    id: string;
    email: string;
    name: string;
    plan: string;
    premiumUntil: string | null;
    created_at: string;
    subscriptions: number;
}

interface AdminData {
    kpis: {
        users: number;
        newUsers30: number;
        premiumUsers: number;
        conversion: number;
        revenue30: number;
        revenueTotal: number;
        failedPayments30: number;
        subscriptions: number;
        activationRate: number;
        trackedMonthlyValue: number;
    };
    categories: { name: string; count: number }[];
    users: AdminUser[];
    recentPayments: { id: string; amount: number; status: string; plan: string | null; created_at: string; email: string }[];
}

interface UserDetail {
    subscriptions: { id: string; name: string; price: number; due_date: string; status: string }[];
    payments: { id: string; amount: number; status: string; created_at: string }[];
}

const isPremium = (u: AdminUser) =>
    u.plan === "premium" && !!u.premiumUntil && new Date(u.premiumUntil) > new Date();

function Kpi({ label, value, hint, tone = "border" }: { label: string; value: string | number; hint?: string; tone?: "border" | "ink" | "acid" | "leak" }) {
    const tones = {
        border: "border text-ink",
        ink: "bg-ink text-paper",
        acid: "bg-acid text-ink",
        leak: "bg-leak text-paper",
    };
    return (
        <div className={`rounded-xl p-6 ${tones[tone]}`}>
            <p className="eyebrow opacity-70">{label}</p>
            <p className="display mt-4 text-4xl tabular-nums">{value}</p>
            {hint && <p className="mt-2 text-sm opacity-70">{hint}</p>}
        </div>
    );
}

export default function AdminPage() {
    const { user } = useAuth();
    const { alert, confirm } = useDialog();
    const [data, setData] = useState<AdminData | null>(null);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [busy, setBusy] = useState<string | null>(null);
    const [openId, setOpenId] = useState<string | null>(null);
    const [detail, setDetail] = useState<UserDetail | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);

    useStaggerReveal(rootRef, [!!data]);

    const load = useCallback(
        async (q = "", s = "") => {
            try {
                setData((await api.get("/admin", { params: { q, status: s } })).data);
            } catch {
                alert("Unable to load the admin panel.");
            }
        },
        [alert]
    );

    // Loads on mount and on each (debounced) search or payment filter change.
    useEffect(() => {
        const t = setTimeout(() => load(search, status), 300);
        return () => clearTimeout(t);
    }, [search, status, load]);

    const toggleDetail = async (u: AdminUser) => {
        if (openId === u.id) return setOpenId(null);
        setOpenId(u.id);
        setDetail(null);
        try {
            setDetail((await api.get(`/admin/users/${u.id}`)).data);
        } catch {
            setOpenId(null);
            alert("Could not load this user.");
        }
    };

    const runRenewals = async () => {
        const ok = await confirm(
            "Send renewal reminders now? Users already reminded by today's cron will get a second email."
        );
        if (!ok) return;
        setBusy("renewals");
        try {
            const { sent } = (await api.post("/admin/renewals")).data;
            alert(`${sent} reminder email${sent === 1 ? "" : "s"} sent.`);
        } catch {
            alert("Could not run the reminders.");
        } finally {
            setBusy(null);
        }
    };

    const setPlan = async (u: AdminUser, plan: "free" | "premium") => {
        const ok = await confirm(
            plan === "premium"
                ? `Give ${u.email} 30 days of Premium?`
                : `Downgrade ${u.email} to Free? An active Stripe subscription will restore Premium on its next payment.`
        );
        if (!ok) return;
        setBusy(u.id);
        try {
            await api.patch(`/admin/users/${u.id}`, { plan });
            await load(search, status);
        } catch {
            alert("Could not update the plan.");
        } finally {
            setBusy(null);
        }
    };

    const remove = async (u: AdminUser) => {
        if (!(await confirm(`Delete ${u.email} and all their data? This can't be undone.`))) return;
        setBusy(u.id);
        try {
            await api.delete(`/admin/users/${u.id}`);
            await load(search, status);
        } catch (err) {
            const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
            alert(msg ?? "Could not delete the user.");
        } finally {
            setBusy(null);
        }
    };

    if (!data) {
        return (
            <div ref={rootRef} className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-ink" aria-label="Loading admin panel" />
            </div>
        );
    }

    const { kpis } = data;

    return (
        <div ref={rootRef} className="space-y-14">
            <header data-reveal className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="eyebrow text-ink-soft">Platform</p>
                    <h1 className="display mt-3 text-[clamp(2.25rem,5vw,3.5rem)] text-ink">Admin</h1>
                </div>
                <Button variant="outline" disabled={busy === "renewals"} onClick={runRenewals}>
                    {busy === "renewals" ? "Sending…" : "Send renewal reminders"}
                </Button>
            </header>

            <section data-reveal aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Kpi tone="acid" label="Revenue · 30 days" value={money(kpis.revenue30)} hint={`${money(kpis.revenueTotal)} all time`} />
                <Kpi tone="ink" label="Premium users" value={kpis.premiumUsers} hint={`${pct(kpis.conversion)} conversion`} />
                <Kpi label="Users" value={kpis.users} hint={`+${kpis.newUsers30} in the last 30 days`} />
                <Kpi
                    tone={kpis.failedPayments30 ? "leak" : "border"}
                    label="Failed payments · 30 days"
                    value={kpis.failedPayments30}
                />
                <Kpi label="Tracked subscriptions" value={kpis.subscriptions} hint={`${money(kpis.trackedMonthlyValue)}/month tracked`} />
                <Kpi label="Activation" value={pct(kpis.activationRate)} hint="users with ≥1 subscription" />
            </section>

            <section data-reveal aria-labelledby="users-heading" className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <h2 id="users-heading" className={H2}>Users</h2>
                    <Input
                        type="search"
                        aria-label="Search users"
                        placeholder="Search email or name"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="sm:w-72"
                    />
                </div>
                <div className="overflow-x-auto border-y border-ink/10">
                    <table className="w-full min-w-[44rem] text-left text-sm">
                        <thead className="eyebrow text-ink-soft">
                            <tr className="border-b border-ink/10">
                                <th className="py-3 pr-4 font-normal">User</th>
                                <th className="py-3 pr-4 font-normal">Plan</th>
                                <th className="py-3 pr-4 font-normal">Subs</th>
                                <th className="py-3 pr-4 font-normal">Joined</th>
                                <th className="py-3 font-normal"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-ink/10">
                            {data.users.map((u) => (
                                <Fragment key={u.id}>
                                    <tr>
                                        <td className="py-3 pr-4">
                                            <p className="font-semibold text-ink">{u.name}</p>
                                            <p className="text-ink-soft">{u.email}</p>
                                        </td>
                                        <td className="py-3 pr-4">
                                            {isPremium(u) ? (
                                                <span className="rounded-full bg-acid px-2.5 py-0.5 text-xs font-bold text-ink">
                                                    Premium · until {day(u.premiumUntil!)}
                                                </span>
                                            ) : (
                                                <span className="text-ink-soft">Free</span>
                                            )}
                                        </td>
                                        <td className="py-3 pr-4 tabular-nums">{u.subscriptions}</td>
                                        <td className="py-3 pr-4 tabular-nums">{day(u.created_at)}</td>
                                        <td className="py-3">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    aria-expanded={openId === u.id}
                                                    aria-controls={`detail-${u.id}`}
                                                    onClick={() => toggleDetail(u)}
                                                >
                                                    {openId === u.id ? "Hide" : "View"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={busy === u.id}
                                                    onClick={() => setPlan(u, isPremium(u) ? "free" : "premium")}
                                                >
                                                    {isPremium(u) ? "Downgrade" : "Give Premium"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={busy === u.id || u.id === user?.id}
                                                    onClick={() => remove(u)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                    {openId === u.id && (
                                        <tr id={`detail-${u.id}`}>
                                            <td colSpan={5} className="bg-ink/[0.03] px-4 py-4">
                                                {!detail ? (
                                                    <Loader2 className="h-5 w-5 animate-spin text-ink" aria-label="Loading user" />
                                                ) : (
                                                    <div className="grid gap-6 sm:grid-cols-2">
                                                        <div>
                                                            <p className="eyebrow mb-2 text-ink-soft">Subscriptions</p>
                                                            {detail.subscriptions.length ? (
                                                                <ul className="space-y-1">
                                                                    {detail.subscriptions.map((s) => (
                                                                        <li key={s.id} className="flex justify-between gap-4">
                                                                            <span className="truncate text-ink">{s.name} <span className="text-ink-soft">· {s.status} · {day(s.due_date)}</span></span>
                                                                            <span className="tabular-nums">{money(s.price)}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <p className="text-ink-soft">None.</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="eyebrow mb-2 text-ink-soft">Payments</p>
                                                            {detail.payments.length ? (
                                                                <ul className="space-y-1">
                                                                    {detail.payments.map((p) => (
                                                                        <li key={p.id} className="flex justify-between gap-4">
                                                                            <span className="text-ink-soft">{day(p.created_at)} · <span className={p.status === "failed" ? "font-bold text-leak" : ""}>{p.status}</span></span>
                                                                            <span className="tabular-nums">{money(p.amount)}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <p className="text-ink-soft">None.</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                    {data.users.length === 0 && <p className="py-6 text-sm text-ink-soft">No users match.</p>}
                </div>
            </section>

            <div className="grid gap-14 lg:grid-cols-2">
                <section data-reveal aria-labelledby="payments-heading" className="space-y-4">
                    <div className="flex items-end justify-between gap-3">
                        <h2 id="payments-heading" className={H2}>Recent payments</h2>
                        <select
                            aria-label="Filter payments by status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="rounded-md border border-ink/20 bg-paper px-3 py-1.5 text-sm text-ink"
                        >
                            <option value="">All</option>
                            <option value="success">Success</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>
                    {data.recentPayments.length ? (
                        <ul className="divide-y divide-ink/10 border-y border-ink/10 text-sm">
                            {data.recentPayments.map((p) => (
                                <li key={p.id} className="grid grid-cols-[1fr_auto] gap-2 py-3">
                                    <div className="min-w-0">
                                        <p className="truncate font-semibold text-ink">{p.email}</p>
                                        <p className="text-ink-soft">
                                            {day(p.created_at)} · <span className={p.status === "failed" ? "font-bold text-leak" : ""}>{p.status}</span>
                                        </p>
                                    </div>
                                    <p className="font-semibold tabular-nums text-ink">{money(p.amount)}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-ink-soft">{status ? `No ${status} payments.` : "No payments yet."}</p>
                    )}
                </section>

                <section data-reveal aria-labelledby="categories-heading" className="space-y-4">
                    <h2 id="categories-heading" className={H2}>Top categories</h2>
                    {data.categories.length ? (
                        <ul className="divide-y divide-ink/10 border-y border-ink/10 text-sm">
                            {data.categories.map((c) => (
                                <li key={c.name} className="flex justify-between py-3">
                                    <span className="font-semibold text-ink">{c.name}</span>
                                    <span className="tabular-nums text-ink-soft">{c.count}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-ink-soft">No subscriptions tracked yet.</p>
                    )}
                </section>
            </div>
        </div>
    );
}
