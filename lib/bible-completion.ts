import { getMissionName } from "@/lib/constants/sun-directory";

/**
 * 성경통독 · 성경필사 완료자 보고 — 타입과 집계 (서버·클라이언트 공용)
 *
 * 순장이 순보고서에서 체크 → 선교회장이 선교회보고서를 제출 → 담임목사 화면과
 * 공개 통계에 "최경남 (3선교회)" 형식으로 올라간다.
 * 브릿지선교회는 선교회장이 없어 목자(순장)의 순보고서 제출이 곧 최종 보고다.
 */

export type BibleKind = "성경필사" | "성경통독";

export interface BibleCompletion {
  kind: BibleKind;
  name: string;
  missionId: number;
  missionName: string;
  reportDate: string;
}

/** "최경남 (3선교회)" */
export function formatCompletionLine(c: Pick<BibleCompletion, "name" | "missionName">): string {
  return `${c.name} (${c.missionName})`;
}

export interface MemberFlags {
  member_name: string;
  bible_tongdok: boolean | null;
  bible_pilsa: boolean | null;
}
export interface ReportWithFlags {
  mission_id: number;
  report_date: string;
  members: MemberFlags[];
}

/**
 * 체크된 순원을 모아 완료자 목록을 만든다.
 * 같은 사람이 같은 종류로 여러 번 체크돼도 한 번만 세고, 필사 → 통독 → 선교회 순으로 정렬한다.
 */
export function buildBibleCompletions(reports: ReportWithFlags[]): BibleCompletion[] {
  const out: BibleCompletion[] = [];
  const seen = new Set<string>();
  for (const r of reports) {
    for (const m of r.members ?? []) {
      const name = m.member_name?.trim();
      if (!name) continue;
      const kinds: BibleKind[] = [];
      if (m.bible_pilsa) kinds.push("성경필사");
      if (m.bible_tongdok) kinds.push("성경통독");
      for (const kind of kinds) {
        const key = `${kind}|${name}|${r.mission_id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ kind, name, missionId: r.mission_id, missionName: getMissionName(r.mission_id), reportDate: r.report_date });
      }
    }
  }
  return out.sort(
    (a, b) =>
      (a.kind === b.kind ? 0 : a.kind === "성경필사" ? -1 : 1) ||
      a.missionId - b.missionId ||
      a.name.localeCompare(b.name, "ko")
  );
}
