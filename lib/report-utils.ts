import type { SunReport, SunReportMember, AttendKey } from "@/types/database";
import { ATTEND_COLS } from "@/types/database";

/** 여러 순보고서 → 선교회보고서 집계값 */
export function aggregateSunReports(reports: Pick<SunReport, "status" | "attend_total" | "bible_chapters" | "offering">[]) {
  const submitted = reports.filter((r) => r.status === "submitted");
  return {
    total_sun: submitted.length,
    total_attend: submitted.reduce((s, r) => s + (r.attend_total || 0), 0),
    total_bible: submitted.reduce((s, r) => s + (r.bible_chapters || 0), 0),
    total_offering: submitted.reduce((s, r) => s + (r.offering || 0), 0),
  };
}

/** 순원 목록 → 6가지 항목별 인원 */
export function countAttendance(members: Pick<SunReportMember, AttendKey>[]): Record<AttendKey, number> {
  const out = {} as Record<AttendKey, number>;
  for (const col of ATTEND_COLS) out[col.key] = members.filter((m) => m[col.key]).length;
  return out;
}

/** 순원 점수 기준 (담임목사 순원 점수 순위) */
export const SCORE = { attend: 1, evangelism: 10, biblePerChapter: 0.02 } as const;

export function memberScore(m: { samil: number; friday: number; sunDay: number; sunEve: number; sun: number; evangelism: number; totalBible: number }) {
  const v =
    (m.samil + m.friday + m.sunDay + m.sunEve + m.sun) * SCORE.attend +
    m.evangelism * SCORE.evangelism +
    m.totalBible * SCORE.biblePerChapter;
  return Math.round(v * 100) / 100;
}
