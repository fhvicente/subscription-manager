import bcrypt from "bcrypt";
import { get } from "@/server/db";
import { signToken } from "@/server/auth";

export async function POST(req: Request) {
    const { email, password } = await req.json();
    if (!email || !password) {
        return Response.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await get("SELECT * FROM users WHERE email = ?", [email]);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const { password: _, ...userWithoutPassword } = user;
    return Response.json({ user: userWithoutPassword, token: signToken(user.id) });
}
