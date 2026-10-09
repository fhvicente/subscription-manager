import { get } from "@/server/db";
import { getUser, unauthorized } from "@/server/auth";
import { isPremiumActive } from "@/server/stripe";

// Called by the success page right after the Stripe redirect; only the session's owner can read it.
export async function GET(req: Request) {
    const user = await getUser(req);
    if (!user) return unauthorized();
    const sessionId = new URL(req.url).searchParams.get("session_id");
    if (!sessionId) return Response.json({ message: "Session ID is required" }, { status: 400 });

    const log = await get(`SELECT status FROM payment_logs WHERE "stripeSessionId" = ? AND user_id = ?`, [
        sessionId,
        user.id,
    ]);
    if (!log) return Response.json({ message: "Payment session not found" }, { status: 404 });

    const verified = log.status === "success";
    return Response.json({
        plan: user.plan,
        premiumUntil: user.premiumUntil,
        isActive: isPremiumActive(user),
        verifiedSession: verified,
        ...(verified && { sessionId }),
    });
}
