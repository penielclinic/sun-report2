import { NextResponse } from "next/server";
import { requireApi, jsonError } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncMissionReportAfterSunChange } from "@/lib/mission-sync";
import { isOpenReportWeek } from "@/lib/dates";

/** 순보고서 삭제 — 본인 순 보고서(순장) 또는 담임목사. 삭제 후 선교회보고서 합계 자동 재계산 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, error } = await requireApi(["sun_leader", "pastor"]);
  if (error) return error;

  const admin = createAdminClient();
  const { data: report } = await admin
    .from("sun_reports")
    .select("id, sun_number, sun_leader, mission_id, report_date, created_by")
    .eq("id", id)
    .maybeSingle();
  if (!report) return jsonError("보고서를 찾을 수 없어요", 404);

  if (session.profile.role === "sun_leader") {
    if (report.sun_number !== session.profile.sun_number) return jsonError("다른 순의 보고서는 삭제할 수 없어요", 403);
    // 마감된 주일 보고서는 담임목사만 지울 수 있다
    if (!isOpenReportWeek(report.report_date)) {
      return jsonError("보고 기간이 끝난 보고서는 지울 수 없어요. 담임목사님께 요청해 주세요", 409);
    }
  }

  const { error: delErr } = await admin.from("sun_reports").delete().eq("id", id);
  if (delErr) return jsonError(delErr.message, 500);

  await syncMissionReportAfterSunChange(admin, {
    missionId: report.mission_id,
    reportDate: report.report_date,
    sunNumber: report.sun_number,
    sunLeader: report.sun_leader,
    action: "deleted",
  });
  return NextResponse.json({ ok: true });
}
