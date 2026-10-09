import { forbidden, getUser, isAdmin, logAdmin, unauthorized } from "@/server/auth";
import { checkUpcomingRenewals } from "@/server/email";

// Same job as the daily cron. Not deduplicated: users already reminded today get a second email.
export async function POST(req: Request) {
    const admin = await getUser(req);
    if (!admin) return unauthorized();
    if (!isAdmin(admin)) return forbidden();
    const sent = await checkUpcomingRenewals();
    logAdmin(admin, "run-renewals", `${sent} sent`);
    return Response.json({ sent });
}
