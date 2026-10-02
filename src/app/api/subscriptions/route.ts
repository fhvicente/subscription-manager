import { randomUUID } from "node:crypto";
import { get, query, run } from "@/server/db";
import { getUser, unauthorized } from "@/server/auth";

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
    const { name, description, price, dueDate, status = "active", category } = await req.json();
    if (!name || !price || !dueDate) {
        return Response.json({ message: "Name, price, and due date are required" }, { status: 400 });
    }

    const id = randomUUID();
    await run(
        "INSERT INTO subscriptions (id, user_id, name, description, price, due_date, status, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [id, user.id, name, description, price, dueDate, status, category]
    );
    return Response.json(await get("SELECT * FROM subscriptions WHERE id = ?", [id]), { status: 201 });
}
