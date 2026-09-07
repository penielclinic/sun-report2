import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApi, jsonError } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notify";

const schema = z.object({
  title: z.string().trim().min(1, "제목을 입력해 주세요").max(100),
  body: z.string().trim().min(1, "내용을 입력해 주세요").max(2000),
  targetIds: z.array(z.string().uuid()).min(1, "받는 사람을 선택해 주세요").max(500),
});

/** 담임목사 → 순장·선교회장 앱 내 메시지 */
export async function POST(request: Request) {
  const { session, error } = await requireApi(["pastor"]);
  if (error) return error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요");

  const admin = createAdminClient();
  const { data: valid } = await admin.from("profiles").select("id").in("id", parsed.data.targetIds).eq("status", "active");
  const ids = (valid ?? []).map((v) => v.id as string);
  await notify(admin, { userIds: ids, kind: "message", title: `📣 ${parsed.data.title}`, body: `${parsed.data.body}\n\n— ${session.profile.name} 목사`, link: "/notifications" });
  return NextResponse.json({ ok: true, sent: ids.length });
}
