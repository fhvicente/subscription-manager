import { query } from "@/server/db";
import { getUser, unauthorized } from "@/server/auth";

export async function GET(req: Request) {
    const user = await getUser(req);
    if (!user) return unauthorized();
    return Response.json(
        await query("SELECT * FROM payment_logs WHERE user_id = ? ORDER BY created_at DESC", [user.id])
    );
}
