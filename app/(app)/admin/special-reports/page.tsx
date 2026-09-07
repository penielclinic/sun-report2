import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { SpecialItemsManager } from "./special-items-manager";
import type { SpecialReportItem } from "@/types/database";

export const metadata: Metadata = { title: "특별보고 관리" };

export default async function SpecialReportsPage() {
  await requirePage(["pastor"]);
  const supabase = await createClient();
  const { data } = await supabase.from("special_report_items").select("*").order("report_date", { ascending: false }).order("mission_id").limit(500);
  return (
    <div className="space-y-5">
      <PageHeader title="특별보고 관리" subtitle="선교회에서 올린 기도제목의 진행상황과 메모를 관리해요" icon={<ClipboardList className="h-7 w-7" />} />
      <SpecialItemsManager items={(data ?? []) as SpecialReportItem[]} />
    </div>
  );
}
