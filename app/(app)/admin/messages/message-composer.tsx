"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Send, MessageCircle, Users, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { BigCheck } from "@/components/ui/misc";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { api } from "@/lib/api-client";
import { getMissionName } from "@/lib/constants/sun-directory";
import { cn } from "@/lib/utils";

export interface Recipient {
  id: string;
  name: string;
  role: "sun_leader" | "mission_leader";
  sun_number: number | null;
  mission_id: number | null;
  phone: string | null;
}

type Group = "all" | "sun_leader" | "mission_leader" | "custom";

const label = (r: Recipient) => (r.role === "sun_leader" ? `${r.sun_number}순 ${r.name}` : `${getMissionName(r.mission_id ?? 0)} ${r.name}`);

export function MessageComposer({ recipients, senderName }: { recipients: Recipient[]; senderName: string }) {
  const confirm = useConfirm();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [group, setGroup] = useState<Group>("all");
  const [custom, setCustom] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  const sunLeaders = recipients.filter((r) => r.role === "sun_leader");
  const missionLeaders = recipients.filter((r) => r.role === "mission_leader");
  const targets = useMemo(() => {
    if (group === "all") return recipients;
    if (group === "sun_leader") return sunLeaders;
    if (group === "mission_leader") return missionLeaders;
    return recipients.filter((r) => custom.has(r.id));
  }, [group, custom, recipients, sunLeaders, missionLeaders]);

  function toggle(id: string) {
    setCustom((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function send() {
    if (!title.trim() || !body.trim()) return toast.error("제목과 내용을 입력해 주세요");
    if (targets.length === 0) return toast.error("받는 사람을 선택해 주세요");
    if (!(await confirm({ title: `${targets.length}명에게 보낼까요?`, description: `제목: ${title}`, confirmLabel: "보내기" }))) return;
    setSending(true);
    try {
      const res = await api<{ sent: number }>("/api/admin/messages", { body: { title, body, targetIds: targets.map((t) => t.id) } });
      toast.success(`${res.sent}명에게 보냈어요`);
      setTitle("");
      setBody("");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  const kakaoText = `[순보고 공지]\n\n${title}\n\n${body}\n\n— ${senderName} 목사`;
  async function copyForKakao() {
    if (!title.trim() || !body.trim()) return toast.error("제목과 내용을 입력해 주세요");
    try {
      await navigator.clipboard.writeText(kakaoText);
      toast.success("복사했어요. 카카오톡에 붙여넣기 하세요");
    } catch {
      toast.error("복사에 실패했어요");
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-4">
        <Card className="rise-in">
          <CardHeader>
            <CardTitle icon={<MessageCircle className="h-6 w-6 text-brand-600" />}>메시지 작성</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="제목" htmlFor="m-title">
              <Input id="m-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예) 이번 주 순장 모임 안내" maxLength={100} />
            </Field>
            <Field label="내용" htmlFor="m-body">
              <Textarea id="m-body" value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="내용을 입력하세요" maxLength={2000} />
            </Field>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3 rise-in rise-in-2">
          <Button size="xl" onClick={send} loading={sending}>
            {!sending && <Send className="h-6 w-6" />} 앱 알림 보내기
          </Button>
          <Button size="xl" variant="gold" onClick={copyForKakao}>
            <Copy className="h-6 w-6" /> 카톡용 복사
          </Button>
        </div>
      </div>

      <Card className="rise-in rise-in-2 h-fit">
        <CardHeader>
          <CardTitle icon={<Users className="h-6 w-6 text-emerald-600" />}>
            받는 사람 <Badge tone="brand">{targets.length}명</Badge>
          </CardTitle>
          <CardDescription>사용 중인 계정에게만 보내져요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["all", `전체 ${recipients.length}`],
                ["sun_leader", `순장 ${sunLeaders.length}`],
                ["mission_leader", `선교회장 ${missionLeaders.length}`],
                ["custom", "직접 선택"],
              ] as [Group, string][]
            ).map(([g, l]) => (
              <button key={g} type="button" onClick={() => setGroup(g)} className={cn("h-12 rounded-2xl border-2 text-base font-bold", group === g ? "bg-brand-600 border-brand-600 text-white" : "bg-white hover:border-brand-300")}>
                {l}
              </button>
            ))}
          </div>
          {group === "custom" && (
            <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setCustom(new Set(recipients.map((r) => r.id)))}>
                  전체 선택
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCustom(new Set())}>
                  모두 해제
                </Button>
              </div>
              {[
                ["선교회장", missionLeaders],
                ["순장", sunLeaders],
              ].map(([t, list]) => (
                <div key={t as string}>
                  <p className="text-base font-bold text-ink-soft mb-1">{t as string}</p>
                  <div className="space-y-1">
                    {(list as Recipient[]).map((r) => (
                      <BigCheck key={r.id} checked={custom.has(r.id)} onChange={() => toggle(r.id)} label={label(r)} size="sm" className="w-full justify-start px-1 py-0.5 rounded-xl hover:bg-slate-50" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {group !== "custom" && (
            <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto">
              {targets.map((r) => (
                <Badge key={r.id} tone={r.role === "sun_leader" ? "emerald" : "amber"}>
                  {label(r)}
                </Badge>
              ))}
              {targets.length === 0 && <p className="text-base text-ink-soft">사용 중인 계정이 없어요</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
