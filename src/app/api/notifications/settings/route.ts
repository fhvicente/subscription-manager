import { randomUUID } from "node:crypto";
import { get, run } from "@/server/db";
import { getUser, unauthorized } from "@/server/auth";

const settingsOf = (userId: string) =>
    get("SELECT * FROM notification_settings WHERE user_id = ?", [userId]);

// Creates default settings on first access.
async function ensureSettings(userId: string) {
    await run("INSERT INTO notification_settings (id, user_id) VALUES (?, ?) ON CONFLICT (user_id) DO NOTHING", [
        randomUUID(),
        userId,
    ]);
    return (await settingsOf(userId))!;
}

export async function GET(req: Request) {
    const user = await getUser(req);
    if (!user) return unauthorized();
    return Response.json(await ensureSettings(user.id));
}

export async function PUT(req: Request) {
    const user = await getUser(req);
    if (!user) return unauthorized();
    const current = await ensureSettings(user.id);
    const body = await req.json();
    const pick = (key: string) => (body[key] !== undefined ? body[key] : current[key]);

    await run(
        `UPDATE notification_settings
         SET email_enabled = ?, sms_enabled = ?, push_enabled = ?, days_before_renewal = ?,
             phone_number = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [
            pick("email_enabled"),
            pick("sms_enabled"),
            pick("push_enabled"),
            pick("days_before_renewal"),
            pick("phone_number"),
            user.id,
        ]
    );
    return Response.json(await settingsOf(user.id));
}
