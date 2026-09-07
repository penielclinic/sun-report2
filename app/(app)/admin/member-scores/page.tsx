import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, SegmentTabs } from "@/components/ui/misc";
import { ExcelButton } from "@/components/admin/excel-button";
import { PrintButton } from "@/components/reports/print-button";
import { ScoresTable, type ScoreRow } from "./scores-table";
import { currentReportSunday, monthRange, yearRange, formatKoreanDate, isValidDateString, todayKST } from "@/lib/dates";
import { memberScore, SCORE } from "@/lib/report-utils";
import type { AttendKey } from "@/types/database";

export const metadata: Metadata = { title: "순원 점수 순위" };

/** 동점자는 같은 순위, 다음 순위는 건너뜀 (1,1,3,...) */
function assignRanks(sorted: Omit<ScoreRow, "rank">[]): ScoreRow[] {
  const out: ScoreRow[] = [];
  let rank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].score < sorted[i - 1].score) rank = i + 1;
    out.push({ ...sorted[i], rank });
  }
  return out;
}

type Period = "week" | "month" | "year" | "custom";

function range(period: Period, from?: string, to?: string) {
  if (period === "custom" && from && to && isValidDateString(from) && isValidDateString(to) && from <= to) return { start: from, end: to, label: `${from} ~ ${to}` };
  if (period === "month") {
    const r = monthRange();
    return { start: r.start, end: r.end, label: `${Number(todayKST().slice(0, 4))}년 ${Number(todayKST().slice(5, 7))}월` };
  }
  if (period === "year") {
    const r = yearRange();
    return { start: r.start, end: r.end, label: `${todayKST().slice(0, 4)}년` };
  }
  const s = currentReportSunday();
  return { start: s, end: s, label: `${formatKoreanDate(s)} 주일` };
}

export default async function MemberScoresPage({ searchParams }: { searchParams: Promise<{ period?: string; from?: string; to?: string }> }) {
  await requirePage(["pastor"]);
  const sp = await searchParams;
  const period: Period = (["week", "month", "year", "custom"] as const).includes(sp.period as Period) ? (sp.period as Period) : "week";
  const { start, end, label } = range(period, sp.from, sp.to);
  const supabase = await createClient();

  const { data: reports } = await supabase.from("sun_reports").select("id, sun_number, mission_id").eq("status", "submitted").gte("report_date", start).lte("report_date", end);
  const rep = reports ?? [];
  const repMap = new Map(rep.map((r) => [r.id, r]));
  const ids = rep.map((r) => r.id);

  type M = Record<AttendKey, boolean> & { member_name: string; bible_read: number; report_id: string };
  let members: M[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await supabase.from("sun_report_members").select("member_name, attend_samil, attend_friday, attend_sun_day, attend_sun_eve, attend_sun, evangelism, bible_read, report_id").in("report_id", ids.slice(i, i + 200));
    members = members.concat((data ?? []) as M[]);
  }

  const agg = new Map<string, Omit<ScoreRow, "rank" | "score">>();
  for (const m of members) {
    const r = repMap.get(m.report_id);
    if (!r) continue;
    const key = `${r.sun_number}__${m.member_name}`;
    const e = agg.get(key) ?? { name: m.member_name, sun: r.sun_number, mission: r.mission_id, samil: 0, friday: 0, sunDay: 0, sunEve: 0, sun_: 0, evangelism: 0, totalBible: 0 };
    e.samil += m.attend_samil ? 1 : 0;
    e.friday += m.attend_friday ? 1 : 0;
    e.sunDay += m.attend_sun_day ? 1 : 0;
    e.sunEve += m.attend_sun_eve ? 1 : 0;
    e.sun_ += m.attend_sun ? 1 : 0;
    e.evangelism += m.evangelism ? 1 : 0;
    e.totalBible += m.bible_read || 0;
    agg.set(key, e);
  }
  const sorted = [...agg.values()]
    .map((e) => ({ ...e, score: memberScore({ samil: e.samil, friday: e.friday, sunDay: e.sunDay, sunEve: e.sunEve, sun: e.sun_, evangelism: e.evangelism, totalBible: e.totalBible }) }))
    .sort((a, b) => b.score - a.score || a.sun - b.sun || a.name.localeCompare(b.name, "ko"));
  const rows: ScoreRow[] = assignRanks(sorted);

  const excelRows = [
    ["순위", "이름", "순", "선교회", "삼일", "금요", "주일낮", "주일밤", "순모임", "전도", "성경(장)", "점수"],
    ...rows.map((r) => [r.rank, r.name, r.sun, r.mission, r.samil, r.friday, r.sunDay, r.sunEve, r.sun_, r.evangelism, r.totalBible, r.score]),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="순원 점수 순위"
        subtitle={`${label} · 출석 ${SCORE.attend}점 · 전도 ${SCORE.evangelism}점 · 성경 1장 ${SCORE.biblePerChapter}점`}
        icon={<Trophy className="h-7 w-7 text-gold-500" />}
        action={
          <>
            <ExcelButton filename={`순원점수_${start}_${end}.xlsx`} sheets={[{ name: "점수", rows: excelRows }]} />
            <PrintButton />
          </>
        }
      />
      <SegmentTabs
        value={period}
        options={[
          { value: "week", label: "이번 주", href: "/admin/member-scores?period=week" },
          { value: "month", label: "이번 달", href: "/admin/member-scores?period=month" },
          { value: "year", label: "올해", href: "/admin/member-scores?period=year" },
          { value: "custom", label: "기간 지정", href: `/admin/member-scores?period=custom&from=${start}&to=${end}` },
        ]}
        className="no-print"
      />
      <ScoresTable rows={rows} period={period} from={start} to={end} />
    </div>
  );
}
