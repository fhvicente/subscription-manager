// Runs once when the Next.js server starts.
export async function register() {
    if (process.env.NEXT_RUNTIME !== "nodejs") return;
    const cron = await import("node-cron");
    const { checkUpcomingRenewals } = await import("./server/email");
    // ponytail: in-process cron; misses runs while the Fly machine is stopped. Use a Fly scheduled machine if that matters.
    cron.schedule("0 0 * * *", checkUpcomingRenewals);
}
