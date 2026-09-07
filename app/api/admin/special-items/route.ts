import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApi, jsonError } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { SPECIAL_STATUSES } from "@/types/database";
import { notify, missionLeaderIds } from "@/lib/notify";

const schema = z.object({
  id: z.string().uuid(),
  status: z.enum(SPECIAL_STATUSES),
  pastor_memo: z.string().trim().max(1000).nullable().optional(),
});

/** 담임목사: 특별보고 항목 진행상황·메모 저장 */
export async function PATCH(request: Request) {
  const { error } = await requireApi(["pastor"]);
  if (error) return error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("입력값을 확인해 주세요");
  const { id, status, pastor_memo } = parsed.data;

  const admin = createAdminClient();
  const { data: prev } = await admin.from("special_report_items").select("id, mission_id, status, category, content").eq("id", id).maybeSingle();
  if (!prev) return jsonError("항목을 찾을 수 없어요", 404);

  const { error: e } = await admin.from("special_report_items").update({ status, pastor_memo: pastor_memo || null }).eq("id", id);
  if (e) return jsonError(e.message, 500);

  if (prev.status !== status) {
    await notify(admin, {
      userIds: await missionLeaderIds(admin, prev.mission_id),
      kind: "info",
      title: `특별보고 진행상황: ${status}`,
      body: `[${prev.category}] ${String(prev.content).slice(0, 60)} → ${status}`,
      link: "/dashboard/mission-leader",
    });
  }
  return NextResponse.json({ ok: true });
}
