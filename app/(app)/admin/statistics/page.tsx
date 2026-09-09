import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/misc";
import { PrintButton } from "@/components/reports/print-button";
import { StatisticsBody } from "@/components/admin/statistics-body";
import { ExcelButton } from "@/components/admin/excel-button";
import { loadStatistics, PERIODS, type Period } from "@/lib/stats.server";
import { MISSION_IDS, getMissionShortName } from "@/lib/constants/sun-directory";
import { ATTEND_COLS } from "@/types/database";

export const metadata: Metadata = { title: "통계" };

export default async function StatisticsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  await requirePage(["pastor"]);
  const { period: p } = await searchParams;
  const period: Period = (["week", "month", "year"] as const).includes(p as Period) ? (p as Period) : "week";
  const meta = PERIODS.find((x) => x.key === period)!;
  const { points, latest, missionAttend } = await loadStatistics(period);
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

      <StatisticsBody period={period} points={points} latest={latest} mission={mission} basePath="/admin/statistics" />
    </div>
  );
}
