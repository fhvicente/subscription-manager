import bcrypt from "bcrypt";
import { get, rateLimited } from "@/server/db";
import { clientIp, tooManyRequests, withSession } from "@/server/auth";

const WINDOW = 15 * 60;

export async function POST(req: Request) {
    const { email, password } = await req.json().catch(() => ({}));
    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
        return Response.json({ error: "Email and password are required" }, { status: 400 });
    }
    // Per IP against brute force from one host, per email against credential stuffing from many.
    if (
        (await rateLimited(`login:ip:${clientIp(req)}`, 20, WINDOW)) ||
        (await rateLimited(`login:email:${email.toLowerCase()}`, 10, WINDOW))
    ) {
        return tooManyRequests();
    }

    const user = await get("SELECT * FROM users WHERE email = ?", [email]);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const { password: _, ...userWithoutPassword } = user;
    return withSession({ user: userWithoutPassword }, user.id);
}
