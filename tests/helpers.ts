import { randomUUID } from "node:crypto";
import { run } from "@/server/db";
import * as register from "@/app/api/auth/register/route";

export const reset = () => run("TRUNCATE users, subscriptions, notification_settings, payment_logs, rate_limits CASCADE");

export function req(method: string, { body, token, url = "http://test/" }: { body?: unknown; token?: string; url?: string } = {}) {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (token) headers.cookie = `token=${token}`;
    return new Request(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
}

// The session JWT, read from the HttpOnly cookie the auth routes set.
export const tokenOf = (res: Response) => res.headers.get("set-cookie")?.match(/^token=([^;]*)/)?.[1] ?? "";

export const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

export async function signUp(email = `${randomUUID()}@test.dev`) {
    const res = await register.POST(req("POST", { body: { name: "Ana", email, password: "secret123" } }));
    const { user } = await res.json();
    return { user, token: tokenOf(res), email };
}

export const inDays = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
