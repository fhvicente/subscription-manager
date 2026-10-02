import { get, run } from "@/server/db";
import { getUser, unauthorized } from "@/server/auth";

const profile = (id: string) =>
    get("SELECT id, email, name, plan, created_at, updated_at FROM users WHERE id = ?", [id]);

export async function GET(req: Request) {
    const user = await getUser(req);
    if (!user) return unauthorized();
    return Response.json(await profile(user.id));
}

export async function PUT(req: Request) {
    const user = await getUser(req);
    if (!user) return unauthorized();
    const { name } = await req.json();
    await run("UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [name, user.id]);
    return Response.json(await profile(user.id));
}
