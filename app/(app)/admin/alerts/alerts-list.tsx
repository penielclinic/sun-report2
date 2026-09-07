"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { api } from "@/lib/api-client";
import { formatDateTime } from "@/lib/dates";
import { getMissionName } from "@/lib/constants/sun-directory";
import { cn } from "@/lib/utils";
import type { PastoralAlert } from "@/types/database";

export function AlertsList({ initial }: { initial: PastoralAlert[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const unread = items.filter((a) => !a.is_read).length;

  async function markAll() {
    try {
      await api("/api/admin/alerts", { method: "PATCH", body: { all: true } });
      setItems((p) => p.map((a) => ({ ...a, is_read: true })));
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  if (items.length === 0) return <EmptyState title="긴급 소식이 없어요" description="특별보고에 긴급 단어가 포함되면 여기에 표시돼요." />;

  return (
    <div>
      {unread > 0 && (
        <div className="flex justify-end px-5 pb-2">
          <Button variant="outline" size="sm" onClick={markAll}>
            <CheckCheck className="h-5 w-5" /> 모두 확인함 ({unread})
          </Button>
        </div>
      )}
      <ul className="divide-y">
        {items.map((a) => {
          const where = a.sun_number ? `${a.sun_number}순 ${a.sun_leader ?? ""}` : `${getMissionName(a.mission_id ?? 0)} ${a.mission_leader ?? ""}`;
          const link = a.source_report_id ? (a.sun_number ? `/report/sun/${a.source_report_id}` : `/report/mission/${a.source_report_id}`) : null;
          return (
            <li key={a.id} className={cn("px-5 py-4 sm:px-6", !a.is_read && "bg-rose-50/60")}>
              <div className="flex flex-wrap items-center gap-2">
                {!a.is_read && <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />}
                <Badge tone="rose">{a.triggered_by ?? "긴급"}</Badge>
                <span className="text-lg font-bold">{where}</span>
                <span className="text-sm text-slate-400">{formatDateTime(a.created_at)}</span>
              </div>
              <p className="mt-1.5 text-lg whitespace-pre-wrap">{a.source_text}</p>
              {link && (
                <Link href={link} className="mt-1 inline-block text-base font-bold text-brand-700 underline underline-offset-4">
                  보고서 열기
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
