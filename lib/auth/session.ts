import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/types/database";

export interface Session {
  userId: string;
  profile: Profile;
}

/** 현재 로그인 사용자 + 프로필 (요청당 1회 캐시) */
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile) return null;
  return { userId: user.id, profile: profile as Profile };
});

export function dashboardPath(role: Role): string {
  if (role === "pastor") return "/dashboard/pastor";
  if (role === "mission_leader") return "/dashboard/mission-leader";
  return "/dashboard/sun-leader";
}

/** 페이지용: 로그인·활성 상태·역할 확인 후 세션 반환 (아니면 리다이렉트) */
export async function requirePage(roles?: Role[]): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.profile.status === "pending") redirect("/pending");
  if (session.profile.status === "rejected") redirect("/login?error=rejected");
  if (roles && !roles.includes(session.profile.role)) redirect(dashboardPath(session.profile.role));
  return session;
}

/** API 용: 세션 없거나 권한 없으면 NextResponse 반환 */
export async function requireApi(
  roles?: Role[]
): Promise<{ session: Session; error: null } | { session: null; error: NextResponse }> {
  const session = await getSession();
  if (!session || session.profile.status !== "active") {
    return { session: null, error: NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 }) };
  }
  if (roles && !roles.includes(session.profile.role)) {
    return { session: null, error: NextResponse.json({ error: "권한이 없습니다" }, { status: 403 }) };
  }
  return { session, error: null };
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
