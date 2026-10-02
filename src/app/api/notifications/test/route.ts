import { getUser, unauthorized } from "@/server/auth";
import { sendTestEmail } from "@/server/email";

export async function POST(req: Request) {
    const user = await getUser(req);
    if (!user) return unauthorized();
    const { type } = await req.json();
    if (!["email", "sms", "push"].includes(type)) {
        return Response.json({ message: "Invalid notification type" }, { status: 400 });
    }

    // ponytail: only email is real; sms/push are simulated until a provider exists.
    if (type !== "email") {
        return Response.json({ success: true, message: `Test ${type} notification simulated successfully` });
    }
    return (await sendTestEmail(user))
        ? Response.json({ success: true, message: "Test email notification sent successfully" })
        : Response.json({ success: false, message: "Failed to send test email notification" }, { status: 500 });
}
