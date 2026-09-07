import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { loginIdToEmail, normalizeLoginId, normalizePhone, validatePin } from "@/lib/auth/login-id";
import { pinToPassword } from "@/lib/auth/pin.server";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { notify, pastorIds } from "@/lib/notify";
import { ROLE_LABEL, type Role } from "@/types/database";

const schema = z.object({
  login_id: z.string().trim().min(1).max(20),
  phone: z.string().trim().min(9).max(20),
  new_pin: z.string().regex(/^\d{4,8}$/),
});

const GENERIC = "이름과 전화번호가 등록된 정보와 맞지 않아요. 담임목사님께 초기화를 부탁해 주세요";

/**
 * 비밀번호(PIN) 잊었을 때 본인 재설정.
 * 이름(아이디) + 가입 때 등록한 전화번호가 모두 맞아야 하며, 전화번호가 등록되지 않은 계정은 불가.
 * 성공 시 본인과 담임목사에게 알림을 남겨 무단 변경을 알아차릴 수 있게 한다.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!rateLimit(`reset:${ip}`, 8, 60 * 60 * 1000).ok) {
    return NextResponse.json({ error: "시도가 너무 많아요. 1시간 후 다시 시도해 주세요" }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "이름, 전화번호, 새 비밀번호(숫자 4~8자리)를 확인해 주세요" }, { status: 400 });
  const { login_id, phone, new_pin } = parsed.data;

  const pinErr = validatePin(new_pin);
  if (pinErr) return NextResponse.json({ error: pinErr }, { status: 400 });

  const normId = normalizeLoginId(login_id);
  if (!rateLimit(`reset-id:${normId}`, 5, 60 * 60 * 1000).ok) {
    return NextResponse.json({ error: "이 아이디로 시도가 너무 많아요. 담임목사님께 문의해 주세요" }, { status: 429 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id, name, role, phone, status").eq("login_id", normId).maybeSingle();

  const given = normalizePhone(phone);
  const stored = normalizePhone(profile?.phone ?? null);
  if (!profile || !stored || !given || stored !== given || profile.status === "rejected") {
    return NextResponse.json({ error: GENERIC }, { status: 400 });
  }

  const email = loginIdToEmail(login_id);
  const { error } = await admin.auth.admin.updateUserById(profile.id, { password: pinToPassword(email, new_pin) });
  if (error) return NextResponse.json({ error: "비밀번호를 바꾸지 못했어요: " + error.message }, { status: 500 });

  const when = new Date().toISOString();
  await notify(admin, {
    userIds: [profile.id],
    kind: "info",
    title: "비밀번호가 새로 설정되었어요",
    body: "로그인 화면의 '비밀번호를 잊으셨나요?'로 비밀번호가 바뀌었어요. 본인이 한 것이 아니면 담임목사님께 바로 알려 주세요.",
    link: "/settings",
  });
  if (profile.role !== "pastor") {
    await notify(admin, {
      userIds: await pastorIds(admin),
      kind: "info",
      title: `${profile.name} (${ROLE_LABEL[profile.role as Role]}) 비밀번호 재설정`,
      body: "본인이 전화번호 확인으로 비밀번호를 새로 정했어요. 이상하면 사용자 관리에서 다시 초기화해 주세요.",
      link: "/admin/users",
    });
  }
  console.info(`[reset-pin] ${normId} reset at ${when} from ${ip}`);

  return NextResponse.json({ ok: true, name: profile.name });
}
