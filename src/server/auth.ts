import jwt, { type SignOptions } from "jsonwebtoken";
import { get } from "./db";

export const signToken = (id: string) =>
    jwt.sign({ id }, process.env.JWT_SECRET!, {
        expiresIn: process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    });

// Returns the user behind the Bearer token, or null if missing/invalid.
export async function getUser(req: Request) {
    const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
    if (!token) return null;
    try {
        const { id } = jwt.verify(token, process.env.JWT_SECRET!) as { id?: string };
        return id ? (await get("SELECT * FROM users WHERE id = ?", [id]) ?? null) : null;
    } catch {
        return null;
    }
}

export const unauthorized = () =>
    Response.json({ error: "Invalid or expired token" }, { status: 401 });
