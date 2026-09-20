import Image from "next/image";
import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { FontSizeToggle } from "@/components/layout/font-size-toggle";

const CHURCH = process.env.NEXT_PUBLIC_CHURCH_NAME ?? "해운대순복음교회";
const APP = process.env.NEXT_PUBLIC_APP_NAME ?? "순보고";

/** 로그인·가입·대기 화면 공통 틀 */
export function AuthShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <div className="flex justify-end px-4 pt-3">
        <FontSizeToggle />
      </div>
      <main className="flex-1 flex items-center justify-center px-4 pb-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 rise-in">
            <div className="mx-auto mb-3 grid h-24 w-24 place-items-center rounded-[2rem] bg-white shadow-pop pop-in">
              <Image src="/logo.png" alt={`${CHURCH} 로고`} width={72} height={58} className="h-auto w-[72px]" priority />
            </div>
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-brand-700 via-brand-500 to-violet-600 bg-clip-text text-transparent">
              {APP}
            </h1>
            <p className="mt-1 text-lg font-bold text-ink-soft">{CHURCH}</p>
          </div>

          <div className="rounded-[2rem] bg-white shadow-pop border p-6 sm:p-8 rise-in rise-in-2">
            <h2 className="text-2xl font-black text-center">{title}</h2>
            {subtitle && <p className="mt-1 text-center text-base text-ink-soft whitespace-pre-line">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>

          <Link
            href="/guide"
            className="mt-6 flex items-center gap-3 rounded-2xl border-2 border-brand-200 bg-white px-4 py-3.5 shadow-soft hover:border-brand-400 hover:bg-brand-50/60 rise-in rise-in-3"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
              <BookOpen className="h-7 w-7" strokeWidth={2.5} />
            </span>
            <span className="min-w-0 flex-1" style={{ wordBreak: "keep-all" }}>
              <span className="block text-lg font-black text-ink">앱이 처음이신가요?</span>
              <span className="block text-base text-ink-soft">사용설명서를 먼저 읽어 보세요</span>
            </span>
            <ChevronRight className="h-6 w-6 shrink-0 text-brand-400" />
          </Link>
        </div>
      </main>
    </div>
  );
}
