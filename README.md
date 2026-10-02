# SubTrack

A simple and effective tool to manage your subscriptions and save money.

## Technology Stack

One Next.js app: pages in `src/app`, the REST API as route handlers in `src/app/api`, server code in `src/server`.

- **Framework**: Next.js, React, TailwindCSS
- **Database**: SQLite via Node's built-in `node:sqlite` (Node 22.13+)
- **Authentication**: Custom JWT-based authentication
- **Email Notifications**: SendGrid (daily cron in `src/instrumentation.ts`)
- **Payments**: Stripe

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The database is created on first request at `data/database.sqlite`, or up front with `npm run init-db`.

### Environment variables (`.env.local`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | yes | Sign auth tokens (e.g. `7d`) |
| `DATABASE_PATH` | no | Defaults to `data/database.sqlite` |
| `FRONTEND_URL` | for payments/email | Public app URL used in Stripe redirects and email links |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_MONTHLY_PRICE_ID`, `STRIPE_YEARLY_PRICE_ID` | for payments | Without them the payment routes return 503 |
| `SENDGRID_API_KEY`, `EMAIL_FROM` | for email | Without them emails are only logged |

## API Documentation

See [API.md](API.md).

## Deployment

`fly deploy` from the repo root. The single `Dockerfile` builds the Next.js standalone server; the Fly volume is mounted at `/app/data`.
