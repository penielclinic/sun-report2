"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { addDays, currentReportSunday, formatKoreanDate, recentSundays } from "@/lib/dates";
import { cn } from "@/lib/utils";

/** 주일 단위로 앞뒤 이동하는 날짜 선택기 (선교회장·담임목사 화면) */
export function SundayPicker({ value, basePath, className }: { value: string; basePath: string; className?: string }) {
  const router = useRouter();
  const thisSunday = currentReportSunday();
  const go = (d: string) => router.push(`${basePath}?date=${d}`);
  // 다음 주일 보고 창은 그 주일 0시에 열리므로 미래 주일은 고를 수 없다
  const options = [...new Set([...recentSundays(26), value])].filter((d) => d <= thisSunday).sort((a, b) => b.localeCompare(a));

  return (
    <div className={cn("flex items-center gap-1.5 rounded-2xl bg-white p-1.5 shadow-soft border", className)}>
      <button type="button" onClick={() => go(addDays(value, -7))} className="grid h-12 w-12 place-items-center rounded-xl hover:bg-brand-50" aria-label="지난 주">
        <ChevronLeft className="h-6 w-6" />
      </button>
      <label className="relative flex-1 flex items-center">
        <CalendarDays className="absolute left-3 h-5 w-5 text-brand-600 pointer-events-none" />
        <select
          value={value}
          onChange={(e) => go(e.target.value)}
          className="app-select h-12 w-full appearance-none rounded-xl bg-transparent pl-10 pr-10 text-base sm:text-lg font-bold focus:outline-none"
          aria-label="보고 주일 선택"
        >
          {options.map((d) => (
            <option key={d} value={d}>
              {formatKoreanDate(d)}
              {d === thisSunday ? " · 이번 주" : ""}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={() => go(addDays(value, 7))}
        disabled={value >= thisSunday}
        className="grid h-12 w-12 place-items-center rounded-xl hover:bg-brand-50 disabled:opacity-30"
        aria-label="다음 주"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
}
