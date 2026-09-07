import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { PageHeader, StatTile, SegmentTabs } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrintButton } from "@/components/reports/print-button";
import { StatisticsCharts } from "@/components/admin/statistics-charts";
import { ExcelButton } from "@/components/admin/excel-button";
import { loadStatistics, PERIODS, type Period } from "@/lib/stats.server";
import { MISSION_IDS, getMissionShortName } from "@/lib/constants/sun-directory";
import { formatWon } from "@/lib/utils";
import { ATTEND_COLS } from "@/types/database";

export const metadata: Metadata = { title: "통계" };

export default async function StatisticsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  await requirePage(["pastor"]);
  const { period: p } = await searchParams;
  const period: Period = (["week", "month", "year"] as const).includes(p as Period) ? (p as Period) : "week";
  const meta = PERIODS.find((x) => x.key === period)!;
  const { points, latest, missionAttend } = await loadStatistics(period);

  const avgSunDay = points.length ? Math.round(points.reduce((s, x) => s + x.attend_sun_day, 0) / points.length) : 0;
  const totalEvangelism = points.reduce((s, x) => s + x.evangelism, 0);
  const mission = MISSION_IDS.map((m) => ({ name: getMissionShortName(m), attend: missionAttend.get(m) ?? 0 }));

  const excelRows = [
    ["기간", ...ATTEND_COLS.map((c) => c.label), "성경(장)", "헌금(원)", "제출 순"],
    ...points.map((x) => [x.label, ...ATTEND_COLS.map((c) => x[c.key]), x.bible, x.offering, x.reports]),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="통계 · 차트"
        subtitle={meta.desc}
        icon={<BarChart3 className="h-7 w-7" />}
        action={
          <>
            <ExcelButton filename={`순보고_통계_${period}.xlsx`} sheets={[{ name: "추이", rows: excelRows }, { name: "선교회별", rows: [["선교회", "주일낮 참석"], ...mission.map((m) => [m.name, m.attend])] }]} />
            <PrintButton />
          </>
        }
      />

      <SegmentTabs value={period} options={PERIODS.map((x) => ({ value: x.key, label: x.label, href: `/admin/statistics?period=${x.key}` }))} className="no-print" />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3 rise-in rise-in-2">
        <StatTile label={`최근 ${meta.label} 주일낮`} value={latest?.attend_sun_day ?? 0} unit="명" tone="amber" />
        <StatTile label={`최근 ${meta.label} 순모임`} value={latest?.attend_sun ?? 0} unit="명" tone="emerald" />
        <StatTile label={`최근 ${meta.label} 성경`} value={latest?.bible ?? 0} unit="장" tone="indigo" />
        <StatTile label={`최근 ${meta.label} 헌금`} value={formatWon(latest?.offering)} tone="sky" />
        <StatTile label="평균 주일낮" value={avgSunDay} unit="명" tone="violet" className="col-span-2 sm:col-span-1" />
      </div>

      <StatisticsCharts points={points} mission={mission} periodLabel={meta.desc} />

      <Card className="rise-in rise-in-4">
        <CardHeader>
          <CardTitle>
            {meta.label} 추이표 <span className="text-base font-bold text-ink-soft">· 전도 합계 {totalEvangelism}건</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead>
                <tr className="bg-slate-50 border-y text-[0.95rem]">
                  <th className="px-3 py-3 text-left font-bold whitespace-nowrap">기간</th>
                  {ATTEND_COLS.map((c) => (
                    <th key={c.key} className="px-2 py-3 text-right font-bold whitespace-nowrap">
                      {c.short}
                    </th>
                  ))}
                  <th className="px-2 py-3 text-right font-bold whitespace-nowrap">성경</th>
                  <th className="px-3 py-3 text-right font-bold whitespace-nowrap">헌금</th>
                  <th className="px-3 py-3 text-right font-bold whitespace-nowrap">제출</th>
                </tr>
              </thead>
              <tbody>
                {points.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-ink-soft">
                      데이터가 없어요
                    </td>
                  </tr>
                ) : (
                  [...points].reverse().map((x, i) => (
                    <tr key={x.key} className={"border-b last:border-0 " + (i % 2 ? "bg-slate-50/40" : "")}>
                      <td className="px-3 py-2.5 font-bold whitespace-nowrap">{x.label}</td>
                      {ATTEND_COLS.map((c) => (
                        <td key={c.key} className="px-2 py-2.5 text-right tabular-nums">
                          {x[c.key]}
                        </td>
                      ))}
                      <td className="px-2 py-2.5 text-right tabular-nums">{x.bible}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{x.offering.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-ink-soft">{x.reports}순</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
