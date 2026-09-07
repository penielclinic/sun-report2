import type { Metadata } from "next";
import { Download } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SundayPicker } from "@/components/reports/sunday-picker";
import { PrintButton } from "@/components/reports/print-button";
import { ExcelButton, type ExcelSheet } from "@/components/admin/excel-button";
import { formatKoreanDate, resolveReportSunday } from "@/lib/dates";
import { SUN_DIRECTORY, getMissionShortName } from "@/lib/constants/sun-directory";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "주간 보고 출력" };

interface Row {
  sunNumber: number;
  missionId: number;
  sunLeader: string;
  place: string;
  leader: string;
  attend: number | null;
  bible: number | null;
  submitted: boolean;
}

function spans(rows: Row[]) {
  const out = new Array(rows.length).fill(0);
  let i = 0;
  while (i < rows.length) {
    let j = i;
    while (j < rows.length && rows[j].missionId === rows[i].missionId) j++;
    out[i] = j - i;
    i = j;
  }
  return out as number[];
}

const HEADER = ["선교회", "순", "순장", "장소", "인도", "인원", "성경"];

function ReportTable({ rows, sp }: { rows: Row[]; sp: number[] }) {
  return (
    <table className="w-full text-[0.95rem] border-collapse">
      <thead>
        <tr className="bg-brand-700 text-white">
          {HEADER.map((h) => (
            <th key={h} className="border border-brand-800 px-2 py-2 font-bold whitespace-nowrap">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.sunNumber} className={cn(!r.submitted && "text-slate-400", i % 2 ? "bg-slate-50/50" : "")}>
            {sp[i] > 0 && (
              <td rowSpan={sp[i]} className="border px-2 py-1.5 text-center font-black bg-brand-50 text-brand-800 whitespace-nowrap align-middle">
                {getMissionShortName(r.missionId)}
              </td>
            )}
            <td className="border px-2 py-1.5 text-center tabular-nums">{r.sunNumber}</td>
            <td className="border px-2 py-1.5 whitespace-nowrap font-bold">{r.sunLeader}</td>
            <td className="border px-2 py-1.5 whitespace-nowrap">{r.place}</td>
            <td className="border px-2 py-1.5 whitespace-nowrap">{r.leader}</td>
            <td className="border px-2 py-1.5 text-center tabular-nums">{r.attend ?? "−"}</td>
            <td className="border px-2 py-1.5 text-center tabular-nums text-emerald-700 font-bold">{r.bible ?? "−"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

}

export default async function WeeklyReportPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  await requirePage(["pastor"]);
  const { date } = await searchParams;
  const selected = resolveReportSunday(date);
  const supabase = await createClient();
  const { data } = await supabase.from("sun_reports").select("sun_number, attend_total, bible_chapters, worship_place, worship_leader, status").eq("report_date", selected);
  const map = new Map((data ?? []).map((r) => [r.sun_number, r]));

  const rows: Row[] = SUN_DIRECTORY.map((e) => {
    const r = map.get(e.sunNumber);
    const ok = r?.status === "submitted";
    return { sunNumber: e.sunNumber, missionId: e.missionId, sunLeader: e.sunLeader, place: ok ? r.worship_place ?? "" : "", leader: ok ? r.worship_leader ?? "" : "", attend: ok ? r.attend_total : null, bible: ok ? r.bible_chapters : null, submitted: ok };
  });
  const half = Math.ceil(rows.length / 2);
  const L = rows.slice(0, half);
  const R = rows.slice(half);
  const lS = spans(L);
  const rS = spans(R);
  const submittedCount = rows.filter((r) => r.submitted).length;
  const totalAttend = rows.reduce((s, r) => s + (r.attend ?? 0), 0);
  const totalBible = rows.reduce((s, r) => s + (r.bible ?? 0), 0);

  const aoa: (string | number | null)[][] = [[`선교회별 예배 보고 현황 — ${formatKoreanDate(selected)}`], [`제출 ${submittedCount}/${rows.length}순 · 주일낮 ${totalAttend}명 · 성경 ${totalBible}장`], [...HEADER, "", ...HEADER]];
  for (let i = 0; i < half; i++) {
    const a = L[i];
    const b = R[i];
    const cell = (x?: Row) => (x ? [getMissionShortName(x.missionId), x.sunNumber, x.sunLeader, x.place, x.leader, x.attend ?? "", x.bible ?? ""] : ["", "", "", "", "", "", ""]);
    aoa.push([...cell(a), "", ...cell(b)]);
  }
  const merges: ExcelSheet["merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 14 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 14 } },
  ];
  lS.forEach((n, i) => n > 1 && merges.push({ s: { r: 3 + i, c: 0 }, e: { r: 3 + i + n - 1, c: 0 } }));
  rS.forEach((n, i) => n > 1 && merges.push({ s: { r: 3 + i, c: 8 }, e: { r: 3 + i + n - 1, c: 8 } }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="주간 보고 출력"
        subtitle={`${formatKoreanDate(selected)} 주일 · 제출 ${submittedCount}/${rows.length}순 · 주일낮 ${totalAttend}명 · 성경 ${totalBible}장`}
        icon={<Download className="h-7 w-7" />}
        action={
          <>
            <ExcelButton filename={`주간보고_${selected}.xlsx`} sheets={[{ name: "예배보고", rows: aoa, merges, colWidths: [7, 4, 9, 9, 9, 5, 5, 2, 7, 4, 9, 9, 9, 5, 5] }]} />
            <PrintButton label="PDF · 인쇄" />
          </>
        }
      />
      <SundayPicker value={selected} basePath="/admin/weekly-report" className="no-print" />

      <Card className="rise-in rise-in-2">
        <CardHeader className="print-only">
          <CardTitle>선교회별 예배 보고 현황 — {formatKoreanDate(selected)}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-2 print:grid-cols-2">
            <div className="overflow-x-auto">
              <ReportTable rows={L} sp={lS} />
            </div>
            <div className="overflow-x-auto">
              <ReportTable rows={R} sp={rS} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
