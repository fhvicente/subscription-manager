# better-auth Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hand-rolled JWT/bcrypt auth with better-auth 1.7.7 on its default schema (`"user"`, `session`, `account`, `verification`, `"rateLimit"`). Every app route keeps calling `getUser(req)`, and API responses keep their shape.

**Architecture:** One better-auth instance (`src/server/better-auth.ts`) on the app's `pg` pool, served by a catch-all `/api/auth/[...all]` route. `src/server/auth.ts` keeps its interface (`getUser`, `unauthorized`, `isAdmin`, ...) but resolves the user from a better-auth session. The client `AuthProvider` keeps its API and uses `better-auth/react` inside.

**Tech Stack:** Next.js 16 (App Router, route handlers, `proxy.ts`), Postgres via `pg`, better-auth 1.7.7, Vitest integration tests against the `subtrack_test` database.

**Spec:** `docs/superpowers/specs/2026-10-09-better-auth-design.md`

## Global Constraints

- `better-auth` pinned to exactly `1.7.7` (same as the user's other project). No other new dependency.
- Remove `jsonwebtoken`, `bcrypt`, `@types/jsonwebtoken`, `@types/bcrypt`.
- better-auth default schema:
  - table `"user"`, always quoted because `user` is reserved in Postgres, with camelCase `"createdAt"`/`"updatedAt"`/`"emailVerified"`;
  - `plan`, `premiumUntil` and `stripeCustomerId` are `user.additionalFields` with `input: false`;
  - the table `users` no longer exists anywhere.
- App tables keep their snake_case columns. Their `user_id` FKs reference `"user" (id) ON DELETE CASCADE`.
- API responses keep their shape. Where a query over `"user"` returns timestamps to the client, alias them `"createdAt" AS created_at` and `"updatedAt" AS updated_at`.
- No destructive SQL in app code. Existing DBs are reset by hand (README). Only the throwaway `subtrack_test` DB is dropped and recreated by the implementer.
- Env vars: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`. `JWT_SECRET`/`JWT_EXPIRES_IN` disappear everywhere.
- Limits:
  - sign-in: 20 per IP / 15 min; sign-up: 5 per IP / hour (better-auth `customRules`, `storage: "database"`);
  - sign-in: 10 per email / 15 min (our `rateLimited()` in a `before` hook);
  - name: 1–100 characters after trim; password: 8–128 (better-auth defaults).
- Sign-up enumeration is an accepted risk: no `requireEmailVerification`, `autoSignIn` stays on.
- Ponytail: shortest correct diff. Keep existing names and patterns. Comments in English, matching the surrounding density.
- Work only inside the worktree `/home/flaviovicente/projetos/subscription-manager/.claude/worktrees/better-auth`. Never touch the main checkout.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.

## Review Focus

1. **First request after a deploy is a sign-up, on an empty DB.** It must succeed. Pinned in Task 1 ("fresh deploy" test).
2. **A stale or expired session cookie must not loop** between `/sign-in` and `/dashboard`. Every 401 expires both better-auth cookie names. Pinned in Task 1.
3. **Admin deletes a user:** their sessions die with them (FK cascade to `"user"`), and their cookie gets 401. Pinned in Task 1.
4. **Email case:** signing up as `Ana@Test.dev` and signing in as `ana@test.dev` works, and the per-email lockout counts both spellings as one. Pinned in Task 1.
5. **Sign-up can't grant premium:** a body with `plan: "premium"` still creates a `free` user (`input: false`). Pinned in Task 1.

Sign-out revocation is also pinned in Task 1.

---

### Task 1: Server-side switch to better-auth

**Files:**
- Modify: `package.json`, `package-lock.json` (via npm)
- Modify: `src/server/db.ts` (export `pool`, add `ensureSchema`, new schema)
- Create: `src/server/better-auth.ts`
- Create: `src/app/api/auth/[...all]/route.ts`
- Delete: `src/app/api/auth/login/route.ts`, `src/app/api/auth/register/route.ts`, `src/app/api/auth/me/route.ts`, `src/app/api/auth/logout/route.ts`
- Modify: `src/server/auth.ts` (rewrite the session part, keep the admin helpers)
- Modify: `src/app/(protected)/dashboard/layout.tsx`, `src/app/(protected)/admin/layout.tsx`
- Modify (`users` → `"user"`): `src/server/email.ts`, `src/app/api/payments/cancel-subscription/route.ts`, `src/app/api/payments/session/route.ts`, `src/app/api/payments/webhook/route.ts`, `src/app/api/admin/route.ts`, `src/app/api/admin/users/[id]/route.ts`, `src/app/api/users/profile/route.ts`
- Modify: `vitest.config.ts`, `tests/helpers.ts`, `tests/subscriptions.test.ts`, `tests/payments.test.ts`, `tests/admin.test.ts`
- Rewrite: `tests/auth.test.ts`
- Modify: `README.md` (env table, one-time reset), `API.md` (auth section)

**Interfaces:**
- Consumes: `rateLimited(key, limit, windowSeconds): Promise<boolean>` and `get`/`run` from `src/server/db.ts` (exist today).
- Produces:
  - `pool: Pool` and `ensureSchema(): Promise<unknown>` from `src/server/db.ts`.
  - `auth` (the better-auth instance) from `src/server/better-auth.ts`.
  - `getUser(req: Request): Promise<Row | null>`, `currentUser(): Promise<Row | null>`, `unauthorized(): Response` from `src/server/auth.ts`. `Row` is the full `"user"` row. `isAdmin`, `forbidden`, `logAdmin`, `clientIp`, `tooManyRequests` are unchanged.
  - Test helpers: `signUp(email?) → { user, token, email }`, where `token` is now the whole `name=value` session cookie pair, plus `sessionCookie(res)` and `authReq(path, opts)`. `req()` keeps its signature and sends `token` as the `cookie` header.

- [ ] **Step 1: Recreate the throwaway test database and swap the dependencies**

The test DB holds the old schema, and nothing in it is kept. Touch only `subtrack_test`, never the `subtrack` dev database or Neon.

```bash
docker compose exec -T db psql -U subtrack -c "DROP DATABASE IF EXISTS subtrack_test" -c "CREATE DATABASE subtrack_test"
npm install better-auth@1.7.7 --save-exact
npm uninstall jsonwebtoken bcrypt @types/jsonwebtoken @types/bcrypt
```

- [ ] **Step 2: Point the tests at better-auth env vars**

In `vitest.config.ts`, replace

```ts
            JWT_SECRET: "test-secret",
            JWT_EXPIRES_IN: "1h",
```

with

```ts
            BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-chars",
            BETTER_AUTH_URL: "http://localhost:3000",
```

- [ ] **Step 3: Rewrite the test helpers**

Replace `tests/helpers.ts` entirely:

```ts
import { randomUUID } from "node:crypto";
import { get, run } from "@/server/db";
import { auth } from "@/server/better-auth";

export const reset = () =>
    run(
        `TRUNCATE "user", subscriptions, notification_settings, payment_logs, rate_limits,
                  session, account, verification, "rateLimit" CASCADE`
    );

// `token` is the session cookie pair (`better-auth.session_token=...`), sent as-is.
export function req(method: string, { body, token, url = "http://test/" }: { body?: unknown; token?: string; url?: string } = {}) {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (token) headers.cookie = token;
    return new Request(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
}

// The `name=value` of the session cookie a better-auth response sets.
export const sessionCookie = (res: Response) =>
    res.headers.getSetCookie().find((c) => /^(__Secure-)?better-auth\.session_token=/.test(c))?.split(";")[0] ?? "";

// A request to a better-auth endpoint the way the browser sends it: same-origin Origin header and a client IP.
export function authReq(path: string, { body, token }: { body?: unknown; token?: string } = {}) {
    const headers: Record<string, string> = {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        "x-forwarded-for": "203.0.113.7",
    };
    if (token) headers.cookie = token;
    return new Request(`http://localhost:3000/api/auth${path}`, {
        method: body === undefined ? "GET" : "POST",
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
    });
}

export const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

// Calls better-auth directly (no HTTP, so no per-IP limit) and returns the "user" row in the API's shape.
export async function signUp(email = `${randomUUID()}@test.dev`) {
    const res = await auth.api.signUpEmail({ body: { name: "Ana", email, password: "secret123" }, asResponse: true });
    const { user: created } = await res.json();
    const user = await get(
        `SELECT id, email, name, plan, "createdAt" AS created_at, "updatedAt" AS updated_at FROM "user" WHERE id = ?`,
        [created.id]
    );
    return { user: user!, token: sessionCookie(res), email };
}

export const inDays = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
```

In `tests/subscriptions.test.ts`, the "400 on a body that is not JSON" test builds its own header. Change

```ts
headers: { cookie: `token=${token}` }
```

to

```ts
headers: { cookie: token }
```

- [ ] **Step 4: Write the new auth tests (failing)**

Replace `tests/auth.test.ts` entirely:

```ts
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
```

- [ ] **Step 5: Run the tests and confirm they fail**

Run: `npx vitest run tests/auth.test.ts`
Expected: FAIL. `@/server/better-auth` cannot be resolved.

- [ ] **Step 6: New schema and `ensureSchema` in the database module**

In `src/server/db.ts`:

(a) In the `schema` template string, replace the whole `CREATE TABLE IF NOT EXISTS users (...)` block with the better-auth tables. Put them first, because the app tables reference `"user"`:

```sql
-- better-auth's default schema (src/server/better-auth.ts). "user" is quoted: it's a reserved word.
-- plan / premiumUntil / stripeCustomerId are better-auth additionalFields.
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  image TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  plan TEXT NOT NULL DEFAULT 'free',
  "premiumUntil" TIMESTAMPTZ,
  "stripeCustomerId" TEXT
);

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMPTZ,
  "refreshTokenExpiresAt" TIMESTAMPTZ,
  scope TEXT,
  password TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "rateLimit" (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  count INTEGER NOT NULL,
  "lastRequest" BIGINT NOT NULL
);
```

In the three app tables, change every `REFERENCES users (id)` to `REFERENCES "user" (id)`. Keep `ON DELETE CASCADE` and every other column as is. The comment above `const schema` should say that camelCase columns are quoted so Postgres keeps their case, and that the better-auth tables use its default names.

After Step 7, once the config exists, cross-check these columns against what better-auth expects:

```bash
npx @better-auth/cli@1.7.7 generate --config src/server/better-auth.ts --output /tmp/claude-1000/ba-schema.sql -y
```

If the CLI can't load the config (path aliases), skip it: the tests in Step 10 exercise every table. If the CLI shows a column missing above, add it in the same style.

(b) Export the pool and pull the lazy schema into `ensureSchema`. Change

```ts
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

to

```ts
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

and replace the `exec` function with:

```ts
// better-auth queries `pool` directly, so its callers await this too (see src/server/auth.ts).
export const ensureSchema = () =>
    (ready ??= pool.query(schema).catch((err) => {
        ready = undefined; // retry on the next request, e.g. if the DB wasn't up yet
        throw err;
    }));

async function exec(sql: string, params: Param[]) {
    await ensureSchema();
    return pool.query(numbered(sql), bind(params));
}
```

- [ ] **Step 7: Create the better-auth instance**

Create `src/server/better-auth.ts`:

```ts
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { pool, rateLimited } from "./db";

const FIFTEEN_MIN = 15 * 60;

export const auth = betterAuth({
    database: pool,
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    emailAndPassword: { enabled: true },
    // Billing state lives on the user; input: false so sign-up / update-user can't set it.
    user: {
        additionalFields: {
            plan: { type: "string", defaultValue: "free", input: false },
            premiumUntil: { type: "date", required: false, input: false },
            stripeCustomerId: { type: "string", required: false, input: false },
        },
    },
    rateLimit: {
        enabled: process.env.NODE_ENV !== "development",
        storage: "database", // shared by all serverless instances
        customRules: {
            "/sign-in/email": { window: FIFTEEN_MIN, max: 20 },
            "/sign-up/email": { window: 60 * 60, max: 5 },
        },
    },
    hooks: {
        before: createAuthMiddleware(async (ctx) => {
            if (ctx.path === "/sign-up/email") {
                const name = typeof ctx.body?.name === "string" ? ctx.body.name.trim() : "";
                if (!name || name.length > 100) {
                    throw new APIError("BAD_REQUEST", { message: "Name must be 1 to 100 characters" });
                }
            }
            // better-auth limits per IP only; this stops credential stuffing spread over many IPs.
            if (ctx.path === "/sign-in/email" && typeof ctx.body?.email === "string") {
                if (await rateLimited(`login:email:${ctx.body.email.toLowerCase()}`, 10, FIFTEEN_MIN)) {
                    throw new APIError("TOO_MANY_REQUESTS", { message: "Too many attempts, try again later" });
                }
            }
        }),
    },
});
```

- [ ] **Step 8: Mount better-auth and delete the old auth routes**

Create `src/app/api/auth/[...all]/route.ts`:

```ts
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/server/better-auth";
import { ensureSchema } from "@/server/db";

const handler = toNextJsHandler(auth);

// The first request after a deploy may be a sign-up, before any of our own queries created the tables.
export const GET = async (req: Request) => (await ensureSchema(), handler.GET(req));
export const POST = async (req: Request) => (await ensureSchema(), handler.POST(req));
```

```bash
git rm -r src/app/api/auth/login src/app/api/auth/register src/app/api/auth/me src/app/api/auth/logout
```

- [ ] **Step 9: Resolve users from better-auth sessions**

In `src/server/auth.ts`, replace everything from the top of the file through the end of `unauthorized` with:

```ts
import { headers } from "next/headers";
import { auth } from "./better-auth";
import { ensureSchema, get } from "./db";

// The full "user" row (plan, premiumUntil, stripeCustomerId, ...) behind the session cookie, or null.
async function userFrom(h: Headers) {
    await ensureSchema();
    const session = await auth.api.getSession({ headers: h });
    return session ? ((await get(`SELECT * FROM "user" WHERE id = ?`, [session.user.id])) ?? null) : null;
}

export const getUser = (req: Request) => userFrom(req.headers);

// For server components, which have no Request.
export const currentUser = async () => userFrom(await headers());

// Also expires the session cookie (both names better-auth uses: plain, and __Secure- over https),
// so a stale cookie can't bounce the user between the proxy and the sign-in page.
export function unauthorized() {
    const h = new Headers();
    h.append("Set-Cookie", "better-auth.session_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax");
    h.append("Set-Cookie", "__Secure-better-auth.session_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure");
    return Response.json({ error: "Invalid or expired session" }, { status: 401, headers: h });
}
```

Keep `clientIp`, `tooManyRequests`, `isAdmin`, `forbidden` and `logAdmin` below it exactly as they are. `signToken`, `withSession`, `clearSession` and `userFromToken` are gone.

Replace `src/app/(protected)/dashboard/layout.tsx` with:

```tsx
import { redirect } from "next/navigation";
import { currentUser, isAdmin } from "@/server/auth";

// Admins land here after login (and via the proxy); their home is the admin panel.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    if (isAdmin(await currentUser())) redirect("/admin");
    return children;
}
```

and `src/app/(protected)/admin/layout.tsx` with:

```tsx
import { redirect } from "next/navigation";
import { currentUser, isAdmin } from "@/server/auth";

