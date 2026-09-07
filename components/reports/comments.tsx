"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { api } from "@/lib/api-client";
import { formatDateTime } from "@/lib/dates";
import { ROLE_LABEL, type ReportComment, type Role } from "@/types/database";

const ROLE_TONE: Record<Role, BadgeTone> = { pastor: "violet", mission_leader: "amber", sun_leader: "emerald" };

export function Comments({
  kind,
  reportId,
  initialComments,
  currentUserId,
  currentRole,
  canComment,
}: {
  kind: "sun" | "mission";
  reportId: string;
  initialComments: ReportComment[];
  currentUserId: string;
  currentRole: Role;
  canComment: boolean;
}) {
  const confirm = useConfirm();
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!content.trim()) return;
    setSending(true);
    try {
      const res = await api<{ comment: ReportComment }>(`/api/comments/${kind}/${reportId}`, { body: { content } });
      setComments((prev) => [...prev, res.comment]);
      setContent("");
      toast.success("답글을 남겼어요");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  async function remove(id: string) {
    if (!(await confirm({ title: "답글을 삭제할까요?", danger: true, confirmLabel: "삭제" }))) return;
    try {
      await api(`/api/comments/${kind}/${reportId}`, { method: "DELETE", body: { commentId: id } });
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <Card className="rise-in rise-in-3">
      <CardHeader>
        <CardTitle icon={<MessageCircle className="h-6 w-6 text-brand-600" />}>
          답글 <span className="text-base font-bold text-ink-soft">({comments.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-base text-ink-soft py-3">아직 답글이 없어요</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="rounded-2xl border bg-slate-50/70 px-4 py-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge tone={ROLE_TONE[c.author_role] ?? "gray"}>{ROLE_LABEL[c.author_role] ?? c.author_role}</Badge>
                    <span className="text-lg font-bold">{c.author_name}</span>
                    <span className="text-sm text-slate-500">{formatDateTime(c.created_at)}</span>
                  </div>
                  {(c.author_id === currentUserId || currentRole === "pastor") && (
                    <button
                      type="button"
                      onClick={() => remove(c.id)}
                      className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      aria-label="답글 삭제"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-lg whitespace-pre-wrap break-words">{c.content}</p>
              </li>
            ))}
          </ul>
        )}

        {canComment && (
          <div className="flex gap-2 items-end">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="답글을 입력하세요 (예: 수고하셨어요!)"
              rows={2}
              className="flex-1"
              maxLength={1000}
            />
            <Button size="lg" onClick={send} loading={sending} disabled={!content.trim()} aria-label="답글 보내기">
              {!sending && <Send className="h-5 w-5" />}
              보내기
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
