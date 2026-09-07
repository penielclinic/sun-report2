import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { loginIdToEmail, normalizeLoginId } from "@/lib/auth/login-id";
import { pinToPassword } from "@/lib/auth/pin.server";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { dashboardPath } from "@/lib/auth/session";
import type { Profile } from "@/types/database";

const schema = z.object({
  login_id: z.string().trim().min(1).max(20),
  pin: z.string().regex(/^\d{4,8}$/),
});

export async function POST(request: Request) {
  const ip = clientIp(request);
  const rl = rateLimit(`login:${ip}`, 20, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `로그인 시도가 너무 많아요. ${Math.ceil(rl.retryAfterSec / 60)}분 후 다시 시도해 주세요` },
      { status: 429 }
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "이름과 비밀번호(숫자)를 확인해 주세요" }, { status: 400 });

  const { login_id, pin } = parsed.data;
  const idRl = rateLimit(`login-id:${normalizeLoginId(login_id)}`, 10, 10 * 60 * 1000);
  if (!idRl.ok) {
    return NextResponse.json({ error: "이 아이디로 로그인 시도가 너무 많아요. 잠시 후 다시 시도해 주세요" }, { status: 429 });
  }

  const email = loginIdToEmail(login_id);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pinToPassword(email, pin),
  });

  if (error || !data.user) {
    return NextResponse.json({ error: "이름 또는 비밀번호가 맞지 않아요. 다시 확인해 주세요" }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
  const p = profile as Profile | null;

  if (!p) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "계정 정보가 없어요. 담임목사님께 문의해 주세요" }, { status: 403 });
  }
  if (p.status === "rejected") {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "사용이 중지된 계정이에요. 담임목사님께 문의해 주세요" }, { status: 403 });
  }

  const redirect = p.status === "pending" ? "/pending" : dashboardPath(p.role);
  return NextResponse.json({ ok: true, redirect, name: p.name });
}
