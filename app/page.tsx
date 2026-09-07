import { redirect } from "next/navigation";
import { getSession, dashboardPath } from "@/lib/auth/session";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.profile.status === "pending") redirect("/pending");
  if (session.profile.status === "rejected") redirect("/login?error=rejected");
  redirect(dashboardPath(session.profile.role));
}
