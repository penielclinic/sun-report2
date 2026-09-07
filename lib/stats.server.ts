import "server-only";
import { createClient } from "@/lib/supabase/server";
import { ATTEND_COLS, type AttendKey } from "@/types/database";
import { addDays, currentReportSunday, todayKST } from "@/lib/dates";

export type Period = "week" | "month" | "year";

export interface PeriodPoint {
  key: string;
  label: string;
  attend_samil: number;
  attend_friday: number;
  attend_sun_day: number;
  attend_sun_eve: number;
  attend_sun: number;
  evangelism: number;
  bible: number;
  offering: number;
  reports: number;
}

export const PERIODS: { key: Period; label: string; desc: string }[] = [
  { key: "week", label: "주간", desc: "최근 12주" },
  { key: "month", label: "월간", desc: "최근 12개월" },
  { key: "year", label: "연간", desc: "최근 5년" },
];

function sinceFor(period: Period): string {
  const today = todayKST();
  if (period === "week") return addDays(currentReportSunday(), -7 * 11);
  if (period === "month") {
    const [y, m] = today.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 1 - 11, 1));
    return d.toISOString().slice(0, 10);
  }
  return `${Number(today.slice(0, 4)) - 4}-01-01`;
}

function bucketKey(date: string, period: Period) {
  if (period === "year") return date.slice(0, 4);
  if (period === "month") return date.slice(0, 7);
  return date;
}
function bucketLabel(key: string, period: Period) {
  if (period === "year") return `${key}년`;
  if (period === "month") return `${Number(key.slice(5))}월`;
  return `${Number(key.slice(5, 7))}/${Number(key.slice(8))}`;
}

function emptyPoint(key: string, period: Period): PeriodPoint {
  return { key, label: bucketLabel(key, period), attend_samil: 0, attend_friday: 0, attend_sun_day: 0, attend_sun_eve: 0, attend_sun: 0, evangelism: 0, bible: 0, offering: 0, reports: 0 };
}

/** 기간별 집계 (담임목사 통계·PDF 공용) */
export async function loadStatistics(period: Period) {
  const supabase = await createClient();
  const since = sinceFor(period);

  const { data: sunReports } = await supabase
    .from("sun_reports")
    .select("id, report_date, mission_id, attend_total, bible_chapters, offering")
    .eq("status", "submitted")
    .gte("report_date", since)
    .order("report_date");
  const reports = sunReports ?? [];
  const ids = reports.map((r) => r.id);

  type MRow = Record<AttendKey, boolean> & { report_id: string };
  let members: MRow[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await supabase
      .from("sun_report_members")
      .select("report_id, attend_samil, attend_friday, attend_sun_day, attend_sun_eve, attend_sun, evangelism")
      .in("report_id", ids.slice(i, i + 200));
    members = members.concat((data ?? []) as MRow[]);
  }

  const { data: missionReports } = await supabase.from("mission_reports").select("report_date, mission_id, total_offering").eq("status", "submitted").gte("report_date", since);

  const buckets = new Map<string, PeriodPoint>();
  const get = (date: string) => {
    const k = bucketKey(date, period);
    let b = buckets.get(k);
    if (!b) {
      b = emptyPoint(k, period);
      buckets.set(k, b);
    }
    return b;
  };
  const dateOf = new Map(reports.map((r) => [r.id, r.report_date]));
  for (const r of reports) {
    const b = get(r.report_date);
    b.bible += r.bible_chapters;
    b.reports += 1;
  }
  for (const m of members) {
    const d = dateOf.get(m.report_id);
    if (!d) continue;
    const b = get(d);
    for (const c of ATTEND_COLS) if (m[c.key]) b[c.key]++;
  }
  // 헌금: 선교회보고서 우선, 없으면 순보고서 합계
  const missionOfferingByBucket = new Map<string, number>();
  for (const r of missionReports ?? []) {
    const k = bucketKey(r.report_date, period);
    missionOfferingByBucket.set(k, (missionOfferingByBucket.get(k) ?? 0) + r.total_offering);
  }
  for (const [k, b] of buckets) {
    const mo = missionOfferingByBucket.get(k);
    b.offering = mo && mo > 0 ? mo : reports.filter((r) => bucketKey(r.report_date, period) === k).reduce((s, r) => s + (r.offering ?? 0), 0);
  }

  const points = [...buckets.values()].sort((a, b) => a.key.localeCompare(b.key)).slice(period === "week" ? -12 : period === "month" ? -12 : -5);
  const latest = points[points.length - 1];

  // 선교회별 (최신 버킷)
  const missionAttend = new Map<number, number>();
  if (latest) {
    for (const r of reports.filter((r) => bucketKey(r.report_date, period) === latest.key)) {
      missionAttend.set(r.mission_id, (missionAttend.get(r.mission_id) ?? 0) + r.attend_total);
    }
  }

  return { period, since, points, latest, missionAttend };
}
