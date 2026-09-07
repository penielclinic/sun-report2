import { redirect } from "next/navigation";
import { requirePage, dashboardPath } from "@/lib/auth/session";

export default async function DashboardPage() {
  const { profile } = await requirePage();
  redirect(dashboardPath(profile.role));
}
