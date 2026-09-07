import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApi, jsonError } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ ids: z.array(z.string().uuid()).max(500).optional(), all: z.boolean().optional() });

/** 목양 알림 읽음 처리 */
export async function PATCH(request: Request) {
  const { error } = await requireApi(["pastor"]);
  if (error) return error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("잘못된 요청");
  const admin = createAdminClient();
  let q = admin.from("pastoral_alerts").update({ is_read: true, read_at: new Date().toISOString() }).eq("is_read", false);
  if (!parsed.data.all) {
    if (!parsed.data.ids?.length) return NextResponse.json({ ok: true });
    q = q.in("id", parsed.data.ids);
  }
  const { error: e } = await q;
  if (e) return jsonError(e.message, 500);
  return NextResponse.json({ ok: true });
}
