import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * 서비스 롤 클라이언트 — RLS 를 우회하므로 반드시 서버(API 라우트)에서
 * 권한 검사를 마친 뒤에만 사용한다.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase 환경변수(NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)가 없습니다");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
