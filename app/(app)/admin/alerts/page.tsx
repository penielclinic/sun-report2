import type { Metadata } from "next";
import Link from "next/link";
import { HeartHandshake, UserX, Siren } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState, SegmentTabs } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertsList } from "./alerts-list";
import { currentReportSunday, formatKoreanDate } from "@/lib/dates";
import { getMissionName } from "@/lib/constants/sun-directory";
import type { PastoralAlert } from "@/types/database";

export const metadata: Metadata = { title: "목양 알림" };

interface Absentee {
  member_name: string;
  sun_number: number;
  sun_leader: string;
  mission_id: number;
  weeks_reported: number;
  weeks_absent: number;
  last_attended: string | null;
}

export default async function AlertsPage({ searchParams }: { searchParams: Promise<{ weeks?: string }> }) {
  await requirePage(["pastor"]);
  const { weeks: w } = await searchParams;
  const weeks = [2, 4, 8].includes(Number(w)) ? Number(w) : 4;
  const supabase = await createClient();
  const sunday = currentReportSunday();

  const [{ data: alerts }, { data: absentees, error: absErr }] = await Promise.all([
    supabase.from("pastoral_alerts").select("*").order("is_read").order("created_at", { ascending: false }).limit(200),
    supabase.rpc("get_absentees", { min_weeks: weeks, reference_date: sunday }),
  ]);
  const abs = (absentees ?? []) as Absentee[];

  return (
    <div className="space-y-5">
      <PageHeader title="목양 알림" subtitle="특별보고의 긴급 소식과 장기 결석자를 자동으로 모아요" icon={<HeartHandshake className="h-7 w-7 text-rose-500" />} />

      <Card className="rise-in">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle icon={<Siren className="h-6 w-6 text-rose-500" />}>긴급 소식</CardTitle>
            <CardDescription>순보고·선교회보고 특별보고에 수술·입원·소천 등 단어가 있으면 자동으로 올라와요</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <AlertsList initial={(alerts ?? []) as PastoralAlert[]} />
        </CardContent>
      </Card>

      <Card className="rise-in rise-in-2">
        <CardHeader>
          <CardTitle icon={<UserX className="h-6 w-6 text-amber-600" />}>장기 결석자</CardTitle>
          <CardDescription>{formatKoreanDate(sunday)} 기준, 최근 {weeks}주 동안 제출된 보고서에서 주일예배·순모임에 한 번도 표시되지 않은 순원</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <SegmentTabs
            value={String(weeks)}
            options={[
              { value: "2", label: "2주 이상", href: "/admin/alerts?weeks=2" },
              { value: "4", label: "4주 이상", href: "/admin/alerts?weeks=4" },
              { value: "8", label: "8주 이상", href: "/admin/alerts?weeks=8" },
            ]}
          />
          {absErr ? (
            <p className="text-base text-rose-600">결석자 조회 함수(get_absentees)가 아직 설치되지 않았어요. supabase/migrations/0001_init.sql 을 실행해 주세요.</p>
          ) : abs.length === 0 ? (
            <EmptyState title="해당하는 결석자가 없어요" description="보고서가 쌓이면 자동으로 감지돼요." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border">
              <table className="w-full text-base">
                <thead>
                  <tr className="bg-slate-50 border-b text-[0.95rem]">
                    <th className="px-3 py-3 text-left font-bold">이름</th>
                    <th className="px-3 py-3 text-left font-bold whitespace-nowrap">소속</th>
                    <th className="px-3 py-3 text-center font-bold whitespace-nowrap">결석 주</th>
                    <th className="px-3 py-3 text-left font-bold whitespace-nowrap">마지막 출석</th>
                  </tr>
                </thead>
                <tbody>
                  {abs.map((a) => (
                    <tr key={`${a.sun_number}-${a.member_name}`} className="border-b last:border-0">
                      <td className="px-3 py-2.5 text-lg font-bold whitespace-nowrap">{a.member_name}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-ink-soft">
                        {getMissionName(a.mission_id)} · {a.sun_number}순 ({a.sun_leader})
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge tone={a.weeks_absent >= 8 ? "rose" : a.weeks_absent >= 4 ? "orange" : "amber"}>
                          {a.weeks_absent}주 / {a.weeks_reported}주
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{a.last_attended ? formatKoreanDate(a.last_attended) : "기록 없음"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-base text-ink-soft">
            심방 대상은 <Link href="/admin/special-reports" className="font-bold text-brand-700 underline underline-offset-4">특별보고 관리</Link>에서 진행상황을 기록할 수 있어요.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