// Non-admins never see the panel; the /api/admin routes enforce the same check (403).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    if (!isAdmin(await currentUser())) redirect("/dashboard");
    return children;
}
```

- [ ] **Step 10: Rename `users` to `"user"` in the app's SQL**

Apply exactly these changes:

- `src/server/email.ts`: `JOIN users u ON s.user_id = u.id` → `JOIN "user" u ON s.user_id = u.id`.
- `src/app/api/payments/cancel-subscription/route.ts`: `UPDATE users SET plan = 'free'` → `UPDATE "user" SET plan = 'free'`. Use a backtick string if needed.
- `src/app/api/payments/session/route.ts`: `UPDATE users SET "stripeCustomerId"` → `UPDATE "user" SET "stripeCustomerId"`.
- `src/app/api/payments/webhook/route.ts`: every `users` in SQL → `"user"` (the `UPDATE`s and the `SELECT id FROM users`).
- `src/app/api/admin/route.ts`:
  - user KPI query: `FROM users` → `FROM "user"`, and its `${LAST_30}` → `"createdAt" > now() - interval '30 days'`. `LAST_30` stays as is for `payment_logs`.
  - user list: `u.created_at,` → `u."createdAt" AS created_at,`, `FROM users u` → `FROM "user" u`, `ORDER BY u.created_at DESC` → `ORDER BY u."createdAt" DESC`.
  - recent payments: `JOIN users u` → `JOIN "user" u`.
- `src/app/api/admin/users/[id]/route.ts`:
  - `SELECT id, email, name, plan, "premiumUntil", created_at FROM users` → `SELECT id, email, name, plan, "premiumUntil", "createdAt" AS created_at FROM "user"`;
  - `UPDATE users SET plan = ?, "premiumUntil" = ?, updated_at = now()` → `UPDATE "user" SET plan = ?, "premiumUntil" = ?, "updatedAt" = now()`;
  - the PATCH's trailing `SELECT ... FROM users` → `FROM "user"`;
  - `DELETE FROM users` → `DELETE FROM "user"`.
- `src/app/api/users/profile/route.ts`:
  - the `profile` query → ``get(`SELECT id, email, name, plan, "createdAt" AS created_at, "updatedAt" AS updated_at FROM "user" WHERE id = ?`, [id])``;
  - the PUT → ``run(`UPDATE "user" SET name = ?, "updatedAt" = now() WHERE id = ?`, [body.name, user.id])``.
- `tests/subscriptions.test.ts`, `tests/payments.test.ts`, `tests/admin.test.ts`: every SQL `users` → `"user"`. Use backticks where the string was double-quoted, e.g. ``get(`SELECT plan FROM "user" WHERE id = ?`, ...)``.

Then check that no SQL still says `users`:

```bash
grep -rnE "(FROM|JOIN|UPDATE|INTO|TRUNCATE|REFERENCES) +users\b" src tests
```

Expected: no output.

- [ ] **Step 11: Run the auth tests, then everything**

Run: `npx vitest run tests/auth.test.ts`
Expected: PASS.

If an assertion on a better-auth status fails (for example, duplicate email returns something other than 422), read the real one in `node_modules/better-auth/dist/api/routes/sign-up.mjs` or `sign-in.mjs`. Assert that exact status and note it in the test name. Never loosen an assertion to "any 4xx".

If the per-IP 429 never comes, check that better-auth reads `x-forwarded-for` (`advanced.ipAddress`). Fix the config, not the test.

Run: `npx vitest run && npx tsc --noEmit`
Expected: all suites PASS (subscriptions, payments, users, admin, auth, subscription-form), and no type errors.

`tests/users.test.ts` gets its `isAdmin` test in Task 2. Nothing in it should fail now.

- [ ] **Step 12: Update the docs**

In `README.md`:
- **env table:** replace the `JWT_SECRET`, `JWT_EXPIRES_IN` row with these two rows:
  - `` | `BETTER_AUTH_SECRET` | yes | Signs session cookies (32+ random chars: `openssl rand -base64 32`) | ``
  - `` | `BETTER_AUTH_URL` | yes | Public app URL, e.g. `http://localhost:3000` | ``
