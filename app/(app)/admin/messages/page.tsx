import type { Metadata } from "next";
import { Send } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui/misc";
import { MessageComposer, type Recipient } from "./message-composer";

export const metadata: Metadata = { title: "메시지 보내기" };

export default async function MessagesPage() {
  const { profile } = await requirePage(["pastor"]);
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("id, name, role, sun_number, mission_id, phone").in("role", ["sun_leader", "mission_leader"]).eq("status", "active").order("role").order("mission_id").order("sun_number");

  return (
    <div className="space-y-5">
      <PageHeader title="메시지 보내기" subtitle="순장·선교회장에게 앱 알림으로 공지를 보내요" icon={<Send className="h-7 w-7" />} />
      <MessageComposer recipients={(data ?? []) as Recipient[]} senderName={profile.name} />
    </div>
  );
}
