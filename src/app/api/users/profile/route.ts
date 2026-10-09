import { z } from "zod";
import { get, run } from "@/server/db";
import { getUser, unauthorized } from "@/server/auth";
import { parseBody } from "@/server/validate";

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
    const body = await parseBody(req, z.object({ name: z.string().trim().min(1).max(100) }));
    if (body instanceof Response) return body;
    await run("UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [body.name, user.id]);
    return Response.json(await profile(user.id));
}
