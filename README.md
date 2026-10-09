# SubTrack

A simple and effective tool to manage your subscriptions and save money.

## Technology Stack

One Next.js app: pages in `src/app`, the REST API as route handlers in `src/app/api`, server code in `src/server`.

- **Framework**: Next.js, React, TailwindCSS
- **Database**: PostgreSQL (`pg`); local container via `docker-compose.yml`
- **Authentication**: better-auth (email + password, session cookie)
- **Email Notifications**: SendGrid (daily cron in `src/instrumentation.ts`)
- **Payments**: Stripe

## Getting Started

```bash
npm install
npm run db    # starts Postgres in Docker and waits until it is healthy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Tables are created on the first request. `.env.development` already points `DATABASE_URL` at the local container; stop it with `docker compose down` (add `-v` to wipe the data).

A database created before better-auth must be reset once, in this order (the schema is cached per server process, and old code recreates the old tables):

1. Deploy the new code.
2. Run the DROP (locally, in the container):

```bash
docker compose exec db psql -U subtrack -c 'DROP TABLE IF EXISTS users, subscriptions, notification_settings, payment_logs, rate_limits, "user", session, account, verification, "rateLimit" CASCADE'
```

   On Neon, run the same `DROP TABLE` once in the SQL editor. It deletes all data, which is acceptable only because there are no real users yet.
3. Trigger a Vercel Redeploy so warm functions drop their cached schema (locally: restart `npm run dev`).
4. Verify with `\d subscriptions` that the foreign key says `REFERENCES "user"(id)`.

Do not point a preview deployment of this branch at the shared Neon DB before the reset.

### Tests

`npm test` runs the API route handlers against a `subtrack_test` database in the same container (create it once: `docker compose exec db psql -U subtrack -c "CREATE DATABASE subtrack_test"`). Stripe network calls are stubbed; webhooks are signed with a test secret.

### Environment variables (`.env.local`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | yes | Signs session cookies (32+ random chars: `openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | yes | Exact origin users load (scheme + host, apex vs `www` matters), e.g. `http://localhost:3000`; any other origin gets 403 on sign-in/sign-up |
| `BETTER_AUTH_TRUSTED_ORIGINS` | no | Extra trusted origins, comma-separated with no spaces; `*` wildcards allowed (read by better-auth 1.7.7). For the Vercel Preview environment use a project-scoped pattern such as `https://<project>-*-<team>.vercel.app`; never a bare `*.vercel.app` |
| `DATABASE_URL` | yes | Postgres connection string (set in `.env.development` for local dev) |
| `FRONTEND_URL` | for payments/email | Public app URL used in Stripe redirects and email links |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_MONTHLY_PRICE_ID` (the €9,99/month price) | for payments | Without them the payment routes return 503 |
| `SENDGRID_API_KEY`, `EMAIL_FROM` | for email | Without them emails are only logged |
| `CRON_SECRET` | in production | Vercel sends it to `/api/cron/renewals`; without it the route returns 401 |
| `ADMIN_EMAILS` | no | Comma-separated emails treated as admins (`isAdmin` in `src/server/auth.ts`, `isAdmin` flag on `/api/users/profile`) |

## API Documentation

See [API.md](API.md).

## Deployment

Vercel (app) + Neon (Postgres). Import the repo in Vercel and set the env vars above; `DATABASE_URL` is Neon's **pooled** connection string (host contains `-pooler`). `vercel.json` schedules `/api/cron/renewals` daily, which sends the renewal emails.
