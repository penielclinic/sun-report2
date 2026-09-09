import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, ChevronRight } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "로그인" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <AuthShell title="로그인" subtitle="이름과 숫자 비밀번호를 입력해 주세요">
      <LoginForm initialError={error === "rejected" ? "사용이 중지된 계정이에요. 담임목사님께 문의해 주세요" : undefined} />

      {/* 로그인 없이 볼 수 있는 전체 통계 */}
      <div className="mt-7 border-t pt-6">
        <Link
          href="/stats"
          className="group flex items-center gap-3 rounded-2xl bg-gradient-to-r from-brand-600 via-violet-600 to-fuchsia-600 px-4 py-4 text-white shadow-pop hover:brightness-110 active:translate-y-px"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/20">
            <BarChart3 className="h-7 w-7" strokeWidth={2.5} />
          </span>
          <span className="min-w-0 flex-1 text-left" style={{ wordBreak: "keep-all" }}>
            <span className="block text-xl font-black leading-snug">전체 통계 현황</span>
            <span className="block text-base leading-snug opacity-95">누구나 볼 수 있어요</span>
          </span>
          <ChevronRight className="h-7 w-7 shrink-0 opacity-90 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <p className="mt-3 text-center text-base text-ink-soft" style={{ wordBreak: "keep-all" }}>
          예배 참석 인원·성경 읽은 장수·헌금 합계 같은 <b>전체 숫자</b>는 누구나 볼 수 있어요.
          <br />
          순원 이름이나 기도제목 같은 개인 정보는 들어 있지 않아요.
        </p>
      </div>
    </AuthShell>
  );
}
