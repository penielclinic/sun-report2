import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "gray" | "brand" | "emerald" | "amber" | "rose" | "violet" | "sky" | "orange" | "gold";

const TONE: Record<BadgeTone, string> = {
  gray: "bg-slate-100 text-slate-700",
  brand: "bg-brand-100 text-brand-800",
  emerald: "bg-emerald-100 text-emerald-800",
  amber: "bg-amber-100 text-amber-900",
  rose: "bg-rose-100 text-rose-800",
  violet: "bg-violet-100 text-violet-800",
  sky: "bg-sky-100 text-sky-800",
  orange: "bg-orange-100 text-orange-800",
  gold: "bg-gold-300/50 text-amber-900",
};

export function Badge({
  tone = "gray",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[0.9rem] font-bold whitespace-nowrap",
        TONE[tone],
        className
      )}
      {...props}
    />
  );
}

/** 보고서 상태 배지 */
export function StatusBadge({ status }: { status: "submitted" | "draft" | "none" | string | undefined }) {
  if (status === "submitted") return <Badge tone="emerald">✓ 제출완료</Badge>;
  if (status === "draft") return <Badge tone="amber">✎ 임시저장</Badge>;
  return <Badge tone="gray">미제출</Badge>;
}
