"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, CheckCircle2, Circle, Users, BookOpenText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { StatTile } from "@/components/ui/misc";
import { ATTEND_COLS, type SunReportWithMembers, type SunEntryLike } from "@/types/database";
import { countAttendance } from "@/lib/report-utils";
import { cn, formatWon } from "@/lib/utils";

/**
 * 선교회장·담임목사가 보는 "소속 순보고서 모아보기"
 * - 자동 집계 타일 + 순별 펼침 상세 + 전체 순원 성경읽기
 */
export function MissionSummary({
  sunEntries,
  sunReports,
  aggregated,
  totalOffering,
}: {
  sunEntries: SunEntryLike[];
  sunReports: SunReportWithMembers[];
  aggregated: { total_sun: number; total_attend: number; total_bible: number; total_offering: number };
  totalOffering?: number;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const allMembers = sunReports.filter((r) => r.status === "submitted").flatMap((r) => r.sun_report_members);
  const counts = countAttendance(allMembers);
  const reportMap = new Map(sunReports.map((r) => [r.sun_number, r]));

  return (
    <>
      <Card className="rise-in">
        <CardHeader>
          <CardTitle icon={<Users className="h-6 w-6 text-brand-600" />}>순보고서 자동 집계</CardTitle>
          <CardDescription>제출된 순보고서를 합친 숫자예요. 순장님이 보고서를 고치면 자동으로 바뀌어요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile label="제출된 순" value={`${aggregated.total_sun}/${sunEntries.length}`} tone="brand" />
            <StatTile label="주일낮 참석" value={aggregated.total_attend} unit="명" tone="amber" />
            <StatTile label="성경 읽기" value={aggregated.total_bible} unit="장" tone="emerald" />
            <StatTile label="헌금" value={formatWon(totalOffering ?? aggregated.total_offering)} tone="sky" />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {ATTEND_COLS.map((c) => (
              <StatTile key={c.key} label={c.label} value={counts[c.key]} unit="명" tone={c.color as never} className="px-3 py-3" />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rise-in rise-in-2">
        <CardHeader>
          <CardTitle>순별 보고 상세</CardTitle>
          <CardDescription>순을 누르면 순원 출석표가 펼쳐져요.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {sunEntries.map((entry) => {
              const r = reportMap.get(entry.sunNumber);
              const isOpen = open === entry.sunNumber.toString();
              return (
                <li key={entry.sunNumber}>
                  <button
                    type="button"
                    disabled={!r}
                    onClick={() => setOpen(isOpen ? null : entry.sunNumber.toString())}
                    className={cn("w-full flex items-center justify-between gap-3 px-5 sm:px-6 py-3.5 text-left", r ? "hover:bg-brand-50/60" : "opacity-70")}
                  >
                    <div className="min-w-0">
                      <p className="text-lg font-bold">
                        {entry.sunNumber}순 · {entry.sunLeader}
                      </p>
                      {r ? (
                        <p className="text-base text-ink-soft">
                          주일낮 {r.attend_total}명 · 성경 {r.bible_chapters}장 · 헌금 {formatWon(r.offering)}
                        </p>
                      ) : (
                        <p className="text-base text-ink-soft">아직 보고서가 없어요</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={r?.status} />
                      {r && (isOpen ? <ChevronUp className="h-6 w-6 text-slate-400" /> : <ChevronDown className="h-6 w-6 text-slate-400" />)}
                    </div>
                  </button>
                  {r && isOpen && (
                    <div className="px-4 sm:px-6 pb-4 space-y-3 bg-slate-50/60">
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-base text-ink-soft pt-1">
                        {r.worship_at && <span>일시: {r.worship_at}</span>}
                        {r.worship_place && <span>장소: {r.worship_place}</span>}
                        {r.worship_leader && <span>인도자: {r.worship_leader}</span>}
                        <Link href={`/report/sun/${r.id}`} className="font-bold text-brand-700 underline underline-offset-4">
                          보고서 열기 · 답글
                        </Link>
                      </div>
                      {r.sun_report_members.length > 0 ? (
                        <div className="overflow-x-auto rounded-2xl border bg-white">
                          <table className="w-full text-base">
                            <thead>
                              <tr className="bg-slate-50 border-b text-[0.9rem]">
                                <th className="px-3 py-2 text-left font-bold whitespace-nowrap">성명</th>
                                {ATTEND_COLS.map((c) => (
                                  <th key={c.key} className="px-1.5 py-2 text-center font-bold whitespace-nowrap">
                                    {c.short}
                                  </th>
                                ))}
                                <th className="px-1.5 py-2 text-center font-bold">주보</th>
                                <th className="px-2 py-2 text-center font-bold">성경</th>
                              </tr>
                            </thead>
                            <tbody>
                              {r.sun_report_members.map((m) => (
                                <tr key={m.id} className="border-b last:border-0">
                                  <td className="px-3 py-2 font-bold whitespace-nowrap">{m.member_name}</td>
                                  {ATTEND_COLS.map((c) => (
                                    <td key={c.key} className="px-1.5 py-2 text-center">
                                      {m[c.key] ? <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500" /> : <Circle className="mx-auto h-4 w-4 text-slate-200" />}
                                    </td>
                                  ))}
                                  <td className="px-1.5 py-2 text-center">{m.bulletin_recv ? <CheckCircle2 className="mx-auto h-5 w-5 text-brand-500" /> : <Circle className="mx-auto h-4 w-4 text-slate-200" />}</td>
                                  <td className="px-2 py-2 text-center font-bold tabular-nums">{m.bible_read || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-base text-ink-soft">등록된 순원이 없어요</p>
                      )}
                      {r.special_note && (
                        <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-base">
                          <b className="text-violet-800">특별보고:</b> {r.special_note}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {allMembers.some((m) => m.bible_read > 0) && (
        <Card className="rise-in rise-in-3">
          <CardHeader>
            <CardTitle icon={<BookOpenText className="h-6 w-6 text-emerald-600" />}>
              성경 읽기 순원 <span className="text-base font-bold text-ink-soft">합계 {aggregated.total_bible}장</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {sunReports
                .flatMap((r) => r.sun_report_members.filter((m) => m.bible_read > 0).map((m) => ({ ...m, sun: r.sun_number })))
                .sort((a, b) => b.bible_read - a.bible_read)
                .map((m) => (
                  <span key={m.id} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-base">
                    <span className="text-[0.85rem] text-emerald-700 font-bold">{m.sun}순</span>
                    <span className="font-bold">{m.member_name}</span>
                    <span className="text-emerald-800 font-black">{m.bible_read}장</span>
                  </span>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
