import type { Metadata } from "next";
import Link from "next/link";
import { History, ChevronRight, FileQuestion } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatKoreanDate } from "@/lib/dates";
import { getMissionName } from "@/lib/constants/sun-directory";

export const metadata: Metadata = { title: "지난 선교회보고서" };

export default async function MissionHistoryPage() {
  const { profile } = await requirePage(["mission_leader"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("mission_reports")
    .select("id, report_date, status, total_sun, total_attend, total_offering")
    .eq("mission_id", profile.mission_id ?? -1)
    .order("report_date", { ascending: false })
    .limit(120);
  const list = data ?? [];

  return (
    <div className="space-y-5">
      <PageHeader title="지난 선교회보고서" subtitle={`${getMissionName(profile.mission_id ?? 0)} · 총 ${list.length}건`} icon={<History className="h-7 w-7" />} />
      <Card className="rise-in rise-in-2">
        <CardContent className="p-0">
          {list.length === 0 ? (
            <EmptyState icon={<FileQuestion className="h-8 w-8" />} title="아직 작성한 보고서가 없어요" />
          ) : (
            <ul className="divide-y">
              {list.map((r) => (
                <li key={r.id}>
                  <Link href={`/report/mission/${r.id}`} className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6 hover:bg-brand-50/60">
                    <div>
                      <p className="text-lg font-bold">{formatKoreanDate(r.report_date)} 주일</p>
                      <p className="text-base text-ink-soft">
                        순 {r.total_sun}개 · 주일낮 {r.total_attend}명 · 헌금 {(r.total_offering ?? 0).toLocaleString()}원
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={r.status} />
                      <ChevronRight className="h-6 w-6 text-slate-400" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
