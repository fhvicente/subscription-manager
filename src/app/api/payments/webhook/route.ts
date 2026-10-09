import { randomUUID } from "node:crypto";
import type Stripe from "stripe";
import { get, run } from "@/server/db";
import { paymentsDisabled, stripe } from "@/server/stripe";

const DAY = 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !secret) return paymentsDisabled();

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(
            await req.text(),
            req.headers.get("stripe-signature") ?? "",
            secret
        );
    } catch (err) {
        return Response.json({ message: `Webhook Error: ${(err as Error).message}` }, { status: 400 });
    }

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object;
            const userId = session.metadata?.userId;
            const plan = session.metadata?.plan;
            if (!userId || session.payment_status !== "paid") break;

            const premiumUntil = new Date(Date.now() + 30 * DAY);
            await run(`UPDATE "user" SET plan = ?, "premiumUntil" = ? WHERE id = ?`, [
                "premium",
                premiumUntil.toISOString(),
                userId,
            ]);
            await run(
                `INSERT INTO payment_logs (id, user_id, amount, status, "stripeSessionId", plan) VALUES (?, ?, ?, ?, ?, ?)`,
                [randomUUID(), userId, (session.amount_total ?? 0) / 100, "success", session.id, plan]
            );
            break;
        }
        // Every paid invoice, renewals included, extends premium to the end of the billed period.
        case "invoice.paid": {
            const invoice = event.data.object;
            const periodEnd = invoice.lines.data[0]?.period.end;
            if (periodEnd) {
                await run(`UPDATE "user" SET plan = 'premium', "premiumUntil" = ? WHERE "stripeCustomerId" = ?`, [
                    new Date(periodEnd * 1000).toISOString(),
                    String(invoice.customer),
                ]);
            }
            break;
        }
        case "invoice.payment_failed": {
            const invoice = event.data.object;
            const user = await get(`SELECT id FROM "user" WHERE "stripeCustomerId" = ?`, [String(invoice.customer)]);
            if (user) {
                await run(
                    `INSERT INTO payment_logs (id, user_id, amount, status, "stripeSessionId") VALUES (?, ?, ?, ?, ?)`,
                    [randomUUID(), user.id, (invoice.amount_due ?? 0) / 100, "failed", invoice.id]
                );
            }
            break;
        }
        case "customer.subscription.deleted": {
            await run(`UPDATE "user" SET plan = 'free', "premiumUntil" = NULL WHERE "stripeCustomerId" = ?`, [
                String(event.data.object.customer),
            ]);
            break;
        }
    }
    return Response.json({ received: true });
}
