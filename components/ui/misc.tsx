"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** 페이지 상단 제목 영역 */
export function PageHeader({
  title,
  subtitle,
  icon,
  action,
  back,
}: {
  title: string;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  back?: { href: string; label?: string };
}) {
  return (
    <div className="rise-in">
      {back && (
        <Link
          href={back.href}
          className="inline-flex items-center gap-1 text-base font-bold text-ink-soft hover:text-brand-700 mb-2 -ml-1 py-2 pr-2"
        >
          <ChevronLeft className="h-5 w-5" />
          {back.label ?? "뒤로가기"}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div className="grid h-13 w-13 shrink-0 place-items-center rounded-2xl bg-white shadow-soft text-brand-600">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-ink">{title}</h1>
            {subtitle && <div className="mt-0.5 text-base sm:text-lg text-ink-soft">{subtitle}</div>}
          </div>
        </div>
        {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
      </div>
    </div>
  );
}

/** 큰 숫자 통계 타일 */
export function StatTile({
  label,
  value,
  unit,
  tone = "brand",
  icon,
  className,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  tone?: "brand" | "emerald" | "amber" | "rose" | "violet" | "sky" | "orange" | "indigo";
  icon?: React.ReactNode;
  className?: string;
}) {
  const tones: Record<string, string> = {
    brand: "from-brand-50 to-white text-brand-700 border-brand-100",
    emerald: "from-emerald-50 to-white text-emerald-700 border-emerald-100",
    amber: "from-amber-50 to-white text-amber-700 border-amber-100",
    rose: "from-rose-50 to-white text-rose-700 border-rose-100",
    violet: "from-violet-50 to-white text-violet-700 border-violet-100",
    sky: "from-sky-50 to-white text-sky-700 border-sky-100",
    orange: "from-orange-50 to-white text-orange-700 border-orange-100",
    indigo: "from-indigo-50 to-white text-indigo-700 border-indigo-100",
  };
  return (
    <div
      className={cn(
        "rounded-2xl border bg-gradient-to-b px-4 py-3.5 shadow-soft flex flex-col gap-1 min-w-0",
        tones[tone],
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-[0.95rem] font-bold text-ink-soft">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="text-3xl font-black tabular-nums leading-none">
        {value}
        {unit && <span className="ml-1 text-lg font-bold opacity-70">{unit}</span>}
      </div>
    </div>
  );
}

/** 큰 체크박스 (터치하기 쉬움) */
export function BigCheck({
  checked,
  onChange,
  label,
  tone = "brand",
  size = "md",
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: React.ReactNode;
  tone?: "brand" | "emerald" | "amber" | "rose" | "violet" | "indigo" | "orange";
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
}) {
  const on: Record<string, string> = {
    brand: "bg-brand-600 border-brand-600",
    emerald: "bg-emerald-600 border-emerald-600",
    amber: "bg-amber-500 border-amber-500",
    rose: "bg-rose-500 border-rose-500",
    violet: "bg-violet-600 border-violet-600",
    indigo: "bg-indigo-600 border-indigo-600",
    orange: "bg-orange-500 border-orange-500",
  };
  const box = size === "sm" ? "h-9 w-9 rounded-xl" : "h-11 w-11 rounded-2xl";
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex items-center gap-3 select-none disabled:opacity-50",
        className
      )}
    >
      <span
        className={cn(
          "grid place-items-center border-2 transition-all",
          box,
          checked ? cn(on[tone], "text-white scale-105") : "bg-white border-slate-300 text-transparent"
        )}
      >
        <Check className={size === "sm" ? "h-5 w-5" : "h-7 w-7"} strokeWidth={3.5} />
      </span>
      {label && <span className="text-lg font-bold">{label}</span>}
    </button>
  );
}

/** 빈 상태 안내 */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 gap-3">
      {icon && <div className="grid h-16 w-16 place-items-center rounded-3xl bg-brand-50 text-brand-500">{icon}</div>}
      <p className="text-xl font-black text-ink">{title}</p>
      {description && <p className="text-base text-ink-soft max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-2xl", className)} />;
}

/** 세그먼트 탭 (기간 선택 등) */
export function SegmentTabs<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  /** href 가 있으면 링크, 없으면 onChange 버튼 (서버 컴포넌트에서는 href 사용) */
  options: { value: T; label: string; href?: string }[];
  onChange?: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1.5 rounded-2xl bg-white p-1.5 shadow-soft border", className)}>
      {options.map((o) => {
        const active = o.value === value;
        const cls = cn(
          "flex-1 rounded-xl py-3 text-center text-base font-bold transition-colors",
          active ? "bg-brand-600 text-white shadow" : "text-ink-soft hover:bg-brand-50"
        );
        return o.href ? (
          <Link key={o.value} href={o.href} className={cls} aria-current={active ? "page" : undefined}>
            {o.label}
          </Link>
        ) : (
          <button key={o.value} type="button" className={cls} onClick={() => onChange?.(o.value)} aria-pressed={active}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** 진행률 막대 */
export function ProgressBar({ value, max, tone = "gold", className }: { value: number; max: number; tone?: "gold" | "emerald" | "brand" | "white"; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const bar: Record<string, string> = {
    gold: "bg-gradient-to-r from-gold-400 to-amber-400",
    emerald: "bg-gradient-to-r from-emerald-400 to-teal-400",
    brand: "bg-gradient-to-r from-brand-400 to-brand-600",
    white: "bg-white",
  };
  return (
    <div className={cn("h-3.5 w-full rounded-full bg-black/10 overflow-hidden", className)} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full transition-all duration-700", bar[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}
