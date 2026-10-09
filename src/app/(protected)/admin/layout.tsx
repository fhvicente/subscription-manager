import { redirect } from "next/navigation";
import { currentUser, isAdmin } from "@/server/auth";

// Non-admins never see the panel; the /api/admin routes enforce the same check (403).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    if (!isAdmin(await currentUser())) redirect("/dashboard");
    return children;
}
