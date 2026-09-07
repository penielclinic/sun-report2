import { NextResponse } from "next/server";
import { requireApi, jsonError } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

/** 선교회보고서 삭제 — 선교회장(본인 선교회, 임시저장만) 또는 담임목사 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, error } = await requireApi(["mission_leader", "pastor"]);
  if (error) return error;

  const admin = createAdminClient();
  const { data: report } = await admin.from("mission_reports").select("id, mission_id, status").eq("id", id).maybeSingle();
  if (!report) return jsonError("보고서를 찾을 수 없어요", 404);

  if (session.profile.role === "mission_leader") {
    if (report.mission_id !== session.profile.mission_id) return jsonError("다른 선교회 보고서는 삭제할 수 없어요", 403);
    if (report.status === "submitted") return jsonError("이미 담임목사님께 제출된 보고서는 삭제할 수 없어요. 담임목사님께 요청해 주세요", 409);
  }

  const { error: e } = await admin.from("mission_reports").delete().eq("id", id);
  if (e) return jsonError(e.message, 500);
  return NextResponse.json({ ok: true });
}
