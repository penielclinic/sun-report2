import { StatTile, SegmentTabs } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatisticsCharts } from "@/components/admin/statistics-charts";
import { PERIODS, type Period, type PeriodPoint } from "@/lib/stats.server";
import { formatWon } from "@/lib/utils";
import { ATTEND_COLS } from "@/types/database";

/**
 * 통계 본문 (담임목사 통계 화면 · 로그인 없이 보는 공개 통계 화면 공용).
 * 사람 이름이나 연락처 없이 숫자 합계만 보여 준다.
 */
export function StatisticsBody({
  period,
  points,
  latest,
  mission,
  basePath,
}: {
  period: Period;
  points: PeriodPoint[];
  latest?: PeriodPoint;
  mission: { name: string; attend: number }[];
  basePath: string;
}) {
  const meta = PERIODS.find((x) => x.key === period)!;
  const avgSunDay = points.length ? Math.round(points.reduce((s, x) => s + x.attend_sun_day, 0) / points.length) : 0;
  const totalEvangelism = points.reduce((s, x) => s + x.evangelism, 0);

  return (
    <>
      <SegmentTabs
        value={period}
        options={PERIODS.map((x) => ({ value: x.key, label: x.label, href: `${basePath}?period=${x.key}` }))}
        className="no-print"
      />

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
    </>
  );
}
