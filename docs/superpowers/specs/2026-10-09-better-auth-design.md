# Migrate authentication to better-auth

Date: 2026-10-09 · Branch: `worktree-better-auth` (from `e01e372`, admin area included)

## Goal

Replace the hand-rolled auth (JWT in an HttpOnly `token` cookie, bcrypt, `/api/auth/{login,register,me,logout}`) with better-auth, the same library the user's other project uses. Gains: better-auth's standard schema, server-side sessions (logout really revokes), constant-time login for unknown emails, maintained code instead of ours.

## Decisions (agreed with the user)

- **No accounts to keep.** Only test data exists. better-auth uses its default scrypt hashing; no bcrypt compatibility.
- **better-auth's default schema for its own tables** (revised 2026-10-09, replacing "map onto `users`"): `"user"`, `session`, `account`, `verification`, `"rateLimit"` with better-auth's camelCase columns. `users` is gone. `plan`, `premiumUntil` and `stripeCustomerId` become `user.additionalFields`. App tables (`subscriptions`, `notification_settings`, `payment_logs`, `rate_limits`) keep their snake_case columns; their `user_id` FKs point to `"user"(id)`.
- **Existing databases (local, Neon; test data only) are reset by hand once.** No destructive SQL in the app. README documents the command.
- **API responses don't change shape.** Queries over `"user"` alias `"createdAt" AS created_at` and `"updatedAt" AS updated_at` where the frontend reads them.
- **Sign-up enumeration stays an accepted risk.** No `requireEmailVerification`, `autoSignIn` stays on. Revisit when email sending works (see memory `email-verification-deferred`).
- Email + password only. No OAuth.

## Server

### `src/server/better-auth.ts` (new)

```ts
betterAuth({
  database: pool,                                  // exported from db.ts, one pool for the app
  secret: BETTER_AUTH_SECRET, baseURL: BETTER_AUTH_URL,
  emailAndPassword: { enabled: true },             // 8..128 chars, better-auth defaults
  user: { additionalFields: {                       // input: false, so sign-up can't set them
    plan: { type: "string", defaultValue: "free", input: false },
    premiumUntil: { type: "date", required: false, input: false },
    stripeCustomerId: { type: "string", required: false, input: false } } },
  rateLimit: { enabled: NODE_ENV !== "development", storage: "database",
               customRules: { "/sign-in/email": { window: 900, max: 20 },
                              "/sign-up/email": { window: 3600, max: 5 } } },
  hooks: { before },                               // see below
})
```

`before` hook:
- `/sign-up/email`: reject a `name` longer than 100 characters, or blank (`APIError("BAD_REQUEST")`).
- `/sign-in/email`: per-email lockout, 10 attempts / 15 min via the existing `rateLimited()` (key `login:email:<lowercased>`). better-auth only limits per IP, which doesn't stop credential stuffing spread over many IPs. Returns 429.

`users` → `"user"` in every query: `src/server/email.ts`, `src/app/api/payments/{cancel-subscription,session,webhook}`, `src/app/api/admin/{route,users/[id]/route}.ts`, `src/app/api/users/profile/route.ts`, and the tests. On that table, `created_at`/`updated_at` become `"createdAt"`/`"updatedAt"`. In the admin KPIs, `LAST_30` stays for `payment_logs`; the user count uses `"createdAt"`.

### `src/app/api/auth/[...all]/route.ts` (new)

`export const { GET, POST } = toNextJsHandler(auth)`. Endpoints: `/api/auth/sign-up/email`, `/sign-in/email`, `/sign-out`, `/get-session`.

Deleted: `src/app/api/auth/{login,register,me,logout}/route.ts`.

### `src/server/auth.ts`: same interface for the app

| Export | After the migration |
| --- | --- |
| `getUser(req)` | `auth.api.getSession({ headers: req.headers })`, then `SELECT * FROM "user" WHERE id = ?` (the full row: plan, premiumUntil, stripeCustomerId, ...). |
| `currentUser()` (new) | Same, using `headers()` from `next/headers`. For server components. Replaces `userFromToken`. |
| `unauthorized` | Still expires the session cookie, now under both better-auth names (`better-auth.session_token` and `__Secure-better-auth.session_token`). `getSession` called from our routes doesn't clear a stale cookie, so without this the proxy (cookie present) and the API (401) would bounce the user between `/sign-in` and `/dashboard`. |
| `forbidden`, `isAdmin`, `logAdmin`, `clientIp`, `tooManyRequests` | Unchanged. |
| `signToken`, `withSession`, `clearSession`, `userFromToken` | Removed. |

`src/app/(protected)/{dashboard,admin}/layout.tsx`: `userFromToken(cookies().get("token"))` becomes `currentUser()`.

