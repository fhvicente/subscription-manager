import { randomUUID } from "node:crypto";
import { run } from "@/server/db";
import { getUser, unauthorized } from "@/server/auth";
import { stripe } from "@/server/stripe";

export async function POST(req: Request) {
    const user = await getUser(req);
    if (!user) return unauthorized();

    if (stripe && user.stripeCustomerId) {
        try {
            const subs = await stripe.subscriptions.list({
                customer: user.stripeCustomerId,
                status: "active",
            });
            for (const sub of subs.data) await stripe.subscriptions.cancel(sub.id);
        } catch (error) {
            // Same as before: still downgrade locally if Stripe fails.
            console.error("Error canceling Stripe subscription:", error);
        }
    }

    await run("UPDATE users SET plan = 'free' WHERE id = ?", [user.id]);
    await run("INSERT INTO payment_logs (id, user_id, amount, status, notes) VALUES (?, ?, ?, ?, ?)", [
        randomUUID(),
        user.id,
        0,
        "canceled",
        "Subscription canceled by user",
    ]);
    return Response.json({ success: true, message: "Subscription has been canceled successfully." });
}