- **`ADMIN_EMAILS` row:** change `` `isAdmin` flag on `/api/auth/me` `` to `` `isAdmin` flag on `/api/users/profile` ``.
- **Local setup section:** add a short note that a database created before better-auth must be reset once, and that the schema is recreated on the next request:

  ```bash
  docker compose exec db psql -U subtrack -c 'DROP TABLE IF EXISTS users, subscriptions, notification_settings, payment_logs, rate_limits, "user", session, account, verification, "rateLimit" CASCADE'
  ```

  Add that on Neon the same `DROP TABLE` runs once in the SQL editor. It deletes all data, which is acceptable only because there are no real users yet.

In `API.md`'s authentication section (the lines saying a JWT goes in the `Authorization` header, returned by `/api/auth/login` and `/api/auth/register`), say instead that:
- authentication is a better-auth session cookie (HttpOnly);
- it is obtained from `POST /api/auth/sign-up/email` `{ name, email, password }` or `POST /api/auth/sign-in/email` `{ email, password }`;
- `POST /api/auth/sign-out` ends it;
- `GET /api/users/profile` returns the current user.

Remove any remaining sections for `/api/auth/login`, `/register`, `/me` and `/logout` (`grep -n "api/auth" API.md`).

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: replace JWT auth with better-auth on its default schema

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Client, proxy and the admin flag on the profile

