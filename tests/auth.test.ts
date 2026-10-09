import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as register from "@/app/api/auth/register/route";
import * as login from "@/app/api/auth/login/route";
import * as me from "@/app/api/auth/me/route";
import { get } from "@/server/db";
import { req, reset, signUp, tokenOf } from "./helpers";

beforeEach(reset);

describe("POST /api/auth/register", () => {
    it("creates a free user, hashes the password and sets an HttpOnly session cookie", async () => {
        const res = await register.POST(req("POST", { body: { name: "Ana", email: "ana@test.dev", password: "secret123" } }));
        expect(res.status).toBe(201);
        const body = await res.json();
        const { user } = body;
        expect(user).toMatchObject({ email: "ana@test.dev", name: "Ana", plan: "free" });
        expect(user.password).toBeUndefined();
        expect(body.token).toBeUndefined(); // never readable by page scripts
        expect(res.headers.get("set-cookie")).toMatch(/HttpOnly; SameSite=Lax/);

        const row = await get("SELECT password FROM users WHERE id = ?", [user.id]);
        expect(row!.password).not.toBe("secret123");
    });

    it.each([
        [{ email: "a@test.dev", password: "x" }],
        [{ name: "Ana", password: "x" }],
        [{ name: "Ana", email: "a@test.dev" }],
        [{ name: "", email: "a@test.dev", password: "x" }],
    ])("rejects missing fields %o", async (body) => {
        const res = await register.POST(req("POST", { body }));
        expect(res.status).toBe(400);
    });

    it.each([
        [{ name: "Ana", email: "not-an-email", password: "secret123" }],
        [{ name: "Ana", email: "a@test.dev", password: "short" }],
        [{ name: "x".repeat(101), email: "a@test.dev", password: "secret123" }],
    ])("rejects invalid fields %o", async (body) => {
        expect((await register.POST(req("POST", { body }))).status).toBe(400);
    });

    it("limits sign-ups per IP", async () => {
        for (let i = 0; i < 5; i++) await signUp();
        const res = await register.POST(req("POST", { body: { name: "A", email: "late@test.dev", password: "secret123" } }));
        expect(res.status).toBe(429);
    });

    it("rejects a duplicate email", async () => {
        await signUp("dup@test.dev");
        const res = await register.POST(req("POST", { body: { name: "B", email: "dup@test.dev", password: "secret123" } }));
        expect(res.status).toBe(400);
        expect((await res.json()).error).toMatch(/already exists/);
    });
});

describe("POST /api/auth/login", () => {
    it("returns the user without password and a valid token", async () => {
        await signUp("ana@test.dev");
        const res = await login.POST(req("POST", { body: { email: "ana@test.dev", password: "secret123" } }));
        expect(res.status).toBe(200);
        const { user } = await res.json();
        expect(user.password).toBeUndefined();
        expect((jwt.verify(tokenOf(res), process.env.JWT_SECRET!) as { id: string }).id).toBe(user.id);
    });

    it("rejects a wrong password and an unknown email with the same message", async () => {
        await signUp("ana@test.dev");
        for (const body of [
            { email: "ana@test.dev", password: "wrong" },
            { email: "nobody@test.dev", password: "secret123" },
        ]) {
            const res = await login.POST(req("POST", { body }));
            expect(res.status).toBe(401);
            expect((await res.json()).error).toBe("Invalid credentials");
        }
    });

    it("locks out an email after 10 failed attempts", async () => {
        await signUp("ana@test.dev");
        const attempt = (password: string) => login.POST(req("POST", { body: { email: "ana@test.dev", password } }));
        for (let i = 0; i < 10; i++) expect((await attempt("wrong")).status).toBe(401);
        expect((await attempt("secret123")).status).toBe(429);
    });

    it("requires email and password", async () => {
        const res = await login.POST(req("POST", { body: { email: "ana@test.dev" } }));
        expect(res.status).toBe(400);
    });
});

describe("GET /api/auth/me (token handling shared by all protected routes)", () => {
    it("returns the current user", async () => {
        const { token, email } = await signUp();
        const res = await me.GET(req("GET", { token }));
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.email).toBe(email);
        expect(body.password).toBeUndefined();
        expect(body.isAdmin).toBe(false);
    });

    it("flags users listed in ADMIN_EMAILS as admin (case-insensitive)", async () => {
        vi.stubEnv("ADMIN_EMAILS", " other@test.dev , Boss@Test.dev");
        const { token } = await signUp("boss@test.dev");
        expect((await (await me.GET(req("GET", { token }))).json()).isAdmin).toBe(true);
        vi.unstubAllEnvs();
    });

    it.each([
        ["no token", undefined],
        ["garbage token", "not-a-jwt"],
        ["token signed with another secret", jwt.sign({ id: "x" }, "other-secret")],
        ["expired token", jwt.sign({ id: "x" }, "test-secret", { expiresIn: -10 })],
        ["token for a deleted user", jwt.sign({ id: "ghost" }, "test-secret")],
    ])("401 with %s", async (_, token) => {
        const res = await me.GET(req("GET", { token }));
        expect(res.status).toBe(401);
    });
});
