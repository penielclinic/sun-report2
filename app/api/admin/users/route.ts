import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApi, jsonError } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { loginIdToEmail, normalizePhone, validatePin } from "@/lib/auth/login-id";
import { pinToPassword } from "@/lib/auth/pin.server";
import { roleSchema } from "@/lib/validation";
import { getSunEntry, isValidMissionId } from "@/lib/constants/sun-directory";
import { notify } from "@/lib/notify";

const patchSchema = z.object({
  userId: z.string().uuid(),
  updates: z.object({
    status: z.enum(["pending", "active", "rejected"]).optional(),
    role: roleSchema.optional(),
    sun_number: z.coerce.number().int().min(1).max(45).nullable().optional(),
    mission_id: z.coerce.number().int().min(1).max(13).nullable().optional(),
    name: z.string().trim().min(1).max(20).optional(),
    phone: z.string().trim().max(20).nullable().optional(),
  }),
});

/** 승인/거절/역할·소속·이름·전화 수정 */
export async function PATCH(request: Request) {
  const { session, error } = await requireApi(["pastor"]);
  if (error) return error;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("입력값을 확인해 주세요");
  const { userId, updates } = parsed.data;

  const admin = createAdminClient();
  const { data: target } = await admin.from("profiles").select("id, role, status, name").eq("id", userId).maybeSingle();
  if (!target) return jsonError("사용자를 찾을 수 없어요", 404);

  const patch: Record<string, unknown> = {};
  if (updates.status) {
    if (userId === session.userId && updates.status !== "active") return jsonError("본인 계정은 비활성화할 수 없어요");
    patch.status = updates.status;
  }
  if (updates.name) patch.name = updates.name;
  if (updates.phone !== undefined) patch.phone = normalizePhone(updates.phone);

  const role = updates.role ?? target.role;
  if (updates.role || updates.sun_number !== undefined || updates.mission_id !== undefined) {
    if (userId === session.userId && role !== "pastor") return jsonError("본인 역할은 바꿀 수 없어요");
    patch.role = role;
    if (role === "sun_leader") {
      const entry = updates.sun_number ? getSunEntry(updates.sun_number) : undefined;
      if (!entry) return jsonError("담당 순을 선택해 주세요");
      patch.sun_number = entry.sunNumber;
      patch.mission_id = entry.missionId;
    } else if (role === "mission_leader") {
      if (!updates.mission_id || !isValidMissionId(updates.mission_id)) return jsonError("소속 선교회를 선택해 주세요");
      patch.sun_number = null;
      patch.mission_id = updates.mission_id;
    } else {
      patch.sun_number = null;
      patch.mission_id = null;
    }
  }

  const { error: e } = await admin.from("profiles").update(patch).eq("id", userId);
  if (e) return jsonError(e.message, 500);

  if (updates.status === "active" && target.status !== "active") {
    await notify(admin, { userIds: [userId], kind: "info", title: "가입이 승인되었어요", body: `${target.name}님, 이제 순보고 앱을 사용할 수 있어요.`, link: "/dashboard" });
  }
  return NextResponse.json({ ok: true });
}

const putSchema = z.object({ userId: z.string().uuid(), pin: z.string().regex(/^\d{4,8}$/) });

/** 비밀번호(PIN) 초기화 */
export async function PUT(request: Request) {
  const { error } = await requireApi(["pastor"]);
  if (error) return error;
  const parsed = putSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("비밀번호는 숫자 4~8자리예요");
  const pinErr = validatePin(parsed.data.pin);
  if (pinErr) return jsonError(pinErr);

  const admin = createAdminClient();
  const { data: target } = await admin.from("profiles").select("login_id").eq("id", parsed.data.userId).maybeSingle();
  if (!target) return jsonError("사용자를 찾을 수 없어요", 404);
  const email = loginIdToEmail(target.login_id);
  const { error: e } = await admin.auth.admin.updateUserById(parsed.data.userId, { password: pinToPassword(email, parsed.data.pin) });
  if (e) return jsonError(e.message, 500);
  return NextResponse.json({ ok: true });
}

const delSchema = z.object({ userId: z.string().uuid() });

/** 계정 삭제 (보고서는 남기고 계정만 삭제하지 않음 — FK cascade 로 함께 삭제되므로 경고 필요) */
export async function DELETE(request: Request) {
  const { session, error } = await requireApi(["pastor"]);
  if (error) return error;
  const parsed = delSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("잘못된 요청");
  if (parsed.data.userId === session.userId) return jsonError("본인 계정은 삭제할 수 없어요");

  const admin = createAdminClient();
  // 보고서는 보존: created_by 를 담임목사(삭제 요청자)로 이관
  await admin.from("sun_reports").update({ created_by: session.userId }).eq("created_by", parsed.data.userId);
  await admin.from("mission_reports").update({ created_by: session.userId }).eq("created_by", parsed.data.userId);
  const { error: e } = await admin.auth.admin.deleteUser(parsed.data.userId);
  if (e) return jsonError(e.message, 500);
  return NextResponse.json({ ok: true });
}
