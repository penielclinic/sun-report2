import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSunMembers, getSunEntry } from "@/lib/constants/sun-directory";

/** 과거 보고서를 몇 개까지 거슬러 보며 출석 여부를 볼지 */
const HISTORY_LIMIT = 30;

export interface DefaultRoster {
  names: string[];
  /** 과거 출석 기록을 기준으로 순서를 정했는지 (안내 문구 표시용) */
  sortedByAttendance: boolean;
}

/**
 * 새 순보고서의 기본 순원 명단.
 *
 * - 명단은 가장 최근 보고서 기준 (순장이 추가한 새가족이 계속 유지됨), 없으면 편성표.
 * - 순서는 **최근에 출석하신 분이 위, 한 번도 출석 기록이 없는 분이 아래**.
 *   같은 조건이면 출석 횟수가 많은 분, 그다음은 기존 명단 순서.
 * - 순장 교체 시에도 같은 순의 기록을 쓰도록 service role 로 조회.
 */
export async function defaultMemberNames(sunNumber: number, leaderName: string): Promise<DefaultRoster> {
  const admin = createAdminClient();

  const { data: reports } = await admin
    .from("sun_reports")
    .select("id, report_date")
    .eq("sun_number", sunNumber)
    .order("report_date", { ascending: false })
    .limit(HISTORY_LIMIT);

  const history = reports ?? [];

  if (history.length > 0) {
    const dateOf = new Map(history.map((r) => [r.id as string, r.report_date as string]));
    const { data: rows } = await admin
      .from("sun_report_members")
      .select("report_id, member_name, sort_order, attend_samil, attend_friday, attend_sun_day, attend_sun_eve, attend_sun")
      .in(
        "report_id",
        history.map((r) => r.id)
      );

    const all = rows ?? [];
    const latestId = history[0].id as string;

    // 기준 명단: 가장 최근 보고서에 올라온 순원
    const roster = all
      .filter((r) => r.report_id === latestId && r.member_name)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || String(a.member_name).localeCompare(String(b.member_name), "ko"))
      .map((r) => r.member_name as string);

    if (roster.length > 0) {
      // 이름별 마지막 출석일·출석 횟수 (예배·순모임 중 하나라도 참석하면 출석으로 봄)
      const stat = new Map<string, { last: string | null; count: number }>();
      for (const r of all) {
        const name = r.member_name as string;
        if (!name) continue;
        const attended = r.attend_samil || r.attend_friday || r.attend_sun_day || r.attend_sun_eve || r.attend_sun;
        const s = stat.get(name) ?? { last: null, count: 0 };
        if (attended) {
          s.count += 1;
          const d = dateOf.get(r.report_id as string);
          if (d && (!s.last || d > s.last)) s.last = d;
        }
        stat.set(name, s);
      }

      const baseOrder = new Map(roster.map((n, i) => [n, i]));
      const names = [...roster].sort((a, b) => {
        const sa = stat.get(a);
        const sb = stat.get(b);
        const aLast = sa?.last ?? null;
        const bLast = sb?.last ?? null;
        // 1) 출석 기록이 있는 분 먼저
        if (aLast && !bLast) return -1;
        if (!aLast && bLast) return 1;
        // 2) 둘 다 있으면 최근에 출석한 분 먼저
        if (aLast && bLast && aLast !== bLast) return bLast.localeCompare(aLast);
        // 3) 출석 횟수가 많은 분 먼저
        const ca = sa?.count ?? 0;
        const cb = sb?.count ?? 0;
        if (ca !== cb) return cb - ca;
        // 4) 기존 명단 순서 유지
        return (baseOrder.get(a) ?? 0) - (baseOrder.get(b) ?? 0);
      });

      const attendedCount = names.filter((n) => stat.get(n)?.last).length;
      return { names, sortedByAttendance: attendedCount > 0 && attendedCount < names.length };
    }
  }

  // 기록이 없으면 편성표 순서 그대로
  const entry = getSunEntry(sunNumber);
  const roster = getSunMembers(sunNumber);
  const leader = entry && entry.sunLeader !== leaderName && !roster.includes(leaderName) ? [leaderName] : [];
  return {
    names: [...new Set([...(entry ? [entry.sunLeader] : []), ...leader, ...roster])],
    sortedByAttendance: false,
  };
}
