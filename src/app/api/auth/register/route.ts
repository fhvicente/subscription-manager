import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { get, run } from "@/server/db";
import { signToken } from "@/server/auth";

export async function POST(req: Request) {
    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
        return Response.json({ error: "All fields are required" }, { status: 400 });
    }
    if (await get("SELECT id FROM users WHERE email = ?", [email])) {
        return Response.json({ error: "User with this email already exists" }, { status: 400 });
    }

    const id = randomUUID();
    await run("INSERT INTO users (id, email, name, password, plan) VALUES (?, ?, ?, ?, ?)", [
        id,
        email,
        name,
        await bcrypt.hash(password, 10),
        "free",
    ]);
    const user = await get(
        "SELECT id, email, name, plan, created_at, updated_at FROM users WHERE id = ?",
        [id]
    );
    return Response.json({ user, token: signToken(id) }, { status: 201 });
}
