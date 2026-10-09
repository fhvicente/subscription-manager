import bcrypt from "bcrypt";
import { get, rateLimited } from "@/server/db";
import { clientIp, isAdmin, tooManyRequests, withSession } from "@/server/auth";

const WINDOW = 15 * 60;

// Hash of a random string nobody knows, same cost (10) as the hashes created at sign-up.
const DUMMY_HASH = "$2b$10$SacTxOvjTiFXYFo75XExreOMpEKXhm2Kw7/1HRHkRHnf/9kweFEP2";

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
    // Always run one bcrypt compare, so the response time doesn't reveal whether the email has an account.
    const valid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
    if (!user || !valid) {
        return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const { password: _, ...userWithoutPassword } = user;
    return withSession({ user: { ...userWithoutPassword, isAdmin: isAdmin(user) } }, user.id);
}
