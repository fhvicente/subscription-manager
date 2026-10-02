import { get } from "@/server/db";
import { isPremiumActive } from "@/server/stripe";

// Public: called by the success page right after the Stripe redirect.
export async function GET(req: Request) {
    const sessionId = new URL(req.url).searchParams.get("session_id");
    if (!sessionId) return Response.json({ message: "Session ID is required" }, { status: 400 });

    const log = await get(`SELECT * FROM payment_logs WHERE "stripeSessionId" = ?`, [sessionId]);
    if (!log) return Response.json({ message: "Payment session not found" }, { status: 404 });

    const user = await get(`SELECT id, email, plan, "premiumUntil" FROM users WHERE id = ?`, [log.user_id]);
    if (!user) return Response.json({ message: "User not found" }, { status: 404 });

    const verified = log.status === "success";
    return Response.json({
        userId: user.id,
        email: user.email,
        plan: user.plan,
        premiumUntil: user.premiumUntil,
        isActive: isPremiumActive(user),
        verifiedSession: verified,
        ...(verified && { sessionId }),
    });
}