**Files:**
- Modify: `src/app/api/users/profile/route.ts` (add `isAdmin`)
- Modify: `src/lib/auth.js` (better-auth client inside the same `AuthProvider` API)
- Modify: `src/proxy.ts` (`getSessionCookie`)
- Test: `tests/users.test.ts`

**Interfaces:**
- Consumes: `getUser`, `isAdmin`, `unauthorized` from `src/server/auth.ts` (Task 1); better-auth endpoints under `/api/auth/*` (Task 1); helpers `signUp`, `req`, `reset` (Task 1).
- Produces: `GET /api/users/profile` → `{ id, email, name, plan, created_at, updated_at, isAdmin }`. `useAuth()` still returns `{ user, loading, error, register, login, logout, isAuthenticated, refreshUser }`, where `login`/`register` resolve to `{ success: true, user } | { success: false, error }`.

- [ ] **Step 1: Write the failing test**

In `tests/users.test.ts`, add `vi` to the vitest import (`import { beforeEach, describe, expect, it, vi } from "vitest";`). Then, inside the `describe("/api/users/profile", ...)` block, add:

```ts
    it("tells the client whether the user is an admin (ADMIN_EMAILS, case-insensitive)", async () => {
        vi.stubEnv("ADMIN_EMAILS", " other@test.dev , Boss@Test.dev");
        try {
            const boss = await signUp("boss@test.dev");
            const ana = await signUp("ana@test.dev");
            expect((await (await profile.GET(req("GET", { token: boss.token }))).json()).isAdmin).toBe(true);
            expect((await (await profile.GET(req("GET", { token: ana.token }))).json()).isAdmin).toBe(false);
        } finally {
            vi.unstubAllEnvs();
        }
    });
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run tests/users.test.ts`
Expected: FAIL. `isAdmin` is `undefined`.

