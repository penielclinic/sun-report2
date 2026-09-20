"use client";

import { useState } from "react";
import { Megaphone, ChevronDown, ChevronUp, BookOpenCheck, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * 새 기능 공지 — 성경통독 · 필사 보고 안내.
 * 로그인 화면과 순장·선교회장·담임목사 홈 맨 위에 똑같이 뜬다.
 * 눈에 띄도록 반짝이고, 누르면 펼쳐서 읽는다.
 */

const keepAll = { wordBreak: "keep-all" as const };

export function UpdateNotice({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={className}>
      <style>{`
        @keyframes notice-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251, 113, 133, .45); transform: scale(1); }
          50% { box-shadow: 0 0 0 10px rgba(251, 113, 133, 0); transform: scale(1.02); }
        }
        @keyframes notice-blink { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }
        .notice-glow { animation: notice-glow 2.13s ease-in-out infinite; }
        .notice-blink { animation: notice-blink 1.33s steps(2, start) infinite; }
        @media (prefers-reduced-motion: reduce) { .notice-glow, .notice-blink { animation: none; } }
      `}</style>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`w-full rounded-3xl border-2 border-rose-300 bg-gradient-to-r from-rose-50 via-amber-50/70 to-rose-50 px-4 py-3.5 text-left ${open ? "" : "notice-glow"}`}
      >
        <div className="flex items-center gap-3">
          <span className="grid h-13 w-13 shrink-0 place-items-center rounded-2xl bg-rose-500 text-white">
            <Megaphone className="h-7 w-7" strokeWidth={2.5} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-lg font-black text-rose-600">
              <span className="notice-blink rounded-md bg-rose-500 px-1.5 py-0.5 text-sm text-white">NEW</span>
              <span className="whitespace-nowrap">꼭 읽어 주세요!</span>
            </span>
            <span className="mt-0.5 block text-lg font-bold text-ink" style={keepAll}>
              순보고에 <b className="text-rose-600">성경통독 · 성경필사</b> 보고가 새로 생겼어요
            </span>
          </span>
          {open ? <ChevronUp className="h-7 w-7 shrink-0 text-rose-400" /> : <ChevronDown className="h-7 w-7 shrink-0 text-rose-400" />}
        </div>
        {!open && <span className="notice-blink mt-2 block text-center text-base font-bold text-rose-500">👆 여기를 눌러 내용을 확인해 주세요</span>}
      </button>

      {open && (
        <div className="mt-2 space-y-5 rounded-3xl border-2 border-rose-200 bg-white px-5 py-5 shadow-soft">
          <p className="flex items-center gap-2 text-xl font-black text-brand-700">
            <BookOpenCheck className="h-6 w-6 text-gold-500" />
            성경통독 · 필사 보고 안내
          </p>

          <section className="space-y-1.5">
            <p className="text-lg font-black">📝 순장님께</p>
            <ol className="list-decimal space-y-1 pl-5 text-lg" style={keepAll}>
              <li>순보고서에서 그 순원의 <b>이름을 누르세요.</b></li>
              <li>
                <b>성경통독 완료</b> 또는 <b>성경필사 완료</b>에 체크해 주세요.
              </li>
              <li>
                성경을 <b className="text-rose-600">다 마친 그 주에 한 번만</b> 체크하시면 돼요. (매주 체크하는 게 아니에요)
              </li>
            </ol>
          </section>

          <section className="space-y-1.5">
            <p className="text-lg font-black">📋 선교회장님께</p>
            <p className="text-lg" style={keepAll}>
              순장님들이 체크하신 내용이 선교회보고서에 <b>저절로 모여서</b> 목사님께 올라가요. 따로 적으실 필요가 없어요.
            </p>
            <div className="rounded-2xl border bg-slate-50 px-4 py-3 text-lg">
              <p className="flex items-center gap-1.5 font-black text-gold-700">
                <PenLine className="h-5 w-5" /> 성경필사
              </p>
              <p>최경남 (3선교회)</p>
              <p className="mt-1.5 flex items-center gap-1.5 font-black text-violet-700">
                <BookOpenCheck className="h-5 w-5" /> 성경통독
              </p>
              <p>이영철 (3선교회)</p>
            </div>
          </section>

          <section className="space-y-1.5">
            <p className="text-lg font-black">📊 모든 성도님께</p>
            <p className="text-lg" style={keepAll}>
              선교회장님이 목사님께 보고하시면, 성경을 다 마치신 분들의 이름이 로그인 화면의 <b>전체 통계 현황</b>에도 올라가요. 함께 축하해 주세요! 🎉
            </p>
          </section>

          <Button variant="primary" size="lg" className="w-full" onClick={() => setOpen(false)}>
            확인했어요
          </Button>
        </div>
      )}
    </div>
  );
}
