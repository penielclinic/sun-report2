import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApi, jsonError } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateSchema } from "@/lib/validation";

const schema = z.object({ date: dateSchema, missionId: z.coerce.number().int().min(1).max(13).optional() });

/** 담임목사: 특정 주일(선택: 특정 선교회)의 순보고서·선교회보고서 전체 삭제 */
export async function DELETE(request: Request) {
  const { error } = await requireApi(["pastor"]);
  if (error) return error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("잘못된 요청");
  const { date, missionId } = parsed.data;

  const admin = createAdminClient();
  let sq = admin.from("sun_reports").delete().eq("report_date", date);
  if (missionId) sq = sq.eq("mission_id", missionId);
  const { error: e1 } = await sq;
  if (e1) return jsonError(e1.message, 500);

  let mq = admin.from("mission_reports").delete().eq("report_date", date);
  if (missionId) mq = mq.eq("mission_id", missionId);
  const { error: e2 } = await mq;
  if (e2) return jsonError(e2.message, 500);

  return NextResponse.json({ ok: true });
}
