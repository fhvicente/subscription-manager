import { randomUUID } from "node:crypto";
import { get, query, run } from "@/server/db";
import { getUser, unauthorized } from "@/server/auth";
import { isPremiumActive } from "@/server/stripe";
import { z } from "zod";
import { FREE_PLAN_LIMIT, subscriptionCreateSchema } from "@/lib/subscription-schema";

export async function GET(req: Request) {
    const user = await getUser(req);
    if (!user) return unauthorized();
    return Response.json(
        await query("SELECT * FROM subscriptions WHERE user_id = ? ORDER BY due_date ASC", [user.id])
    );
}

export async function POST(req: Request) {
    const user = await getUser(req);
    if (!user) return unauthorized();
    const parsed = subscriptionCreateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
        return Response.json(
            { message: "Invalid subscription", errors: z.flattenError(parsed.error).fieldErrors },
            { status: 400 }
        );
    }

    // ponytail: count-then-insert can let two parallel requests reach 4; fine for a UI-driven limit.
    if (!isPremiumActive(user)) {
        const { count } = (await get("SELECT COUNT(*)::int AS count FROM subscriptions WHERE user_id = ?", [user.id]))!;
        if (count >= FREE_PLAN_LIMIT) {
            return Response.json(
                { code: "FREE_PLAN_LIMIT", message: `The free plan tracks up to ${FREE_PLAN_LIMIT} subscriptions` },
                { status: 403 }
            );
        }
    }

    const { name, description, price, dueDate, status, category } = parsed.data;
    const id = randomUUID();
    await run(
        "INSERT INTO subscriptions (id, user_id, name, description, price, due_date, status, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [id, user.id, name, description, price, dueDate, status, category]
    );
    return Response.json(await get("SELECT * FROM subscriptions WHERE id = ?", [id]), { status: 201 });
}
