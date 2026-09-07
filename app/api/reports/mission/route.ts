import { NextResponse } from "next/server";
import { requireApi, jsonError } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { missionReportSchema, firstIssue } from "@/lib/validation";
import { isSunday, todayKST, addDays } from "@/lib/dates";
import { aggregateSunReports } from "@/lib/report-utils";
import { notify, pastorIds } from "@/lib/notify";
import { createKeywordAlert } from "@/lib/alerts";
import { getMissionName, BRIDGE_MISSION_ID } from "@/lib/constants/sun-directory";

/**
 * 선교회보고서 저장(임시저장/제출)
 * - 집계값(순 수·참석·성경)은 서버에서 순보고서로부터 다시 계산 (클라이언트 값 무시)
 * - 같은 선교회·같은 주일은 하나만
 */
export async function POST(request: Request) {
  const { session, error } = await requireApi(["mission_leader"]);
  if (error) return error;
  const { profile, userId } = session;
  const missionId = profile.mission_id;
  if (!missionId || missionId === BRIDGE_MISSION_ID) return jsonError("선교회 정보가 올바르지 않아요. 담임목사님께 문의해 주세요", 400);

  const parsed = missionReportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(firstIssue(parsed.error));
  const input = parsed.data;
  if (!isSunday(input.report_date)) return jsonError("보고 날짜는 주일(일요일)이어야 해요");
  if (input.report_date > addDays(todayKST(), 7)) return jsonError("너무 먼 미래 날짜예요");

  const admin = createAdminClient();

  let targetId: string | null = null;
  if (input.reportId) {
    const { data: existing } = await admin.from("mission_reports").select("id, mission_id, report_date, status").eq("id", input.reportId).maybeSingle();
    if (!existing) return jsonError("보고서를 찾을 수 없어요", 404);
    if (existing.mission_id !== missionId) return jsonError("다른 선교회 보고서는 수정할 수 없어요", 403);
    if (existing.report_date !== input.report_date) return jsonError("저장된 보고서의 날짜는 바꿀 수 없어요");
    targetId = existing.id;
  } else {
    const { data: dup } = await admin.from("mission_reports").select("id").eq("mission_id", missionId).eq("report_date", input.report_date).maybeSingle();
    if (dup) targetId = dup.id;
  }

  // 순보고서 집계 (제출된 것만)
  const { data: sunReports } = await admin
    .from("sun_reports")
    .select("status, attend_total, bible_chapters, offering")
    .eq("mission_id", missionId)
    .eq("report_date", input.report_date);
  const agg = aggregateSunReports(sunReports ?? []);

  const payload = {
    mission_id: missionId,
    report_date: input.report_date,
    mission_leader: profile.name,
    total_sun: agg.total_sun,
    total_attend: agg.total_attend,
    total_bible: agg.total_bible,
    total_offering: input.total_offering ?? agg.total_offering,
    special_note: input.special_note || null,
    status: input.status,
    submitted_at: input.status === "submitted" ? new Date().toISOString() : null,
    created_by: userId,
  };

  let reportId = targetId;
  if (reportId) {
    const { error: e } = await admin.from("mission_reports").update(payload).eq("id", reportId);
    if (e) return jsonError("저장 실패: " + e.message, 500);
  } else {
    const { data, error: e } = await admin.from("mission_reports").insert(payload).select("id").single();
    if (e || !data) return jsonError("저장 실패: " + (e?.message ?? ""), 500);
    reportId = data.id;
  }

  // 특별보고 항목 교체 — 담임목사가 남긴 진행상황/메모는 같은 내용이면 유지
  const { data: prevItems } = await admin.from("special_report_items").select("category, content, status, pastor_memo").eq("mission_report_id", reportId);
  const prevMap = new Map((prevItems ?? []).map((p) => [`${p.category}::${p.content}`, p]));
  const { error: delErr } = await admin.from("special_report_items").delete().eq("mission_report_id", reportId);
  if (delErr) return jsonError("특별보고 저장 실패: " + delErr.message, 500);
  if (input.special_items.length > 0) {
    const { error: e } = await admin.from("special_report_items").insert(
      input.special_items.map((it) => {
        const prev = prevMap.get(`${it.category}::${it.content}`);
        return {
          mission_report_id: reportId,
          mission_id: missionId,
          report_date: input.report_date,
          mission_leader: profile.name,
          category: it.category,
          content: it.content,
          status: prev?.status ?? "기도중",
          pastor_memo: prev?.pastor_memo ?? null,
        };
      })
    );
    if (e) return jsonError("특별보고 저장 실패: " + e.message, 500);
  }

  if (input.status === "submitted") {
    const pastors = await pastorIds(admin);
    await notify(admin, {
      userIds: pastors,
      kind: "report",
      title: `${getMissionName(missionId)} 보고서 도착`,
      body: `${profile.name} 선교회장님이 ${input.report_date} 선교회보고서를 제출했어요. (순 ${agg.total_sun}개 · 주일낮 ${agg.total_attend}명)`,
      link: `/report/mission/${reportId}`,
    });
    let alerted = false;
    for (const it of input.special_items) {
      const hit = await createKeywordAlert(admin, {
        reportId,
        missionId,
        missionLeader: profile.name,
        text: `[${it.category}] ${it.content}`,
        reportDate: input.report_date,
      });
      alerted = alerted || hit;
    }
    if (alerted) {
      await notify(admin, {
        userIds: pastors,
        kind: "info",
        title: `목양 알림 · ${getMissionName(missionId)}`,
        body: "선교회 특별보고에 긴급 소식이 있어요. 목양 알림에서 확인해 주세요.",
        link: "/admin/alerts",
      });
    }
  }

  return NextResponse.json({ id: reportId, status: input.status });
}
