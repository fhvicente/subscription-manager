import { run } from "@/server/db";
import { getUser, unauthorized } from "@/server/auth";
import { paymentsDisabled, stripe } from "@/server/stripe";

export async function POST(req: Request) {
    const user = await getUser(req);
    if (!user) return unauthorized();
    if (!stripe) return paymentsDisabled();

    const { plan } = await req.json();
    if (!["monthly", "yearly"].includes(plan)) {
        return Response.json({ message: "Invalid plan type" }, { status: 400 });
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
        const customer = await stripe.customers.create({
            email: user.email,
            name: user.name || undefined,
            metadata: { userId: user.id },
        });
        customerId = customer.id;
        await run(`UPDATE users SET "stripeCustomerId" = ? WHERE id = ?`, [customerId, user.id]);
    }

    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
            {
                price:
                    plan === "yearly"
                        ? process.env.STRIPE_YEARLY_PRICE_ID
                        : process.env.STRIPE_MONTHLY_PRICE_ID,
                quantity: 1,
            },
        ],
        mode: "subscription",
        success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
        metadata: { userId: user.id, plan },
    });
    return Response.json({ sessionId: session.id, url: session.url });
}
