import { checkUpcomingRenewals } from "@/server/email";

// Called daily by Vercel Cron (vercel.json), which sends `Authorization: Bearer $CRON_SECRET`.
export async function GET(req: Request) {
    if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
        return Response.json({ message: "Unauthorized" }, { status: 401 });
    }
    return Response.json({ sent: await checkUpcomingRenewals() });
}
