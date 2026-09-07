import "server-only";
import { createHmac } from "node:crypto";

/**
 * 숫자 PIN → Supabase 비밀번호.
 * 서버 전용 비밀값(AUTH_PIN_SECRET)으로 HMAC 을 만들어 사용하므로
 * 짧은 PIN 이라도 Supabase 에는 긴 무작위 문자열이 저장된다.
 */
export function pinToPassword(loginEmail: string, pin: string): string {
  const secret = process.env.AUTH_PIN_SECRET;
  if (!secret || secret.length < 8) {
    throw new Error("AUTH_PIN_SECRET 환경변수를 8자 이상으로 설정해 주세요");
  }
  return createHmac("sha256", secret).update(`${loginEmail.toLowerCase()}:${pin}`).digest("base64url");
}
