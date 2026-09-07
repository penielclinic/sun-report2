import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApi } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { loginIdToEmail, validatePin, normalizePhone } from "@/lib/auth/login-id";
import { pinToPassword } from "@/lib/auth/pin.server";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  current_pin: z.string().regex(/^\d{4,8}$/),
  new_pin: z.string().regex(/^\d{4,8}$/),
});

/** 본인 비밀번호(PIN) 변경 */
export async function POST(request: Request) {
  const { session, error } = await requireApi();
  if (error) return error;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "비밀번호는 숫자 4~8자리예요" }, { status: 400 });
  const { current_pin, new_pin } = parsed.data;
  const pinErr = validatePin(new_pin);
  if (pinErr) return NextResponse.json({ error: pinErr }, { status: 400 });

  const email = loginIdToEmail(session.profile.login_id);

  // 현재 비밀번호 검증 (세션 쿠키를 건드리지 않는 별도 클라이언트)
  const verifier = createPlainClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: verifyErr } = await verifier.auth.signInWithPassword({ email, password: pinToPassword(email, current_pin) });
  if (verifyErr) return NextResponse.json({ error: "현재 비밀번호가 맞지 않아요" }, { status: 400 });

  const admin = createAdminClient();
  const { error: updErr } = await admin.auth.admin.updateUserById(session.userId, { password: pinToPassword(email, new_pin) });
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

  // 비밀번호가 바뀌면 기존 세션은 무효화되므로 깔끔하게 로그아웃 → 새 비밀번호로 다시 로그인
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true, relogin: true });
}

const phoneSchema = z.object({ phone: z.string().trim().max(20) });

/** 본인 전화번호 수정 */
export async function PATCH(request: Request) {
  const { session, error } = await requireApi();
  if (error) return error;
  const parsed = phoneSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "전화번호를 확인해 주세요" }, { status: 400 });

  const admin = createAdminClient();
  const { error: updErr } = await admin.from("profiles").update({ phone: normalizePhone(parsed.data.phone) }).eq("id", session.userId);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
