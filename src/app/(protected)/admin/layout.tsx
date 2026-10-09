import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isAdmin, userFromToken } from "@/server/auth";

// Non-admins never see the panel; the /api/admin routes enforce the same check (403).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const user = await userFromToken((await cookies()).get("token")?.value);
    if (!isAdmin(user)) redirect("/dashboard");
    return children;
}
