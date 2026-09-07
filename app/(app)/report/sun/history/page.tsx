import type { Metadata } from "next";
import Link from "next/link";
import { History, ChevronRight, FileQuestion } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatKoreanDate } from "@/lib/dates";

export const metadata: Metadata = { title: "지난 순보고서" };

export default async function SunHistoryPage() {
  const { profile } = await requirePage(["sun_leader"]);
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("sun_reports")
    .select("id, report_date, status, attend_total, bible_chapters, offering")
    .eq("sun_number", profile.sun_number ?? -1)
    .order("report_date", { ascending: false })
    .limit(120);

  const list = reports ?? [];

  return (
    <div className="space-y-5">
      <PageHeader title="지난 순보고서" subtitle={`${profile.sun_number}순 · 총 ${list.length}건`} icon={<History className="h-7 w-7" />} />
      <Card className="rise-in rise-in-2">
        <CardContent className="p-0">
          {list.length === 0 ? (
            <EmptyState icon={<FileQuestion className="h-8 w-8" />} title="아직 작성한 보고서가 없어요" action={<Button href="/report/sun/new">첫 보고서 작성하기</Button>} />
          ) : (
            <ul className="divide-y">
              {list.map((r) => (
                <li key={r.id}>
                  <Link href={`/report/sun/${r.id}`} className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6 hover:bg-brand-50/60">
                    <div className="min-w-0">
                      <p className="text-lg font-bold">{formatKoreanDate(r.report_date)} 주일</p>
                      <p className="text-base text-ink-soft">
                        주일낮 {r.attend_total}명 · 성경 {r.bible_chapters}장 · 헌금 {(r.offering ?? 0).toLocaleString()}원
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
