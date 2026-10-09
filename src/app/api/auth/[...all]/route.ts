import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/server/better-auth";
import { ensureSchema } from "@/server/db";

const handler = toNextJsHandler(auth);

// The first request after a deploy may be a sign-up, before any of our own queries created the tables.
export const GET = async (req: Request) => (await ensureSchema(), handler.GET(req));
export const POST = async (req: Request) => (await ensureSchema(), handler.POST(req));
