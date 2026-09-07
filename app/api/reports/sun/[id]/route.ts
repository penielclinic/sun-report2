import { NextResponse } from "next/server";
import { requireApi, jsonError } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

/** 순보고서 삭제 — 본인 순 보고서(순장) 또는 담임목사. 선교회보고서 제출 후엔 불가 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, error } = await requireApi(["sun_leader", "pastor"]);
  if (error) return error;

  const admin = createAdminClient();
  const { data: report } = await admin
    .from("sun_reports")
    .select("id, sun_number, mission_id, report_date, created_by")
    .eq("id", id)
    .maybeSingle();
  if (!report) return jsonError("보고서를 찾을 수 없어요", 404);

  if (session.profile.role === "sun_leader" && report.sun_number !== session.profile.sun_number) {
    return jsonError("다른 순의 보고서는 삭제할 수 없어요", 403);
  }

  if (session.profile.role !== "pastor") {
    const { data: mr } = await admin
      .from("mission_reports")
      .select("status")
      .eq("mission_id", report.mission_id)
      .eq("report_date", report.report_date)
      .maybeSingle();
    if (mr?.status === "submitted") return jsonError("선교회보고서가 이미 제출되어 삭제할 수 없어요", 409);
  }

  const { error: delErr } = await admin.from("sun_reports").delete().eq("id", id);
  if (delErr) return jsonError(delErr.message, 500);
  return NextResponse.json({ ok: true });
}
