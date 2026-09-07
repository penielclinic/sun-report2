import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { NotificationList } from "./notification-list";
import type { Notification } from "@/types/database";

export const metadata: Metadata = { title: "알림" };

export default async function NotificationsPage() {
  const { userId } = await requirePage();
  const supabase = await createClient();
  const { data } = await supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(200);

  return (
    <div className="space-y-5">
      <PageHeader title="알림 · 메시지" subtitle="목사님 메시지, 보고서 도착, 답글 알림이 모여요" icon={<Bell className="h-7 w-7" />} />
      <NotificationList initial={(data ?? []) as Notification[]} />
    </div>
  );
}
