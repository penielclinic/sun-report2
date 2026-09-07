import type { Metadata } from "next";
import Link from "next/link";
import { LayoutGrid, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, StatTile } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SundayPicker } from "@/components/reports/sunday-picker";
import { PrintButton } from "@/components/reports/print-button";
import { DeleteReportButton } from "@/components/reports/delete-report-button";
import { formatKoreanDate, resolveReportSunday } from "@/lib/dates";
import { SUN_DIRECTORY, MISSION_IDS, SUN_COUNT, getMissionName, getSunsByMission } from "@/lib/constants/sun-directory";
import { ATTEND_COLS, type AttendKey } from "@/types/database";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "전체 보고 현황" };

type MRow = Record<AttendKey, boolean> & { report_id: string };

const HEAD_TONE: Record<AttendKey, string> = {
  attend_samil: "text-indigo-700",
  attend_friday: "text-violet-700",
  attend_sun_day: "text-amber-700",
  attend_sun_eve: "text-rose-700",
  attend_sun: "text-emerald-700",
  evangelism: "text-orange-700",
};

export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  await requirePage(["pastor"]);
  const { date } = await searchParams;
  const selected = resolveReportSunday(date);
  const supabase = await createClient();

  const { data: sunReports } = await supabase.from("sun_reports").select("id, sun_number, mission_id, status, attend_total, bible_chapters").eq("report_date", selected);
  const suns = sunReports ?? [];
  const ids = suns.map((r) => r.id);
  let members: MRow[] = [];
  if (ids.length) {
    const { data } = await supabase.from("sun_report_members").select("report_id, attend_samil, attend_friday, attend_sun_day, attend_sun_eve, attend_sun, evangelism").in("report_id", ids);
    members = (data ?? []) as MRow[];
  }

  const reportMap = new Map(suns.map((r) => [r.sun_number, r]));
  const idToSun = new Map(suns.map((r) => [r.id, r.sun_number]));
  const perSun = new Map<number, Record<AttendKey, number>>();
  const total = Object.fromEntries(ATTEND_COLS.map((c) => [c.key, 0])) as Record<AttendKey, number>;
  for (const m of members) {
    const sn = idToSun.get(m.report_id);
    if (!sn) continue;
    const e = perSun.get(sn) ?? (Object.fromEntries(ATTEND_COLS.map((c) => [c.key, 0])) as Record<AttendKey, number>);
    for (const c of ATTEND_COLS) if (m[c.key]) { e[c.key]++; total[c.key]++; }
    perSun.set(sn, e);
  }
  const submittedCount = suns.filter((r) => r.status === "submitted").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="전체 보고 현황"
        subtitle={`${formatKoreanDate(selected)} 주일 · ${submittedCount}/${SUN_COUNT}순 제출`}
        icon={<LayoutGrid className="h-7 w-7" />}
        action={
          <>
            <PrintButton />
            {suns.length > 0 && (
              <DeleteReportButton apiUrl="/api/admin/reports" body={{ date: selected }} title="이 주일의 모든 보고서를 삭제할까요?" description={`${selected} 순보고서 ${suns.length}건과 선교회보고서가 모두 삭제돼요. 되돌릴 수 없어요.`} label="이 주 전체 삭제" />
            )}
          </>
        }
      />
      <SundayPicker value={selected} basePath="/admin/overview" className="no-print" />

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 rise-in rise-in-2">
        {ATTEND_COLS.map((c) => (
          <StatTile key={c.key} label={c.label} value={total[c.key]} unit="명" tone={c.color as never} className="px-3 py-3" />
        ))}
      </div>

      <Card className="rise-in rise-in-2">
        <CardHeader>
          <CardTitle>선교회별 제출률</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {MISSION_IDS.map((mId) => {
              const mySuns = getSunsByMission(mId);
              const sub = mySuns.filter((s) => reportMap.get(s.sunNumber)?.status === "submitted").length;
              const attend = mySuns.reduce((s, e) => s + (reportMap.get(e.sunNumber)?.status === "submitted" ? reportMap.get(e.sunNumber)!.attend_total : 0), 0);
              const pct = Math.round((sub / mySuns.length) * 100);
              return (
                <div key={mId} className={cn("rounded-2xl border p-3", pct === 100 ? "bg-emerald-50 border-emerald-200" : pct >= 50 ? "bg-amber-50 border-amber-200" : "bg-slate-50")}>
                  <p className="text-[0.95rem] font-black text-ink-soft">{getMissionName(mId)}</p>
                  <p className="text-2xl font-black tabular-nums">
                    {sub}
                    <span className="text-base font-bold text-ink-soft">/{mySuns.length}</span>
                  </p>
                  <p className="text-sm text-ink-soft">주일낮 {attend}명</p>
                  <div className="mt-1.5 h-2 rounded-full bg-black/10 overflow-hidden">
                    <div className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="rise-in rise-in-3">
        <CardHeader>
          <CardTitle>순별 제출 현황</CardTitle>
          <CardDescription>순 번호를 누르면 보고서로 이동해요</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead>
                <tr className="bg-slate-50 border-y text-[0.95rem]">
                  <th className="px-3 py-3 text-left font-bold whitespace-nowrap">순</th>
                  <th className="px-2 py-3 text-left font-bold whitespace-nowrap">순장</th>
                  <th className="px-2 py-3 text-left font-bold whitespace-nowrap">선교회</th>
                  {ATTEND_COLS.map((c) => (
                    <th key={c.key} className={cn("px-2 py-3 text-center font-bold whitespace-nowrap", HEAD_TONE[c.key])}>
                      {c.short}
                    </th>
                  ))}
                  <th className="px-2 py-3 text-center font-bold whitespace-nowrap">성경</th>
                  <th className="px-2 py-3 text-center font-bold whitespace-nowrap">상태</th>
                </tr>
              </thead>
              <tbody>
                {SUN_DIRECTORY.map((e, i) => {
                  const r = reportMap.get(e.sunNumber);
                  const s = perSun.get(e.sunNumber);
                  const has = r?.status === "submitted" && s;
                  return (
                    <tr key={e.sunNumber} className={cn("border-b last:border-0", i % 2 ? "bg-slate-50/40" : "", r?.status !== "submitted" && "text-slate-400")}>
                      <td className="px-3 py-2.5 font-bold whitespace-nowrap">
                        {r ? (
                          <Link href={`/report/sun/${r.id}`} className="text-brand-700 underline underline-offset-4">
                            {e.sunNumber}순
                          </Link>
                        ) : (
                          `${e.sunNumber}순`
                        )}
                      </td>
                      <td className="px-2 py-2.5 whitespace-nowrap">{e.sunLeader}</td>
                      <td className="px-2 py-2.5 whitespace-nowrap text-ink-soft">{getMissionName(e.missionId)}</td>
                      {ATTEND_COLS.map((c) => (
                        <td key={c.key} className="px-2 py-2.5 text-center font-bold tabular-nums">
                          {has ? s[c.key] : "−"}
                        </td>
                      ))}
                      <td className="px-2 py-2.5 text-center font-bold tabular-nums">{has ? r.bible_chapters : "−"}</td>
                      <td className="px-2 py-2.5 text-center">
                        {r?.status === "submitted" ? <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-500" /> : r?.status === "draft" ? <Clock3 className="mx-auto h-6 w-6 text-amber-500" /> : <XCircle className="mx-auto h-6 w-6 text-slate-300" />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-brand-50 font-black border-t-2 border-brand-200">
                  <td className="px-3 py-3" colSpan={3}>
                    합계 ({submittedCount}순 제출)
                  </td>
                  {ATTEND_COLS.map((c) => (
                    <td key={c.key} className="px-2 py-3 text-center tabular-nums">
                      {total[c.key]}
                    </td>
                  ))}
                  <td className="px-2 py-3 text-center tabular-nums">{suns.filter((r) => r.status === "submitted").reduce((s, r) => s + r.bible_chapters, 0)}</td>
                  <td className="px-2 py-3 text-center text-ink-soft text-sm">
                    {submittedCount}/{SUN_COUNT}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
