import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { countAttendance } from "@/lib/report-utils";
import { detectJoy, detectUrgent } from "@/lib/alerts";
import { getMissionName, SUN_COUNT } from "@/lib/constants/sun-directory";
import { formatKoreanDate, addDays } from "@/lib/dates";
import type { AttendKey } from "@/types/database";

export function briefingEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** 해당 주일 보고서를 집계해 브리핑 원본 데이터 생성 */
export async function collectWeekStats(sunday: string) {
  const admin = createAdminClient();
  const prev = addDays(sunday, -7);

  const [{ data: reports }, { data: prevReports }, { data: missionReports }, { data: items }] = await Promise.all([
    admin.from("sun_reports").select("id, sun_number, sun_leader, mission_id, attend_total, bible_chapters, special_note, status").eq("report_date", sunday).eq("status", "submitted"),
    admin.from("sun_reports").select("attend_total, bible_chapters").eq("report_date", prev).eq("status", "submitted"),
    admin.from("mission_reports").select("mission_id, mission_leader, total_offering, special_note").eq("report_date", sunday).eq("status", "submitted"),
    admin.from("special_report_items").select("mission_id, category, content, status").eq("report_date", sunday),
  ]);
  const rep = reports ?? [];
  const ids = rep.map((r) => r.id);
  type M = Record<AttendKey, boolean> & { member_name: string; member_note: string | null; report_id: string };
  let members: M[] = [];
  if (ids.length) {
    const { data } = await admin.from("sun_report_members").select("member_name, member_note, report_id, attend_samil, attend_friday, attend_sun_day, attend_sun_eve, attend_sun, evangelism").in("report_id", ids);
    members = (data ?? []) as M[];
  }
  const counts = countAttendance(members);
  const sunById = new Map(rep.map((r) => [r.id, r]));

  const notes = rep
    .filter((r) => r.special_note?.trim())
    .map((r) => ({ where: `${r.sun_number}순 ${r.sun_leader}`, text: r.special_note as string, urgent: detectUrgent(r.special_note as string)?.keyword ?? null, joy: detectJoy(r.special_note as string) }));
  const memberNotes = members
    .filter((m) => m.member_note?.trim())
    .map((m) => {
      const r = sunById.get(m.report_id);
      return { where: `${r?.sun_number}순 ${m.member_name}`, text: m.member_note as string, urgent: detectUrgent(m.member_note as string)?.keyword ?? null, joy: detectJoy(m.member_note as string) };
    });
  const specials = (items ?? []).map((i) => ({ where: getMissionName(i.mission_id), category: i.category, text: i.content, status: i.status }));

  const prevAttend = (prevReports ?? []).reduce((s, r) => s + r.attend_total, 0);
  return {
    sunday,
    label: formatKoreanDate(sunday),
    submitted: rep.length,
    total: SUN_COUNT,
    attend: counts,
    attendTotal: rep.reduce((s, r) => s + r.attend_total, 0),
    prevAttendTotal: prevAttend,
    bible: rep.reduce((s, r) => s + r.bible_chapters, 0),
    offering: (missionReports ?? []).reduce((s, r) => s + r.total_offering, 0),
    missionNotes: (missionReports ?? []).filter((m) => m.special_note?.trim()).map((m) => ({ where: `${getMissionName(m.mission_id)} ${m.mission_leader ?? ""}`, text: m.special_note as string })),
    notes,
    memberNotes,
    specials,
    missingSuns: SUN_COUNT - rep.length,
  };
}

export type WeekStats = Awaited<ReturnType<typeof collectWeekStats>>;

const SYSTEM = `당신은 한국 교회 담임목사를 돕는 목회 비서입니다. 주간 순보고서 집계를 바탕으로 담임목사가 5분 안에 읽을 수 있는 "주간 목회 브리핑"을 한국어로 작성합니다.
원칙:
- 존댓말, 따뜻하고 간결하게. 과장하거나 없는 사실을 만들지 마세요. 숫자는 주어진 것만 사용합니다.
- 구성: 1) 한 줄 요약 2) 이번 주 숫자 (참석·성경·헌금·제출률, 지난주 대비) 3) 긴급 돌봄 필요 (수술·입원·소천 등, 이름과 순 명시) 4) 기쁜 소식 5) 기도제목 정리 6) 이번 주 권면 한 문장
- 마크다운 제목(##)과 글머리표를 사용하고 전체 600자 내외로 씁니다.`;

/** Claude 로 브리핑 생성 → pastoral_briefings 저장 */
export async function generateBriefing(sunday: string) {
  if (!briefingEnabled()) throw new Error("ANTHROPIC_API_KEY 가 설정되지 않아 AI 브리핑을 만들 수 없어요");
  const stats = await collectWeekStats(sunday);
  const client = new Anthropic();

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 4000,
    system: SYSTEM,
    messages: [{ role: "user", content: `다음은 ${stats.label} 주일 보고 집계입니다. 브리핑을 작성해 주세요.\n\n${JSON.stringify(stats, null, 2)}` }],
  });

  if (response.stop_reason === "refusal") throw new Error("브리핑 생성이 거절되었어요. 잠시 후 다시 시도해 주세요");
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  if (!text) throw new Error("브리핑 내용을 받지 못했어요");

  const care = [...stats.notes, ...stats.memberNotes].filter((n) => n.urgent).map((n) => ({ where: n.where, reason: n.urgent, text: n.text }));
  const joy = [...stats.notes, ...stats.memberNotes].filter((n) => n.joy).map((n) => ({ where: n.where, keyword: n.joy, text: n.text }));

  const admin = createAdminClient();
  const { error } = await admin.from("pastoral_briefings").upsert(
    { week_of: sunday, raw_stats: stats, briefing_text: text, care_members: care, joy_news: joy, generated_at: new Date().toISOString() },
    { onConflict: "week_of" }
  );
  if (error) throw new Error("브리핑 저장 실패: " + error.message);
  return { text, care, joy };
}
