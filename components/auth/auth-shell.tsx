import Image from "next/image";
import Link from "next/link";
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

          <p className="mt-6 text-center text-base text-ink-soft rise-in rise-in-3">
            앱이 처음이신가요?{" "}
            <Link href="/guide" className="font-bold text-brand-700 underline underline-offset-4">
              사용설명서 보기
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
