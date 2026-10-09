import { get, query } from "@/server/db";
import { forbidden, getUser, isAdmin, unauthorized } from "@/server/auth";

const PREMIUM_ACTIVE = `plan = 'premium' AND "premiumUntil" > now()`;
const LAST_30 = `created_at > now() - interval '30 days'`;

// KPIs + the user list for the admin panel. `?q=` filters users by email or name.
export async function GET(req: Request) {
    const user = await getUser(req);
    if (!user) return unauthorized();
    if (!isAdmin(user)) return forbidden();

    const params = new URL(req.url).searchParams;
    const q = `%${params.get("q")?.trim() ?? ""}%`;
    // Unknown values fall back to all payments.
    const status = ["success", "failed"].includes(params.get("status") ?? "") ? params.get("status") : null;
    const [users, subs, payments, categories, list, recentPayments] = await Promise.all([
        get(`SELECT count(*)::int AS total,
                    count(*) FILTER (WHERE "createdAt" > now() - interval '30 days')::int AS new30,
                    count(*) FILTER (WHERE ${PREMIUM_ACTIVE})::int AS premium
             FROM "user"`),
        get(`SELECT count(*)::int AS total,
                    count(DISTINCT user_id)::int AS users,
                    coalesce(sum(price) FILTER (WHERE status = 'active'), 0)::float AS "activeValue"
             FROM subscriptions`),
        get(`SELECT coalesce(sum(amount) FILTER (WHERE status = 'success' AND ${LAST_30}), 0)::float AS revenue30,
                    coalesce(sum(amount) FILTER (WHERE status = 'success'), 0)::float AS "revenueTotal",
                    count(*) FILTER (WHERE status = 'failed' AND ${LAST_30})::int AS failed30
             FROM payment_logs`),
        query(`SELECT coalesce(nullif(category, ''), 'Other') AS name, count(*)::int AS count
               FROM subscriptions GROUP BY 1 ORDER BY 2 DESC LIMIT 5`),
        // ponytail: capped at 100 rows, add pagination when the search box stops being enough.
        query(`SELECT u.id, u.email, u.name, u.plan, u."premiumUntil", u."createdAt" AS created_at,
                      (SELECT count(*)::int FROM subscriptions s WHERE s.user_id = u.id) AS subscriptions
               FROM "user" u WHERE u.email ILIKE ? OR u.name ILIKE ?
               ORDER BY u."createdAt" DESC LIMIT 100`, [q, q]),
        query(`SELECT p.id, p.amount, p.status, p.plan, p.created_at, u.email
               FROM payment_logs p JOIN "user" u ON u.id = p.user_id
               WHERE ?::text IS NULL OR p.status = ?
               ORDER BY p.created_at DESC LIMIT 50`, [status, status]),
    ]);

    return Response.json({
        kpis: {
            users: users!.total,
            newUsers30: users!.new30,
            premiumUsers: users!.premium,
            conversion: users!.total ? users!.premium / users!.total : 0,
            revenue30: payments!.revenue30,
            revenueTotal: payments!.revenueTotal,
            failedPayments30: payments!.failed30,
            subscriptions: subs!.total,
            activationRate: users!.total ? subs!.users / users!.total : 0,
            trackedMonthlyValue: subs!.activeValue,
        },
        categories,
        users: list,
        recentPayments,
    });
}
