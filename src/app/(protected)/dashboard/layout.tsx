import { redirect } from "next/navigation";
import { currentUser, isAdmin } from "@/server/auth";

// Admins land here after login (and via the proxy); their home is the admin panel.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    if (isAdmin(await currentUser())) redirect("/admin");
    return children;
}