- [ ] **Step 3: Add `isAdmin` to the profile**

In `src/app/api/users/profile/route.ts`, change the import to `import { getUser, isAdmin, unauthorized } from "@/server/auth";` and the `GET` return to:

```ts
    return Response.json({ ...(await profile(user.id)), isAdmin: isAdmin(user) });
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `npx vitest run tests/users.test.ts`
Expected: PASS.

- [ ] **Step 5: Switch the proxy to the better-auth cookie**

In `src/proxy.ts`, add `import { getSessionCookie } from "better-auth/cookies";` and replace

```ts
    const token = request.cookies.get("token")?.value;
```

with

```ts
    // Presence check only (handles the __Secure- prefix too); API routes validate the session.
    const token = getSessionCookie(request);
```

- [ ] **Step 6: Move the client `AuthProvider` onto better-auth**

In `src/lib/auth.js`:

(a) Add `import { createAuthClient } from 'better-auth/react';` with the other imports, and below `const API_URL = '/api';` add:

```js
// Same origin, so no baseURL: it talks to /api/auth/* (better-auth).
const authClient = createAuthClient();

// Our user row (plan, isAdmin, ...), which the better-auth session doesn't carry.
const fetchProfile = async () => (await axios.get(`${API_URL}/users/profile`)).data;
```

(b) Replace the initial-load `useEffect`, `getCurrentUser`, `register`, `login` and `logout` with:

```js
  // The session lives in an HttpOnly cookie that JS can't read, so ask the server who we are.
  // A 401 just means "logged out": public pages render this provider too.
  useEffect(() => {
    fetchProfile()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // better-auth answers { data, error } instead of throwing; map both to what the pages expect.
  const authenticate = async (call, fallback) => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await call();
      if (error) throw new Error(error.message || fallback);
      const user = await fetchProfile();
      setUser(user);
      return { success: true, user };
    } catch (e) {
      const message = e.message || fallback;
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const register = (userData) => authenticate(() => authClient.signUp.email(userData), 'Registration failed');

  const login = (email, password) => authenticate(() => authClient.signIn.email({ email, password }), 'Login failed');

  const logout = async () => {
    await authClient.signOut().catch(() => {});
    setUser(null);
    router.push('/sign-in');
  };
```

(c) In `refreshUser`, replace `const userData = await getCurrentUser();` with `const userData = await fetchProfile();`. Also update the `isAuthenticated` comment: "while the initial /auth/me" becomes "while the initial profile load".

- [ ] **Step 7: Typecheck, lint, build, full tests**

```bash
npx tsc --noEmit
npx eslint src
npx vitest run
npx next build
```

Expected:
- `tsc`: no errors.
- eslint: no errors in `src/lib/auth.js`, `src/proxy.ts`, `src/app/api/users/profile/route.ts`, or any file Task 1 touched. The pre-existing `react-hooks/*` errors in other files are known; don't fix them.
- All tests PASS.
- Build succeeds.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: client and proxy use better-auth sessions; profile carries isAdmin

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

## Final verification (controller, after both tasks)

Run the built app against a scratch database `subtrack_smoke`, created for this and dropped afterwards. Never use the user's `subtrack` dev DB, which still has the old schema until they reset it. Set:
- `DATABASE_URL=postgres://subtrack:subtrack@localhost:5432/subtrack_smoke`;
- `BETTER_AUTH_SECRET`;
- `BETTER_AUTH_URL=http://localhost:3100`;

then run `next start -p 3100`. With Playwright, check:
1. sign-up lands on `/dashboard`;
2. a reload stays logged in;
3. sign-out goes to `/sign-in`, and `/dashboard` then redirects to `/sign-in`;
4. sign-in works;
5. a user listed in `ADMIN_EMAILS` lands on `/admin`;
6. after the session row is deleted in the DB, visiting `/dashboard` ends on `/sign-in` with no redirect loop.

Drop `subtrack_smoke` afterwards.
