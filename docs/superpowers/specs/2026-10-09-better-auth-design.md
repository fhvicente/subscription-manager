# Migrate authentication to better-auth

Date: 2026-10-09 · Branch: `worktree-better-auth` (from `e01e372`, admin area included)

## Goal

Replace the hand-rolled auth (JWT in an HttpOnly `token` cookie, bcrypt, `/api/auth/{login,register,me,logout}`) with better-auth, the same library the user's other project uses. Gains: server-side sessions (logout really revokes), constant-time login for unknown emails, maintained code instead of ours.

## Decisions (agreed with the user)

- **No accounts to keep.** Only test data exists. better-auth uses its default scrypt hashing; no bcrypt compatibility. Existing rows lose their password and must sign up again.
- **better-auth maps onto the existing `users` table** (option A). Every `SELECT ... FROM users` in the app (payments, webhook, cron, admin) stays as is.
- **Sign-up enumeration stays an accepted risk.** No `requireEmailVerification`, `autoSignIn` stays on. Revisit when email sending works (see memory `email-verification-deferred`).
- Email + password only. No OAuth.

## Server

### `src/server/better-auth.ts` (new)

```ts
betterAuth({
  database: pool,                                  // exported from db.ts, one pool for the app
  secret: BETTER_AUTH_SECRET, baseURL: BETTER_AUTH_URL,
  emailAndPassword: { enabled: true },             // 8..128 chars, better-auth defaults
  user: { modelName: "users", fields: { createdAt: "created_at", updatedAt: "updated_at" } },
  rateLimit: { enabled: NODE_ENV !== "development", storage: "database",
               customRules: { "/sign-in/email": { window: 900, max: 20 },
                              "/sign-up/email": { window: 3600, max: 5 } } },
  hooks: { before },                               // see below
})
```

`before` hook:
- `/sign-up/email`: reject a `name` longer than 100 characters, or blank (`APIError("BAD_REQUEST")`).
- `/sign-in/email`: per-email lockout, 10 attempts / 15 min via the existing `rateLimited()` (key `login:email:<lowercased>`). better-auth only limits per IP, which doesn't stop credential stuffing spread over many IPs. Returns 429.

Columns better-auth doesn't know (`plan`, `premiumUntil`, `stripeCustomerId`) get their DB defaults on insert (`plan = 'free'`). No `additionalFields`.

### `src/app/api/auth/[...all]/route.ts` (new)

`export const { GET, POST } = toNextJsHandler(auth)`. Endpoints: `/api/auth/sign-up/email`, `/sign-in/email`, `/sign-out`, `/get-session`.

Deleted: `src/app/api/auth/{login,register,me,logout}/route.ts`.

### `src/server/auth.ts`: same interface for the app

| Export | After the migration |
| --- | --- |
| `getUser(req)` | `auth.api.getSession({ headers: req.headers })`, then `SELECT * FROM users WHERE id = ?`. Same full row as today. |
| `currentUser()` (new) | Same, using `headers()` from `next/headers`. For server components. Replaces `userFromToken`. |
| `unauthorized` | Still expires the session cookie, now under both better-auth names (`better-auth.session_token` and `__Secure-better-auth.session_token`). `getSession` called from our routes doesn't clear a stale cookie, so without this the proxy (cookie present) and the API (401) would bounce the user between `/sign-in` and `/dashboard`. |
| `forbidden`, `isAdmin`, `logAdmin`, `clientIp`, `tooManyRequests` | Unchanged. |
| `signToken`, `withSession`, `clearSession`, `userFromToken` | Removed. |

`src/app/(protected)/{dashboard,admin}/layout.tsx`: `userFromToken(cookies().get("token"))` becomes `currentUser()`.

`GET /api/users/profile` adds `isAdmin: isAdmin(user)`. It replaces `/api/auth/me` as the source of the client's `user`.

Removed dependencies: `jsonwebtoken`, `bcrypt`, `@types/jsonwebtoken`, `@types/bcrypt`. Added: `better-auth`.

## Database

The `schema` in `db.ts` stays idempotent and runs on the first query. Added to it:

- The `session`, `account`, `verification` and `rateLimit` tables, as produced by `npx @better-auth/cli generate` for this config (FKs to `users(id)` with `ON DELETE CASCADE`, so the admin's user delete still works).
- On `users`: `DROP COLUMN IF EXISTS password`, `ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false`, `ADD COLUMN IF NOT EXISTS image TEXT`.

This works on an empty database and on the current local or Neon one, with no manual step. better-auth queries the pool directly, not through our `exec()`, so `db.ts` exports `ensureSchema()`. The `[...all]` route and `getUser`/`currentUser` await it before calling better-auth; otherwise a sign-up as the first request after a deploy would hit missing tables. Our own `rate_limits` table and `rateLimited()` stay: they back the per-email lockout and the test-email limit.

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
- Every other suite (subscriptions, payments, users, admin) passes with only the helper change.

## Config and docs

- README env table: `JWT_SECRET`/`JWT_EXPIRES_IN` become `BETTER_AUTH_SECRET` (required) and `BETTER_AUTH_URL` (the public app URL). Also update the `isAdmin` note (`/api/users/profile`).
- API.md: the auth section points to the better-auth endpoints.
- `vitest.config.ts`: set `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` and drop the `JWT_*` vars.
- The user must set `BETTER_AUTH_SECRET` in `.env.local` and in Vercel.

## Done when

- `npm test` passes and `tsc` is clean.
- `next build` succeeds and lint has no new errors.
- In a browser on the built app: sign-up, sign-in, the dashboard loads, an admin is redirected to `/admin`, and sign-out sends you back to sign-in.
