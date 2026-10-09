import jwt, { type SignOptions } from "jsonwebtoken";
import { get } from "./db";

const WEEK = 7 * 24 * 60 * 60;

export const signToken = (id: string) =>
    jwt.sign({ id }, process.env.JWT_SECRET!, {
        expiresIn: process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    });

// HttpOnly so page scripts (and any XSS) can't read the token; SameSite=Lax blocks cross-site writes.
const sessionCookie = (token: string, maxAge: number) =>
    `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}` +
    (process.env.NODE_ENV === "production" ? "; Secure" : "");

// JSON response that logs the user in.
export const withSession = (body: unknown, userId: string, status = 200) =>
    Response.json(body, { status, headers: { "Set-Cookie": sessionCookie(signToken(userId), WEEK) } });

export const clearSession = (body: unknown, status = 200) =>
    Response.json(body, { status, headers: { "Set-Cookie": sessionCookie("", 0) } });

// Returns the user behind the session cookie, or null if missing/invalid.
export const getUser = (req: Request) =>
    userFromToken(req.headers.get("cookie")?.match(/(?:^|;\s*)token=([^;]+)/)?.[1]);

// For server components, which read the cookie via `cookies()` instead of a Request.
export async function userFromToken(token: string | undefined) {
    if (!token) return null;
    let id: string | undefined;
    try {
        ({ id } = jwt.verify(token, process.env.JWT_SECRET!) as { id?: string });
    } catch {
        return null;
    }
    return id ? ((await get("SELECT * FROM users WHERE id = ?", [id])) ?? null) : null;
}

// Also drops the cookie, so a stale token can't bounce the user between the proxy and the sign-in page.
export const unauthorized = () => clearSession({ error: "Invalid or expired token" }, 401);

// First hop of x-forwarded-for is the client on Vercel (the platform overwrites the header).
export const clientIp = (req: Request) =>
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";

export const tooManyRequests = () =>
    Response.json({ error: "Too many attempts, try again later", message: "Too many attempts, try again later" }, { status: 429 });

// Admins are listed by email in ADMIN_EMAILS (comma-separated, case-insensitive); no role column needed.
export const isAdmin = (user: { email?: unknown } | null) =>
    !!user &&
    (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
        .includes(String(user.email).toLowerCase());

export const forbidden = () => Response.json({ error: "Forbidden" }, { status: 403 });

// ponytail: admin actions go to the Vercel logs only; add an admin_actions table if they need to be browsable.
export const logAdmin = (admin: { email?: unknown }, action: string, target?: string) =>
    console.info(JSON.stringify({ adminAction: action, admin: admin.email, target, at: new Date().toISOString() }));
