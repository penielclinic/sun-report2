/**
 * 날짜 유틸 — 모든 계산은 한국 시간(KST, UTC+9) 기준.
 * 서버(Vercel, UTC)와 브라우저 어디서 실행돼도 같은 결과가 나오도록
 * Date 객체의 로컬 타임존에 의존하지 않는다.
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** "YYYY-MM-DD" 형식 검사 */
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateString(s: unknown): s is string {
  if (typeof s !== "string" || !DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** 오늘 날짜 (KST) "YYYY-MM-DD" */
export function todayKST(now: Date = new Date()): string {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" → 요일 (0=일) — 타임존 무관 */
export function dayOfWeek(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay();
}

/** 날짜 문자열에 일 수 더하기 */
export function addDays(dateStr: string, days: number): string {
  return new Date(new Date(`${dateStr}T00:00:00Z`).getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/**
 * 보고 기준 주일:
 *  - 일요일이면 오늘
 *  - 월~토요일이면 직전 일요일 (주일예배 후 보고를 제출하는 흐름)
 */
export function currentReportSunday(now: Date = new Date()): string {
  const today = todayKST(now);
  return addDays(today, -dayOfWeek(today));
}

/** 임의 날짜 → 그 주 일요일(직전 또는 당일) */
export function toSunday(dateStr: string): string {
  return addDays(dateStr, -dayOfWeek(dateStr));
}

export function isSunday(dateStr: string): boolean {
  return dayOfWeek(dateStr) === 0;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 2026-09-06 → "2026년 9월 6일 (일)" */
export function formatKoreanDate(dateStr: string, opts: { year?: boolean } = { year: true }): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const w = WEEKDAYS[dayOfWeek(dateStr)];
  return opts.year ? `${y}년 ${m}월 ${d}일 (${w})` : `${m}월 ${d}일 (${w})`;
}

/** 2026-09-06 → "9월 6일" */
export function formatShortDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-").map(Number);
  return `${m}월 ${d}일`;
}

/**
 * ISO timestamp → "9월 6일 오후 2:30" (KST)
 * Intl 을 쓰지 않고 직접 계산 — 서버(Node)와 브라우저의 로케일 출력이 달라
 * 생기는 하이드레이션 불일치를 막는다.
 */
export function formatDateTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const k = new Date(t + KST_OFFSET_MS);
  const m = k.getUTCMonth() + 1;
  const d = k.getUTCDate();
  const h24 = k.getUTCHours();
  const min = String(k.getUTCMinutes()).padStart(2, "0");
  const ampm = h24 < 12 ? "오전" : "오후";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${m}월 ${d}일 ${ampm} ${h12}:${min}`;
}

/** 최근 N개의 일요일 목록 (최신 → 과거) */
export function recentSundays(count: number, from: string = currentReportSunday()): string[] {
  const start = toSunday(from);
  return Array.from({ length: count }, (_, i) => addDays(start, -7 * i));
}

/** 이번 달 1일 / 말일 (KST) */
export function monthRange(dateStr: string = todayKST()): { start: string; end: string } {
  const [y, m] = dateStr.split("-").map(Number);
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { start, end: `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}` };
}

export function yearRange(dateStr: string = todayKST()): { start: string; end: string } {
  const y = dateStr.slice(0, 4);
  return { start: `${y}-01-01`, end: `${y}-12-31` };
}
