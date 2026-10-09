import { getUser, isAdmin, unauthorized } from "@/server/auth";

export async function GET(req: Request) {
    const user = await getUser(req);
    if (!user) return unauthorized();
    const { id, email, name, plan, created_at, updated_at } = user;
    return Response.json({ id, email, name, plan, created_at, updated_at, isAdmin: isAdmin(user) });
}
