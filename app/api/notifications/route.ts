import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApi, jsonError } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

const patchSchema = z.object({ ids: z.array(z.string().uuid()).max(500).optional(), all: z.boolean().optional() });
const delSchema = z.object({ id: z.string().uuid().optional(), all: z.boolean().optional() });

/** 읽음 처리 (일부 또는 전체) */
export async function PATCH(request: Request) {
  const { session, error } = await requireApi();
  if (error) return error;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("잘못된 요청");

  const admin = createAdminClient();
  let q = admin.from("notifications").update({ read: true }).eq("user_id", session.userId).eq("read", false);
  if (!parsed.data.all) {
    if (!parsed.data.ids?.length) return NextResponse.json({ ok: true });
    q = q.in("id", parsed.data.ids);
  }
  const { error: e } = await q;
  if (e) return jsonError(e.message, 500);
  return NextResponse.json({ ok: true });
}

/** 삭제 (하나 또는 읽은 것 전체) */
export async function DELETE(request: Request) {
  const { session, error } = await requireApi();
  if (error) return error;
  const parsed = delSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("잘못된 요청");

  const admin = createAdminClient();
  let q = admin.from("notifications").delete().eq("user_id", session.userId);
  if (parsed.data.all) q = q.eq("read", true);
  else if (parsed.data.id) q = q.eq("id", parsed.data.id);
  else return jsonError("잘못된 요청");
  const { error: e } = await q;
  if (e) return jsonError(e.message, 500);
  return NextResponse.json({ ok: true });
}
