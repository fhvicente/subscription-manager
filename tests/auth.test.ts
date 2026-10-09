import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/server/better-auth";
import * as profile from "@/app/api/users/profile/route";
import { unauthorized } from "@/server/auth";
import { get, run } from "@/server/db";
import { authReq, req, reset, sessionCookie, signUp } from "./helpers";

const call = (path: string, opts?: { body?: unknown; token?: string }) => auth.handler(authReq(path, opts));
const signUpBody = (over: object = {}) => ({ name: "Ana", email: "ana@test.dev", password: "secret123", ...over });
const signIn = (email: string, password: string) => call("/sign-in/email", { body: { email, password } });
// The protected-route check every app route goes through (getUser).
const me = (token?: string) => profile.GET(req("GET", { token }));

beforeEach(reset);

describe("sign-up (/api/auth/sign-up/email)", () => {
    it("creates a free user and logs them in with an HttpOnly cookie", async () => {
        const res = await call("/sign-up/email", { body: signUpBody() });
        expect(res.status).toBe(200);
        const cookie = res.headers.getSetCookie().find((c) => c.startsWith("better-auth.session_token="))!;
        expect(cookie).toMatch(/HttpOnly/i);
        expect(cookie).toMatch(/SameSite=Lax/i);

        const { user } = await res.json();
        expect((await get(`SELECT plan FROM "user" WHERE id = ?`, [user.id]))!.plan).toBe("free");
        const account = await get(`SELECT password FROM account WHERE "userId" = ?`, [user.id]);
        expect(account!.password).toBeTruthy();
        expect(account!.password).not.toBe("secret123");
        expect((await me(sessionCookie(res))).status).toBe(200);
    });

    it("ignores a plan sent at sign-up (input: false)", async () => {
        const res = await call("/sign-up/email", { body: signUpBody({ plan: "premium" }) });
        const { user } = await res.json();
        expect((await get(`SELECT plan FROM "user" WHERE id = ?`, [user.id]))!.plan).toBe("free");
    });

    it.each([
        ["invalid email", { email: "not-an-email" }],
        ["short password", { password: "short" }],
        ["blank name", { name: "   " }],
        ["name over 100 chars", { name: "x".repeat(101) }],
    ])("rejects %s with 400", async (_, over) => {
        expect((await call("/sign-up/email", { body: signUpBody(over) })).status).toBe(400);
    });

    it("rejects a duplicate email", async () => {
        await signUp("ana@test.dev");
        const res = await call("/sign-up/email", { body: signUpBody() });
        expect(res.status).toBe(422);
    });

    it("limits sign-ups to 5 per IP per hour", async () => {
        for (let i = 0; i < 5; i++) {
            expect((await call("/sign-up/email", { body: signUpBody({ email: `u${i}@test.dev` }) })).status).toBe(200);
        }
        expect((await call("/sign-up/email", { body: signUpBody({ email: "late@test.dev" }) })).status).toBe(429);
    });
});

describe("sign-in (/api/auth/sign-in/email)", () => {
    it("logs in, case-insensitive on the email", async () => {
        await signUp("Ana@Test.dev");
        const res = await signIn("ana@test.dev", "secret123");
        expect(res.status).toBe(200);
        expect((await me(sessionCookie(res))).status).toBe(200);
    });

    it("answers a wrong password and an unknown email the same way", async () => {
        await signUp("ana@test.dev");
        const wrong = await signIn("ana@test.dev", "wrong-password");
        const unknown = await signIn("nobody@test.dev", "secret123");
        expect(wrong.status).toBe(401);
        expect(unknown.status).toBe(401);
        expect((await wrong.json()).code).toBe((await unknown.json()).code);
    });

    it("locks an email after 10 attempts in 15 min, whatever its casing", async () => {
        await signUp("ana@test.dev");
        for (let i = 0; i < 10; i++) {
            const email = i % 2 ? "ANA@test.dev" : "ana@test.dev";
            expect((await signIn(email, "wrong-password")).status).toBe(401);
        }
        expect((await signIn("ana@test.dev", "secret123")).status).toBe(429);
    });
});

describe("sessions", () => {
    it("sign-out revokes the session server-side", async () => {
        const { token } = await signUp();
        expect((await call("/sign-out", { body: {}, token })).status).toBe(200);
        expect((await me(token)).status).toBe(401);
    });

    it.each([
        ["no cookie", async () => undefined],
        ["a garbage cookie", async () => "better-auth.session_token=garbage"],
        ["an expired session", async () => {
            const { token } = await signUp();
            await run(`UPDATE session SET "expiresAt" = now() - interval '1 minute'`);
            return token;
        }],
        ["a user deleted by an admin", async () => {
            const { token, user } = await signUp();
            await run(`DELETE FROM "user" WHERE id = ?`, [user.id]);
            expect(await get(`SELECT id FROM session WHERE "userId" = ?`, [user.id])).toBeUndefined();
            return token;
        }],
    ])("protected routes answer 401 with %s", async (_, cookie) => {
        expect((await me(await cookie())).status).toBe(401);
    });

    it("unauthorized expires both session cookie names, so a stale cookie can't loop the proxy", () => {
        const cookies = unauthorized().headers.getSetCookie();
        expect(cookies).toEqual(
            expect.arrayContaining([
                expect.stringMatching(/^better-auth\.session_token=;.*Max-Age=0/),
                expect.stringMatching(/^__Secure-better-auth\.session_token=;.*Max-Age=0.*Secure/),
            ])
        );
    });
});

// Last: it drops every table and rebuilds the schema through a fresh module graph.
describe("fresh deploy", () => {
    it("a sign-up as the very first request works on an empty database", async () => {
        await run(`DROP TABLE "user", subscriptions, notification_settings, payment_logs, rate_limits,
                              session, account, verification, "rateLimit" CASCADE`);
        vi.resetModules();
        const route = await import("@/app/api/auth/[...all]/route");
        const res = await route.POST(authReq("/sign-up/email", { body: signUpBody() }));
        expect(res.status).toBe(200);
    });
});
