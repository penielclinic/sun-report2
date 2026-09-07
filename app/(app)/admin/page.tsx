import type { Metadata } from "next";
import { Menu } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui/misc";
import { AdminTiles } from "@/components/admin/admin-tiles";

export const metadata: Metadata = { title: "관리 메뉴" };

export default async function AdminHubPage() {
  await requirePage(["pastor"]);
  const admin = createAdminClient();
  const [{ count: pending }, { count: alerts }] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("pastoral_alerts").select("id", { count: "exact", head: true }).eq("is_read", false),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader title="관리 메뉴" subtitle="담임목사 전용 기능" icon={<Menu className="h-7 w-7" />} />
      <AdminTiles badges={{ "/admin/users": pending ?? 0, "/admin/alerts": alerts ?? 0 }} />
    </div>
  );
}
