import Link from "next/link";
import { MessageSquareText, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/dates";
import type { Notification } from "@/types/database";

/** 홈 화면에 최근 알림/메시지 5개 표시 */
export async function RecentMessages({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, title, body, read, created_at, kind, link")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);
  const list = (data ?? []) as Notification[];
  const unread = list.filter((n) => !n.read).length;

  return (
    <Card className="rise-in rise-in-3">
      <CardHeader className="flex items-center justify-between">
        <CardTitle icon={<MessageSquareText className="h-6 w-6 text-brand-600" />}>알림 · 메시지</CardTitle>
        <div className="flex items-center gap-2">
          {unread > 0 && <Badge tone="rose">새 알림 {unread}</Badge>}
          <Link href="/notifications" className="inline-flex items-center text-base font-bold text-brand-700">
            전체보기 <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {list.length === 0 ? (
          <p className="px-6 pb-6 text-base text-ink-soft">받은 알림이 없어요.</p>
        ) : (
          <ul className="divide-y">
            {list.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.link ?? "/notifications"}
                  className={"flex items-start gap-3 px-5 py-3.5 sm:px-6 hover:bg-brand-50/60 " + (!n.read ? "bg-amber-50/70" : "")}
                >
                  <span className={"mt-2 h-3 w-3 shrink-0 rounded-full " + (!n.read ? "bg-rose-500" : "bg-slate-200")} />
                  <span className="min-w-0 flex-1">
                    <span className={"block text-lg font-bold " + (!n.read ? "text-ink" : "text-ink-soft")}>{n.title}</span>
                    <span className="block text-base text-ink-soft line-clamp-2">{n.body}</span>
                    <span className="block text-sm text-slate-400 mt-0.5">{formatDateTime(n.created_at)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
