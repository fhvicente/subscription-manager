import { clearSession } from "@/server/auth";

// The cookie is HttpOnly, so only the server can remove it.
export const POST = () => clearSession({ success: true });
