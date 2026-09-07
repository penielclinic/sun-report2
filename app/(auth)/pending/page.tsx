import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { getSession, dashboardPath } from "@/lib/auth/session";
import { LogoutButton } from "@/components/layout/logout-button";

export const metadata: Metadata = { title: "승인 대기" };

export default async function PendingPage() {
  const session = await getSession();
  if (session?.profile.status === "active") redirect(dashboardPath(session.profile.role));

  return (
    <AuthShell title="승인 대기 중">
      <div className="text-center space-y-4">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-amber-100 text-amber-600 pop-in">
          <Clock className="h-10 w-10" />
        </div>
        <p className="text-lg leading-relaxed">
          가입 신청이 잘 접수되었어요.
          <br />
          <b>담임목사님이 승인</b>하면 바로 사용할 수 있어요.
        </p>
        <p className="text-base text-ink-soft">승인 후에는 다시 로그인해 주세요.</p>
        {session ? (
          <LogoutButton variant="outline" size="lg" full />
        ) : (
          <a href="/login" className="block text-lg font-bold text-brand-700 underline underline-offset-4">
            로그인 화면으로
          </a>
        )}
      </div>
    </AuthShell>
  );
}
