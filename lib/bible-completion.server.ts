import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BRIDGE_MISSION_ID } from "@/lib/constants/sun-directory";
import {
  buildBibleCompletions,
  type BibleCompletion,
  type MemberFlags,
  type ReportWithFlags,
} from "@/lib/bible-completion";

/** 성경통독 · 필사 완료자 조회 (서비스 롤 — 화면에는 이름과 선교회만 나간다) */

interface FlagRow extends MemberFlags {
  report_id: string;
}

/** 순보고서 id 목록에서 통독·필사가 체크된 순원만 가져온다 (1000행 제한을 피해 나눠 읽는다) */
async function fetchFlagged(admin: SupabaseClient, reportIds: string[]): Promise<Map<string, FlagRow[]>> {
  const byReport = new Map<string, FlagRow[]>();
  for (let i = 0; i < reportIds.length; i += 200) {
    const { data } = await admin
      .from("sun_report_members")
      .select("report_id, member_name, bible_tongdok, bible_pilsa")
      .in("report_id", reportIds.slice(i, i + 200))
      .or("bible_tongdok.eq.true,bible_pilsa.eq.true")
      .limit(5000);
    for (const row of (data ?? []) as FlagRow[]) {
      byReport.set(row.report_id, [...(byReport.get(row.report_id) ?? []), row]);
    }
  }
  return byReport;
}

function joinFlags(
  rows: { id: string; mission_id: number; report_date: string }[],
  flagged: Map<string, FlagRow[]>
): ReportWithFlags[] {
  return rows.filter((r) => flagged.has(r.id)).map((r) => ({ ...r, members: flagged.get(r.id)! }));
}

/**
 * 순장 → 선교회장 단계.
 * 선교회보고서 제출 전이라도 선교회장이 볼 수 있게, 제출된 순보고서만 모은다.
 */
export async function fetchSunLevelCompletions(
  admin: SupabaseClient,
  missionId: number,
  reportDate: string
): Promise<BibleCompletion[]> {
  const { data } = await admin
    .from("sun_reports")
    .select("id, mission_id, report_date")
    .eq("mission_id", missionId)
    .eq("report_date", reportDate)
    .eq("status", "submitted");
  const rows = (data ?? []) as { id: string; mission_id: number; report_date: string }[];
  return buildBibleCompletions(joinFlags(rows, await fetchFlagged(admin, rows.map((r) => r.id))));
}

/**
 * 선교회장 → 담임목사 단계.
 * 선교회장이 선교회보고서를 "제출"한 선교회만 포함한다 (브릿지선교회는 순보고서 제출로 갈음).
 */
export async function fetchReportedCompletions(
  admin: SupabaseClient,
  fromDate: string,
  toDate: string
): Promise<BibleCompletion[]> {
  const [{ data: missionReports }, { data: sunReports }] = await Promise.all([
    admin
      .from("mission_reports")
      .select("mission_id, report_date")
      .eq("status", "submitted")
      .gte("report_date", fromDate)
      .lte("report_date", toDate)
      .limit(5000),
    admin
      .from("sun_reports")
      .select("id, mission_id, report_date")
      .eq("status", "submitted")
      .gte("report_date", fromDate)
      .lte("report_date", toDate)
      .limit(5000),
  ]);

  const reported = new Set(
    ((missionReports ?? []) as { mission_id: number; report_date: string }[]).map((m) => `${m.mission_id}|${m.report_date}`)
  );
  const eligible = ((sunReports ?? []) as { id: string; mission_id: number; report_date: string }[]).filter(
    (r) => r.mission_id === BRIDGE_MISSION_ID || reported.has(`${r.mission_id}|${r.report_date}`)
  );
  return buildBibleCompletions(joinFlags(eligible, await fetchFlagged(admin, eligible.map((r) => r.id))));
}
