import { run } from "@/server/db";
import { checkUpcomingRenewals } from "@/server/email";

// Called daily by Vercel Cron (vercel.json), which sends `Authorization: Bearer $CRON_SECRET`.
export async function GET(req: Request) {
    if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
        return Response.json({ message: "Unauthorized" }, { status: 401 });
    }
    await run("DELETE FROM rate_limits WHERE reset_at < now()");
    return Response.json({ sent: await checkUpcomingRenewals() });
}
