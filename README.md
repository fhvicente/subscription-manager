# SubTrack

A simple and effective tool to manage your subscriptions and save money.

## Technology Stack

One Next.js app: pages in `src/app`, the REST API as route handlers in `src/app/api`, server code in `src/server`.

- **Framework**: Next.js, React, TailwindCSS
- **Database**: PostgreSQL (`pg`); local container via `docker-compose.yml`
- **Authentication**: Custom JWT-based authentication
- **Email Notifications**: SendGrid (daily cron in `src/instrumentation.ts`)
- **Payments**: Stripe

## Getting Started

```bash
npm install
npm run db    # starts Postgres in Docker and waits until it is healthy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Tables are created on the first request. `.env.development` already points `DATABASE_URL` at the local container; stop it with `docker compose down` (add `-v` to wipe the data).

### Environment variables (`.env.local`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | yes | Sign auth tokens (e.g. `7d`) |
| `DATABASE_URL` | yes | Postgres connection string (set in `.env.development` for local dev) |
| `FRONTEND_URL` | for payments/email | Public app URL used in Stripe redirects and email links |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_MONTHLY_PRICE_ID` (the €9,99/month price) | for payments | Without them the payment routes return 503 |
| `SENDGRID_API_KEY`, `EMAIL_FROM` | for email | Without them emails are only logged |
| `CRON_SECRET` | in production | Vercel sends it to `/api/cron/renewals`; without it the route returns 401 |

## API Documentation

See [API.md](API.md).

## Deployment

Vercel (app) + Neon (Postgres). Import the repo in Vercel and set the env vars above; `DATABASE_URL` is Neon's **pooled** connection string (host contains `-pooler`). `vercel.json` schedules `/api/cron/renewals` daily, which sends the renewal emails.
