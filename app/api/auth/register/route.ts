import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loginIdToEmail, normalizeLoginId, normalizePhone, validateLoginId, validatePin } from "@/lib/auth/login-id";
import { pinToPassword } from "@/lib/auth/pin.server";
import { registerSchema, firstIssue } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getSession } from "@/lib/auth/session";
import { getSunEntry, isValidMissionId, BRIDGE_SUN_NUMBER } from "@/lib/constants/sun-directory";
import { notify, pastorIds } from "@/lib/notify";

/**
 * 회원가입 (본인 신청 → 승인 대기) 또는 담임목사가 직접 계정 생성 (auto_approve)
 */
export async function POST(request: Request) {
  // 담임목사가 로그인한 채로 계정을 만드는 경우(사용자 관리 · 명단 일괄 등록)는
  // 무차별 가입 방지용 속도제한 대상이 아니므로 건너뛴다.
  const session = await getSession();
  const byPastor = session?.profile.role === "pastor" && session.profile.status === "active";

  if (!byPastor) {
    const rl = rateLimit(`register:${clientIp(request)}`, 10, 60 * 60 * 1000);
    if (!rl.ok) return NextResponse.json({ error: "가입 시도가 너무 많아요. 잠시 후 다시 시도해 주세요" }, { status: 429 });
  }

  const raw = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });

  const { login_id, pin, name, phone, role, sun_number, mission_id } = parsed.data;

  const idErr = validateLoginId(login_id);
  if (idErr) return NextResponse.json({ error: idErr }, { status: 400 });
  const pinErr = validatePin(pin);
  if (pinErr) return NextResponse.json({ error: pinErr }, { status: 400 });

  const autoApprove = byPastor && raw?.auto_approve === true;

  let derivedMission: number | null = null;
  let sun: number | null = null;
  if (role === "sun_leader") {
    const entry = sun_number ? getSunEntry(sun_number) : undefined;
    if (!entry) return NextResponse.json({ error: "담당 순을 선택해 주세요" }, { status: 400 });
    sun = entry.sunNumber;
    derivedMission = entry.missionId;
  } else if (role === "mission_leader") {
    if (!mission_id || !isValidMissionId(mission_id)) return NextResponse.json({ error: "소속 선교회를 선택해 주세요" }, { status: 400 });
    derivedMission = mission_id;
  }

  const admin = createAdminClient();
  const normalizedId = normalizeLoginId(login_id);

  const { data: dup } = await admin.from("profiles").select("id").eq("login_id", normalizedId).maybeSingle();
  if (dup) return NextResponse.json({ error: "이미 사용 중인 이름(아이디)이에요. 뒤에 숫자나 영문을 붙여 주세요" }, { status: 409 });

  // 같은 순 순장이 이미 활성/대기 중이면 안내 (브릿지는 목자 2명이라 예외)
  if (role === "sun_leader" && sun !== BRIDGE_SUN_NUMBER) {
    const { data: sameSun } = await admin
      .from("profiles")
      .select("id, name, status")
      .eq("role", "sun_leader")
      .eq("sun_number", sun!)
      .in("status", ["active", "pending"]);
    if (sameSun && sameSun.length > 0 && !byPastor) {
      return NextResponse.json(
        { error: `${sun}순 순장 계정(${sameSun[0].name})이 이미 등록되어 있어요. 담임목사님께 문의해 주세요` },
        { status: 409 }
      );
    }
  }

  // 첫 담임목사 계정은 자동 활성화 (초기 설정용). 이후 담임목사 가입은 승인 필요.
  let status: "active" | "pending" = autoApprove ? "active" : "pending";
  if (role === "pastor" && !autoApprove) {
    const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "pastor").eq("status", "active");
    if ((count ?? 0) === 0) status = "active";
  }

  const email = loginIdToEmail(login_id);
  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email,
    password: pinToPassword(email, pin),
    email_confirm: true,
    user_metadata: { login_id: normalizedId, name },
  });
  if (authError || !created.user) {
    const msg = authError?.message ?? "";
    const friendly = msg.includes("already") ? "이미 가입된 이름(아이디)이에요" : "계정을 만들 수 없어요: " + msg;
    return NextResponse.json({ error: friendly }, { status: 400 });
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    login_id: normalizedId,
    name: name.trim(),
    phone: normalizePhone(phone),
    role,
    sun_number: sun,
    mission_id: derivedMission,
    status,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: "가입 처리 중 오류: " + profileError.message }, { status: 400 });
  }

  if (status === "pending") {
    const roleLabel = role === "sun_leader" ? `${sun}순 순장` : role === "mission_leader" ? `${derivedMission}선교회 선교회장` : "담임목사";
    await notify(admin, {
      userIds: await pastorIds(admin),
      kind: "info",
      title: "새 가입 신청",
      body: `${name.trim()} (${roleLabel}) 님이 가입을 신청했어요. 사용자 관리에서 승인해 주세요.`,
      link: "/admin/users",
    });
  }

  return NextResponse.json({ ok: true, status });
}
