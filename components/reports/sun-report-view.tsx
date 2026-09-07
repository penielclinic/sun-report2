import { CheckCircle2, Circle, CalendarDays, Users, Sparkles, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { StatTile } from "@/components/ui/misc";
import { ATTEND_COLS, type SunReport, type SunReportMember } from "@/types/database";
import { countAttendance } from "@/lib/report-utils";
import { formatKoreanDate, formatDateTime } from "@/lib/dates";
import { formatWon, cn } from "@/lib/utils";
import { getSunLabel } from "@/lib/constants/sun-directory";
import { PrintButton } from "@/components/reports/print-button";

const COLS = [...ATTEND_COLS.map((c) => ({ key: c.key as keyof SunReportMember, label: c.short })), { key: "bulletin_recv" as const, label: "주보" }];

export function SunReportView({ report, members }: { report: SunReport; members: SunReportMember[] }) {
  const counts = countAttendance(members);

  return (
    <div className="space-y-5">
      <Card className="rise-in">
        <CardHeader className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle icon={<CalendarDays className="h-6 w-6 text-brand-600" />}>
              {getSunLabel(report.sun_number)} · {report.sun_leader} 순장
            </CardTitle>
            <p className="mt-1 text-lg text-ink-soft">{formatKoreanDate(report.report_date)} 주일</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={report.status} />
            <PrintButton />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-x-6 gap-y-2 text-lg sm:grid-cols-3">
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-ink-soft">순모임</dt>
              <dd className="font-bold">{report.worship_at ?? "-"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-ink-soft">장소</dt>
              <dd className="font-bold">{report.worship_place ?? "-"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-ink-soft">인도자</dt>
              <dd className="font-bold">{report.worship_leader ?? "-"}</dd>
            </div>
          </dl>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {ATTEND_COLS.map((c) => (
              <StatTile key={c.key} label={c.label} value={counts[c.key]} unit="명" tone={c.color as never} className="px-3 py-3" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <StatTile label="주일낮 참석" value={report.attend_total} unit="명" tone="amber" />
            <StatTile label="성경 읽기" value={report.bible_chapters} unit="장" tone="emerald" />
            <StatTile label="헌금" value={formatWon(report.offering)} tone="sky" />
          </div>
          {report.submitted_at && <p className="text-base text-ink-soft">제출 시각: {formatDateTime(report.submitted_at)}</p>}
        </CardContent>
      </Card>

      {members.length > 0 && (
        <Card className="rise-in rise-in-2">
          <CardHeader>
            <CardTitle icon={<Users className="h-6 w-6 text-emerald-600" />}>
              순원 출석 현황 <span className="text-base font-bold text-ink-soft">({members.length}명)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="bg-slate-50 border-y text-[0.95rem]">
                    <th className="px-4 py-3 text-left font-bold whitespace-nowrap">성명</th>
                    {COLS.map((c) => (
                      <th key={c.key} className="px-2 py-3 text-center font-bold whitespace-nowrap">
                        {c.label}
                      </th>
                    ))}
                    <th className="px-2 py-3 text-center font-bold whitespace-nowrap">성경</th>
                    <th className="px-3 py-3 text-left font-bold whitespace-nowrap">메모</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m, i) => (
                    <tr key={m.id} className={cn("border-b last:border-0", i % 2 ? "bg-slate-50/40" : "")}>
                      <td className="px-4 py-2.5 font-bold whitespace-nowrap">{m.member_name}</td>
                      {COLS.map((c) => (
                        <td key={c.key} className="px-2 py-2.5 text-center">
                          {m[c.key] ? <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-500" /> : <Circle className="mx-auto h-5 w-5 text-slate-200" />}
                        </td>
                      ))}
                      <td className="px-2 py-2.5 text-center font-bold tabular-nums">{m.bible_read || "-"}</td>
                      <td className="px-3 py-2.5 text-ink-soft max-w-[16rem]">{m.member_note ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {report.special_note && (
        <Card className="rise-in rise-in-3 border-violet-200 bg-violet-50/40">
          <CardHeader>
            <CardTitle icon={<Sparkles className="h-6 w-6 text-violet-600" />}>특별보고 · 기도제목</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg whitespace-pre-wrap leading-relaxed">{report.special_note}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export { Printer };
