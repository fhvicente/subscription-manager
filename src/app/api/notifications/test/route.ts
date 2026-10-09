import { getUser, tooManyRequests, unauthorized } from "@/server/auth";
import { rateLimited } from "@/server/db";
import { sendTestEmail } from "@/server/email";

export async function POST(req: Request) {
    const user = await getUser(req);
    if (!user) return unauthorized();
    const { type } = await req.json().catch(() => ({}));
    if (!["email", "sms", "push"].includes(type)) {
        return Response.json({ message: "Invalid notification type" }, { status: 400 });
    }

    // ponytail: only email is real; sms/push are simulated until a provider exists.
    if (type !== "email") {
        return Response.json({ success: true, message: `Test ${type} notification simulated successfully` });
    }
    // Real emails cost sender reputation; a few per hour is plenty for checking the setup.
    if (await rateLimited(`test-email:${user.id}`, 3, 60 * 60)) return tooManyRequests();
    return (await sendTestEmail(user))
        ? Response.json({ success: true, message: "Test email notification sent successfully" })
        : Response.json({ success: false, message: "Failed to send test email notification" }, { status: 500 });
}
