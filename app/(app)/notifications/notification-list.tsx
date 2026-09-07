"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCheck, Trash2, BellOff, MessageSquareText, FileText, MessageCircle, AlarmClock, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { api } from "@/lib/api-client";
import { formatDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/database";

const KIND_ICON: Record<string, React.ReactNode> = {
  message: <MessageSquareText className="h-6 w-6 text-violet-600" />,
  report: <FileText className="h-6 w-6 text-emerald-600" />,
  comment: <MessageCircle className="h-6 w-6 text-brand-600" />,
  reminder: <AlarmClock className="h-6 w-6 text-rose-600" />,
  info: <Info className="h-6 w-6 text-amber-600" />,
};

export function NotificationList({ initial }: { initial: Notification[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [items, setItems] = useState(initial);
  const unread = items.filter((n) => !n.read).length;

  // 화면을 열면 3초 뒤 전부 읽음 처리 (사용자가 읽을 시간을 준 뒤)
  useEffect(() => {
    if (unread === 0) return;
    const t = setTimeout(async () => {
      try {
        await api("/api/notifications", { method: "PATCH", body: { all: true } });
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
        router.refresh();
      } catch {}
    }, 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function markAll() {
    try {
      await api("/api/notifications", { method: "PATCH", body: { all: true } });
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function remove(id: string) {
    try {
      await api("/api/notifications", { method: "DELETE", body: { id } });
      setItems((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function clearRead() {
    if (!(await confirm({ title: "읽은 알림을 모두 지울까요?", danger: true, confirmLabel: "지우기" }))) return;
    try {
      await api("/api/notifications", { method: "DELETE", body: { all: true } });
      setItems((prev) => prev.filter((n) => !n.read));
      toast.success("정리했어요");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={markAll} disabled={unread === 0}>
          <CheckCheck className="h-5 w-5" /> 모두 읽음
        </Button>
        <Button variant="outline" size="sm" onClick={clearRead} disabled={items.every((n) => !n.read)}>
          <Trash2 className="h-5 w-5" /> 읽은 알림 지우기
        </Button>
      </div>
      <Card className="rise-in">
        <CardContent className="p-0">
          {items.length === 0 ? (
            <EmptyState icon={<BellOff className="h-8 w-8" />} title="알림이 없어요" description="새 메시지나 보고서가 오면 여기에 표시돼요." />
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li key={n.id} className={cn("flex items-start gap-3 px-4 py-4 sm:px-6", !n.read && "bg-amber-50/70")}>
                  <div className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white border shadow-soft">{KIND_ICON[n.kind] ?? KIND_ICON.info}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {!n.read && <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0" />}
                      <p className="text-lg font-bold">{n.title}</p>
                    </div>
                    <p className="text-base text-ink-soft whitespace-pre-wrap break-words">{n.body}</p>
                    <div className="mt-1 flex items-center gap-3 text-sm text-slate-400">
                      <span>{formatDateTime(n.created_at)}</span>
                      {n.link && (
                        <Link href={n.link} className="font-bold text-brand-700 underline underline-offset-4">
                          바로가기
                        </Link>
                      )}
                    </div>
                  </div>
                  <button type="button" onClick={() => remove(n.id)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="알림 삭제">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
