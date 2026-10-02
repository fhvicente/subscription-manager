import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

// null when Stripe isn't configured (local dev); payment routes answer 503.
export const stripe = key?.startsWith("sk_") ? new Stripe(key) : null;

export const paymentsDisabled = () =>
    Response.json({ message: "Payments are not configured" }, { status: 503 });

export const isPremiumActive = (user: { plan?: string; premiumUntil?: string | null }) =>
    user.plan === "premium" && !!user.premiumUntil && new Date(user.premiumUntil) > new Date();