`GET /api/users/profile` adds `isAdmin: isAdmin(user)`. It replaces `/api/auth/me` as the source of the client's `user`.

Removed dependencies: `jsonwebtoken`, `bcrypt`, `@types/jsonwebtoken`, `@types/bcrypt`. Added: `better-auth`.

## Database

The `schema` in `db.ts` stays idempotent (`CREATE TABLE IF NOT EXISTS`) and runs on the first query:
- `users` is replaced by `"user"` (better-auth core columns plus `plan TEXT NOT NULL DEFAULT 'free'`, `"premiumUntil" TIMESTAMPTZ`, `"stripeCustomerId" TEXT`);
- `session`, `account`, `verification` and `"rateLimit"` are added in better-auth's default shape;
- the app tables' `REFERENCES users (id)` become `REFERENCES "user" (id)`, still `ON DELETE CASCADE`, so the admin's user delete still works.

The SQL is cross-checked against `npx @better-auth/cli generate`.

**Existing databases need a one-time manual reset**, because `CREATE TABLE IF NOT EXISTS` won't re-point existing FKs. The README documents:

```sql
DROP TABLE IF EXISTS users, subscriptions, notification_settings, payment_logs, rate_limits,
  "user", session, account, verification, "rateLimit" CASCADE;
```

Run it once on local dev and on Neon. The schema recreates everything on the next request.

better-auth queries the pool directly, not through our `exec()`, so `db.ts` exports `ensureSchema()`. The `[...all]` route and `getUser`/`currentUser` await it before calling better-auth; otherwise a sign-up as the first request after a deploy would hit missing tables. Our `rate_limits` table and `rateLimited()` stay: they back the per-email lockout and the test-email limit.

## Client

### `src/lib/auth.js`: same `AuthProvider` API

It still exposes `user, loading, error, login, register, logout, isAuthenticated, refreshUser`. Inside:
- `createAuthClient()` from `better-auth/react` (same origin, no baseURL).
- `login` and `register` call `signIn.email` and `signUp.email`. On success they load `user` from `GET /api/users/profile`. A better-auth error `{ message }` becomes the `error` string the pages already show.
- `logout` calls `signOut()`.
- `refreshUser` and the initial load use `GET /api/users/profile`. A 401 means logged out.

### `src/proxy.ts`

`request.cookies.get("token")` becomes `getSessionCookie(request)` from `better-auth/cookies`. Same routing logic, still only a presence check. Real validation stays in `getUser`.

## Tests

- `tests/helpers.ts`:
  - `signUp()` calls `auth.api.signUpEmail({ body, asResponse: true })` and keeps the `name=value` of the session cookie.
  - `req({ token })` sends it as the `cookie` header. `token` keeps its name, so app tests don't change.
  - `reset()` also truncates `session`, `account`, `verification`, `"rateLimit"`.
- `tests/auth.test.ts` is rewritten against `auth.handler` with real requests to `/api/auth/*`:
  - The session cookie is HttpOnly. better-auth's sign-up body does carry a `token`; it can't be used without the cookie signature (no bearer plugin), so it isn't asserted away.
  - Sign-in works. Sign-out revokes the session server-side: the old cookie gets 401 from `getUser`.
  - Passwords under 8 characters and names over 100 are rejected.
  - Duplicate email is rejected.
  - Per-IP limits on sign-up and sign-in apply, and so does the per-email lockout after 10 failures.
  - Protected routes return 401 without a session or with a garbage or expired cookie.
- Dropped: the JWT-specific tests and the bcrypt timing test. Equal timing is better-auth's code (`sign-in.mjs` hashes on unknown email).
- Every other suite (subscriptions, payments, users, admin) passes after the helper change and the `users` → `"user"` rename in its SQL.
- The test DB (`subtrack_test`) is dropped and recreated once, since it holds the old schema.

## Config and docs

- README env table: `JWT_SECRET`/`JWT_EXPIRES_IN` become `BETTER_AUTH_SECRET` (required) and `BETTER_AUTH_URL` (the public app URL). Also update the `isAdmin` note (`/api/users/profile`).
- API.md: the auth section points to the better-auth endpoints.
- `vitest.config.ts`: set `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` and drop the `JWT_*` vars.
- README documents the one-time reset (SQL above) for existing databases.
- The user must set `BETTER_AUTH_SECRET` in `.env.local` and in Vercel, and run the reset on local dev and on Neon.

## Done when

- `npm test` passes and `tsc` is clean.
- `next build` succeeds and lint has no new errors.
- In a browser on the built app: sign-up, sign-in, the dashboard loads, an admin is redirected to `/admin`, and sign-out sends you back to sign-in.
