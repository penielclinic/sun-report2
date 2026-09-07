import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

/** 목양 알림 키워드 사전 — 특별보고에 이 단어가 포함되면 담임목사에게 알림 */
export const URGENT_KEYWORDS: Record<string, string[]> = {
  건강: ["수술", "입원", "응급", "암", "중환자", "사고", "골절", "투병", "병원", "항암", "위독"],
  가정: ["사망", "별세", "소천", "장례", "이혼", "가출"],
  경제: ["실직", "파산", "폐업", "퇴직", "부도"],
  신앙: ["방황", "교회 떠나", "이단", "낙심"],
};

export const JOY_KEYWORDS = ["출산", "임신", "결혼", "약혼", "취업", "합격", "졸업", "승진", "회복", "퇴원", "세례"];

export function detectUrgent(text: string): { category: string; keyword: string } | null {
  for (const [category, words] of Object.entries(URGENT_KEYWORDS)) {
    for (const keyword of words) if (text.includes(keyword)) return { category, keyword };
  }
  return null;
}

export function detectJoy(text: string): string | null {
  return JOY_KEYWORDS.find((k) => text.includes(k)) ?? null;
}

interface KeywordAlertInput {
  reportId?: string | null;
  sunNumber?: number | null;
  sunLeader?: string | null;
  missionId?: number | null;
  missionLeader?: string | null;
  text: string;
  reportDate: string;
}

/** 순보고·선교회보고 특별보고에서 긴급 키워드 감지 → pastoral_alerts 기록 */
export async function createKeywordAlert(admin: Admin, input: KeywordAlertInput): Promise<boolean> {
  const text = input.text?.trim();
  if (!text) return false;
  const hit = detectUrgent(text);
  if (!hit) return false;

  const scope = input.sunNumber ? `sun:${input.sunNumber}` : `mission:${input.missionId}`;
  const dedupKey = `keyword:${scope}:${hit.keyword}:${input.reportDate}`;

  const { error } = await admin.from("pastoral_alerts").insert({
    alert_type: "keyword",
    sun_number: input.sunNumber ?? null,
    sun_leader: input.sunLeader ?? null,
    mission_id: input.missionId ?? null,
    mission_leader: input.missionLeader ?? null,
    triggered_by: `${hit.category}·${hit.keyword}`,
    source_text: text.slice(0, 1000),
    source_report_id: input.reportId ?? null,
    dedup_key: dedupKey,
  });
  // unique 위반(중복)은 정상 상황
  if (error && !error.message.includes("duplicate")) console.error("[alerts]", error.message);
  return !error;
}
