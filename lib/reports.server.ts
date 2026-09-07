import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSunMembers, getSunEntry } from "@/lib/constants/sun-directory";

/**
 * 새 순보고서의 기본 순원 명단.
 * 지난 보고서(가장 최근)가 있으면 그 명단(새가족 추가분 유지), 없으면 편성표.
 * 순장 교체 시에도 같은 순의 최근 명단을 쓰도록 service role 로 조회.
 */
export async function defaultMemberNames(sunNumber: number, leaderName: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data: last } = await admin
    .from("sun_reports")
    .select("id")
    .eq("sun_number", sunNumber)
    .order("report_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (last) {
    const { data: rows } = await admin
      .from("sun_report_members")
      .select("member_name, sort_order")
      .eq("report_id", last.id)
      .order("sort_order")
      .order("member_name");
    const names = (rows ?? []).map((r) => r.member_name as string).filter(Boolean);
    if (names.length > 0) return names;
  }

  const entry = getSunEntry(sunNumber);
  const roster = getSunMembers(sunNumber);
  const leader = entry && entry.sunLeader !== leaderName && !roster.includes(leaderName) ? [leaderName] : [];
  // 순장 본인을 맨 앞에
  return [...new Set([...(entry ? [entry.sunLeader] : []), ...leader, ...roster])];
}
