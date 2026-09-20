import { BookOpenCheck, PenLine } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCompletionLine, type BibleCompletion, type BibleKind } from "@/lib/bible-completion";
import { formatShortDate } from "@/lib/dates";

/** 성경통독 · 필사 완료자 명단 (순장 홈 · 선교회보고서 · 담임목사 홈 · 공개 통계 공용) */

const KIND_STYLE: Record<BibleKind, { wrap: string; badge: string; icon: React.ReactNode }> = {
  성경필사: {
    wrap: "border-gold-300 bg-gold-50",
    badge: "bg-gold-400 text-ink",
    icon: <PenLine className="h-5 w-5" strokeWidth={2.5} />,
  },
  성경통독: {
    wrap: "border-violet-200 bg-violet-50",
    badge: "bg-violet-600 text-white",
    icon: <BookOpenCheck className="h-5 w-5" strokeWidth={2.5} />,
  },
};

export function BibleCompletionList({
  completions,
  title = "성경통독 · 필사 보고",
  description,
  emptyText = "이번 보고에는 통독·필사를 마치신 분이 없어요.",
  showDate = false,
  className,
}: {
  completions: BibleCompletion[];
  title?: string;
  description?: string;
  emptyText?: string;
  showDate?: boolean;
  className?: string;
}) {
  const pilsa = completions.filter((c) => c.kind === "성경필사").length;
  const tongdok = completions.length - pilsa;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle icon={<BookOpenCheck className="h-6 w-6 text-gold-500" />}>{title}</CardTitle>
        <CardDescription style={{ wordBreak: "keep-all" }}>
          {completions.length > 0 ? `성경필사 ${pilsa}명 · 성경통독 ${tongdok}명` : (description ?? "성경을 다 마치신 분을 축하해 주세요.")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {completions.length === 0 ? (
          <p className="py-2 text-center text-base text-ink-soft" style={{ wordBreak: "keep-all" }}>
            {emptyText}
          </p>
        ) : (
          <ul className="space-y-2">
            {completions.map((c) => {
              const s = KIND_STYLE[c.kind];
              return (
                <li
                  key={`${c.kind}-${c.name}-${c.missionId}-${c.reportDate}`}
                  className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl border px-4 py-3 ${s.wrap}`}
                >
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-base font-black whitespace-nowrap ${s.badge}`}>
                    {s.icon}
                    {c.kind}
                  </span>
                  <span className="text-xl font-bold whitespace-nowrap">{formatCompletionLine(c)}</span>
                  {showDate && <span className="text-base text-ink-soft whitespace-nowrap">{formatShortDate(c.reportDate)}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
