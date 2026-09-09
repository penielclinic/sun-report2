import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, BarChart3, Users, ShieldCheck } from "lucide-react";
import { FontSizeToggle } from "@/components/layout/font-size-toggle";
import { StatisticsBody } from "@/components/admin/statistics-body";
import { loadPublicStatistics, PERIODS, type Period } from "@/lib/stats.server";
import { MISSION_IDS, getMissionShortName } from "@/lib/constants/sun-directory";

const CHURCH = process.env.NEXT_PUBLIC_CHURCH_NAME ?? "해운대순복음교회";

export const metadata: Metadata = {
  title: "전체 통계 현황",
  description: `${CHURCH} 순보고 통계 — 로그인 없이 누구나 볼 수 있어요.`,
  // 교회 내부 자료라 검색 결과에는 나오지 않게 한다 (주소를 아는 사람은 누구나 볼 수 있음)
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PublicStatsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period: p } = await searchParams;
  const period: Period = (["week", "month", "year"] as const).includes(p as Period) ? (p as Period) : "week";
  const meta = PERIODS.find((x) => x.key === period)!;
  const { points, latest, missionAttend } = await loadPublicStatistics(period);
  const mission = MISSION_IDS.map((m) => ({ name: getMissionShortName(m), attend: missionAttend.get(m) ?? 0 }));

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-brand-700 via-brand-600 to-violet-600 text-white shadow-pop no-print">
        <div className="mx-auto max-w-5xl px-4 h-17 flex items-center justify-between gap-3">
          <Link href="/login" className="inline-flex items-center gap-1 text-lg font-bold whitespace-nowrap">
            <ArrowLeft className="h-6 w-6" />
            로그인
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <Image src="/logo.png" alt={`${CHURCH} 로고`} width={34} height={28} className="h-auto w-[34px] rounded-md bg-white/90 p-0.5" />
            <span className="text-lg font-black truncate">{CHURCH}</span>
          </div>
          <FontSizeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5 space-y-5">
        <div className="rounded-3xl bg-gradient-to-br from-brand-600 via-violet-600 to-fuchsia-600 text-white p-6 shadow-pop rise-in">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/20 pop-in">
              <BarChart3 className="h-10 w-10" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl sm:text-4xl font-black leading-tight">전체 통계 현황</h1>
              <p className="mt-1 text-lg opacity-95" style={{ wordBreak: "keep-all" }}>
                {CHURCH} 순보고 · {meta.desc}
              </p>
            </div>
          </div>
          <p className="mt-4 rounded-2xl bg-white/15 px-4 py-3 text-base sm:text-lg" style={{ wordBreak: "keep-all" }}>
            <b>로그인하지 않아도 누구나 볼 수 있는 화면</b>이에요. 예배 참석 인원, 성경 읽은 장수, 헌금 합계 같은 <b>전체 숫자</b>만 보여 드려요.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 rise-in rise-in-2">
          <p className="flex items-start gap-2 rounded-2xl border bg-white px-4 py-3 text-base text-ink-soft shadow-soft" style={{ wordBreak: "keep-all" }}>
            <ShieldCheck className="h-6 w-6 shrink-0 text-emerald-600" />
            <span>순원 이름·연락처·기도제목 같은 개인 정보는 들어 있지 않아요.</span>
          </p>
          <p className="flex items-start gap-2 rounded-2xl border bg-white px-4 py-3 text-base text-ink-soft shadow-soft" style={{ wordBreak: "keep-all" }}>
            <Users className="h-6 w-6 shrink-0 text-brand-600" />
            <span>
              순보고서 작성이나 자세한 내용은{" "}
              <Link href="/login" className="font-bold text-brand-700 underline underline-offset-4">
                로그인
              </Link>{" "}
              후에 볼 수 있어요.
            </span>
          </p>
        </div>

        <StatisticsBody period={period} points={points} latest={latest} mission={mission} basePath="/stats" />

        <div className="pt-2 pb-8 text-center">
          <Link
            href="/login"
            className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-violet-600 px-8 text-xl font-black text-white shadow-pop hover:brightness-110 active:translate-y-px"
          >
            로그인하러 가기
          </Link>
        </div>
      </main>
    </div>
  );
}
