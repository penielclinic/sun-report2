import Link from "next/link";
import { CheckCircle2, Clock3, AlertCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 이번 주 보고 상태를 큼직하게 보여주는 카드 (순장·선교회장 홈)
 */
export function ReportStatusCard({
  status,
  dateLabel,
  submittedLabel,
  href,
  ctaLabel,
}: {
  status: "submitted" | "draft" | "none";
  dateLabel: string;
  submittedLabel?: string;
  href: string;
  ctaLabel: string;
}) {
  const cfg = {
    submitted: {
      wrap: "from-emerald-500 to-teal-600",
      icon: <CheckCircle2 className="h-14 w-14" strokeWidth={2.5} />,
      title: "이번 주 보고 완료!",
      desc: submittedLabel ?? "수고 많으셨어요.",
    },
    draft: {
      wrap: "from-amber-400 to-orange-500",
      icon: <Clock3 className="h-14 w-14" strokeWidth={2.5} />,
      title: "작성 중인 보고서가 있어요",
      desc: "아직 제출 전이에요. 이어서 작성하고 제출해 주세요.",
    },
    none: {
      wrap: "from-rose-500 to-pink-600",
      icon: <AlertCircle className="h-14 w-14" strokeWidth={2.5} />,
      title: "이번 주 보고서를 아직 안 냈어요",
      desc: "아래 버튼을 눌러 작성해 주세요.",
    },
  }[status];

  return (
    <div className={cn("rounded-3xl bg-gradient-to-br text-white p-6 shadow-pop rise-in", cfg.wrap)}>
      <p className="text-base font-bold opacity-90">{dateLabel}</p>
      <div className="mt-2 flex items-center gap-4">
        <div className="shrink-0 pop-in">{cfg.icon}</div>
        <div className="min-w-0">
          <p className="text-2xl sm:text-3xl font-black leading-tight">{cfg.title}</p>
          <p className="mt-1 text-base sm:text-lg opacity-95">{cfg.desc}</p>
        </div>
      </div>
      <Link
        href={href}
        className="mt-5 flex h-16 items-center justify-center gap-2 rounded-2xl bg-white text-xl font-black text-ink shadow hover:bg-white/90 active:translate-y-px"
      >
        {ctaLabel}
        <ChevronRight className="h-6 w-6" />
      </Link>
    </div>
  );
}
