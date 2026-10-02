import { getUser, unauthorized } from "@/server/auth";
import { isPremiumActive } from "@/server/stripe";

export async function GET(req: Request) {
    const user = await getUser(req);
    if (!user) return unauthorized();
    return Response.json({
        plan: user.plan,
        premiumUntil: user.premiumUntil,
        isActive: isPremiumActive(user),
    });
}
