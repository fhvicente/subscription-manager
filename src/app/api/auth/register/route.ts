import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { z } from "zod";
import { get, rateLimited, run } from "@/server/db";
import { clientIp, tooManyRequests, withSession } from "@/server/auth";

const registerSchema = z.object({
    name: z.string().trim().min(1).max(100),
    email: z.email().max(254),
    // bcrypt ignores everything past 72 bytes
    password: z.string().min(8).max(72),
});

export async function POST(req: Request) {
    const parsed = registerSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
        return Response.json(
            { error: "Enter your name, a valid email and a password of 8 to 72 characters" },
            { status: 400 }
        );
    }
    if (await rateLimited(`register:${clientIp(req)}`, 5, 60 * 60)) return tooManyRequests();

    const { name, email, password } = parsed.data;
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
    return withSession({ user }, id, 201);
}
