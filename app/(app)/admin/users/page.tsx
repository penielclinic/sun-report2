import type { Metadata } from "next";
import { Users } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui/misc";
import { UsersManager } from "./users-manager";
import type { Profile } from "@/types/database";

export const metadata: Metadata = { title: "사용자 관리" };

export default async function UsersPage() {
  const { userId } = await requirePage(["pastor"]);
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("*").order("status").order("role").order("sun_number").order("mission_id");
  const users = (data ?? []) as Profile[];
  const pending = users.filter((u) => u.status === "pending").length;

  return (
    <div className="space-y-5">
      <PageHeader title="사용자 관리" subtitle={pending > 0 ? `승인 대기 ${pending}명이 있어요` : `전체 ${users.length}명`} icon={<Users className="h-7 w-7" />} />
      <UsersManager users={users} currentUserId={userId} />
    </div>
  );
}
