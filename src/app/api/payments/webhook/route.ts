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
            if (!userId) break;

            const premiumUntil = new Date(Date.now() + 30 * DAY);
            await run(`UPDATE users SET plan = ?, "premiumUntil" = ? WHERE id = ?`, [
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
        case "invoice.payment_failed": {
            const invoice = event.data.object;
            const user = await get(`SELECT id FROM users WHERE "stripeCustomerId" = ?`, [String(invoice.customer)]);
            if (user) {
                await run(
                    `INSERT INTO payment_logs (id, user_id, amount, status, "stripeSessionId") VALUES (?, ?, ?, ?, ?)`,
                    [randomUUID(), user.id, (invoice.amount_due ?? 0) / 100, "failed", invoice.id]
                );
            }
            break;
        }
        case "customer.subscription.deleted": {
            await run(`UPDATE users SET plan = 'free', "premiumUntil" = NULL WHERE "stripeCustomerId" = ?`, [
                String(event.data.object.customer),
            ]);
            break;
        }
    }
    return Response.json({ received: true });
}
