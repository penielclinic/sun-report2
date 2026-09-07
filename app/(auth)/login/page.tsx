import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "로그인" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <AuthShell title="로그인" subtitle="이름과 숫자 비밀번호를 입력해 주세요">
      <LoginForm initialError={error === "rejected" ? "사용이 중지된 계정이에요. 담임목사님께 문의해 주세요" : undefined} />
    </AuthShell>
  );
}
