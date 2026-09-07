import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

export interface NotifyInput {
  userIds: string[];
  kind: "info" | "report" | "comment" | "message" | "reminder";
  title: string;
  body: string;
  link?: string | null;
}

/** 여러 사용자에게 앱 내 알림 생성 (실패해도 본 작업을 막지 않음) */
export async function notify(admin: Admin, input: NotifyInput): Promise<void> {
  const ids = [...new Set(input.userIds.filter(Boolean))];
  if (ids.length === 0) return;
  const { error } = await admin.from("notifications").insert(
    ids.map((user_id) => ({
      user_id,
      kind: input.kind,
      title: input.title.slice(0, 120),
      body: input.body.slice(0, 500),
      link: input.link ?? null,
    }))
  );
  if (error) console.error("[notify] insert failed:", error.message);
}

export async function pastorIds(admin: Admin): Promise<string[]> {
  const { data } = await admin.from("profiles").select("id").eq("role", "pastor").eq("status", "active");
  return (data ?? []).map((p) => p.id as string);
}

export async function missionLeaderIds(admin: Admin, missionId: number): Promise<string[]> {
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "mission_leader")
    .eq("status", "active")
    .eq("mission_id", missionId);
  return (data ?? []).map((p) => p.id as string);
}
