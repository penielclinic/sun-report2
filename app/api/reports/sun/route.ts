import { NextResponse } from "next/server";
import { requireApi, jsonError } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { sunReportSchema, firstIssue } from "@/lib/validation";
import { isSunday, todayKST, addDays } from "@/lib/dates";
import { getSunEntry } from "@/lib/constants/sun-directory";
import { notify, missionLeaderIds, pastorIds } from "@/lib/notify";
import { createKeywordAlert } from "@/lib/alerts";

/**
 * 순보고서 저장(임시저장/제출). 신규·수정 모두 처리.
 * - 순 번호·선교회는 프로필에서 강제 (클라이언트 값 무시)
 * - 같은 순·같은 주일 보고서는 하나만 (있으면 그 보고서를 갱신)
 * - 선교회보고서가 이미 제출된 주는 수정 불가
 */
export async function POST(request: Request) {
  const { session, error } = await requireApi(["sun_leader"]);
  if (error) return error;
  const { profile, userId } = session;

  const entry = profile.sun_number ? getSunEntry(profile.sun_number) : undefined;
  if (!entry) return jsonError("담당 순이 설정되지 않았어요. 담임목사님께 문의해 주세요", 400);

  const parsed = sunReportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(firstIssue(parsed.error));
  const input = parsed.data;

  if (!isSunday(input.report_date)) return jsonError("보고 날짜는 주일(일요일)이어야 해요");
  if (input.report_date > addDays(todayKST(), 7)) return jsonError("너무 먼 미래 날짜예요");

  const admin = createAdminClient();

  // 해당 주 선교회보고서가 제출되었으면 잠금
  const { data: mr } = await admin
    .from("mission_reports")
    .select("status")
    .eq("mission_id", entry.missionId)
    .eq("report_date", input.report_date)
    .maybeSingle();
  if (mr?.status === "submitted") {
    return jsonError("선교회장님이 이 주 선교회보고서를 이미 제출해서 수정할 수 없어요. 선교회장님께 문의해 주세요", 409);
  }

  // 대상 보고서 결정 (id 로 지정되었거나, 같은 순·같은 날짜 기존 보고서)
  let targetId: string | null = null;
  if (input.reportId) {
    const { data: existing } = await admin
      .from("sun_reports")
      .select("id, sun_number, created_by, report_date")
      .eq("id", input.reportId)
      .maybeSingle();
    if (!existing) return jsonError("보고서를 찾을 수 없어요", 404);
    if (existing.sun_number !== entry.sunNumber) return jsonError("다른 순의 보고서는 수정할 수 없어요", 403);
    if (existing.report_date !== input.report_date) return jsonError("저장된 보고서의 날짜는 바꿀 수 없어요", 400);
    targetId = existing.id;
  } else {
    const { data: dup } = await admin
      .from("sun_reports")
      .select("id")
      .eq("sun_number", entry.sunNumber)
      .eq("report_date", input.report_date)
      .maybeSingle();
    if (dup) targetId = dup.id;
  }

  const members = input.members
    .filter((m) => m.member_name.trim())
    .map((m, i) => ({ ...m, member_name: m.member_name.trim().slice(0, 30), sort_order: i }));

  const attendTotal = members.filter((m) => m.attend_sun_day).length;
  const autoBible = members.reduce((s, m) => s + (m.bible_read || 0), 0);
  const bibleChapters = input.bible_chapters != null && input.bible_chapters > 0 ? input.bible_chapters : autoBible;

  const worshipAt =
    input.worship_date && input.worship_time ? `${input.worship_date} ${input.worship_time}` : input.worship_date || null;

  const payload = {
    sun_number: entry.sunNumber,
    sun_leader: profile.name,
    mission_id: entry.missionId,
    report_date: input.report_date,
    worship_at: worshipAt,
    worship_place: input.worship_place || null,
    worship_leader: input.worship_leader || null,
    attend_total: attendTotal,
    bible_chapters: bibleChapters,
    offering: input.offering ?? 0,
    special_note: input.special_note || null,
    status: input.status,
    submitted_at: input.status === "submitted" ? new Date().toISOString() : null,
    created_by: userId,
  };

  let reportId = targetId;
  if (reportId) {
    const { error: updErr } = await admin.from("sun_reports").update(payload).eq("id", reportId);
    if (updErr) return jsonError("저장 실패: " + updErr.message, 500);
  } else {
    const { data, error: insErr } = await admin.from("sun_reports").insert(payload).select("id").single();
    if (insErr || !data) return jsonError("저장 실패: " + (insErr?.message ?? ""), 500);
    reportId = data.id;
  }

  // 순원 목록 교체
  const { error: delErr } = await admin.from("sun_report_members").delete().eq("report_id", reportId);
  if (delErr) return jsonError("순원 저장 실패: " + delErr.message, 500);
  if (members.length > 0) {
    const { error: memErr } = await admin.from("sun_report_members").insert(
      members.map((m) => ({
        report_id: reportId,
        sort_order: m.sort_order,
        member_name: m.member_name,
        attend_samil: m.attend_samil,
        attend_friday: m.attend_friday,
        attend_sun_day: m.attend_sun_day,
        attend_sun_eve: m.attend_sun_eve,
        attend_sun: m.attend_sun,
        evangelism: m.evangelism,
        bulletin_recv: m.bulletin_recv,
        bible_read: m.bible_read || 0,
        member_note: m.member_note?.trim() || null,
      }))
    );
    if (memErr) return jsonError("순원 저장 실패: " + memErr.message, 500);
  }

  if (input.status === "submitted") {
    const leaders = await missionLeaderIds(admin, entry.missionId);
    await notify(admin, {
      userIds: leaders,
      kind: "report",
      title: `${entry.sunNumber}순 보고서 도착`,
      body: `${profile.name} 순장님이 ${input.report_date} 순보고서를 제출했어요. (주일낮 ${attendTotal}명)`,
      link: `/report/sun/${reportId}`,
    });

    if (input.special_note) {
      const alerted = await createKeywordAlert(admin, {
        reportId,
        sunNumber: entry.sunNumber,
        sunLeader: profile.name,
        missionId: entry.missionId,
        text: input.special_note,
        reportDate: input.report_date,
      });
      if (alerted) {
        await notify(admin, {
          userIds: await pastorIds(admin),
          kind: "info",
          title: `목양 알림 · ${entry.sunNumber}순`,
          body: `특별보고에 긴급 소식이 있어요: ${input.special_note.slice(0, 80)}`,
          link: "/admin/alerts",
        });
      }
    }
  }

  return NextResponse.json({ id: reportId, status: input.status });
}
