import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isAdmin, userFromToken } from "@/server/auth";

// Admins land here after login (and via the proxy); their home is the admin panel.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const user = await userFromToken((await cookies()).get("token")?.value);
    if (isAdmin(user)) redirect("/admin");
    return children;
}
