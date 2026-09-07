"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, Textarea, Label } from "@/components/ui/field";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { api } from "@/lib/api-client";
import { SPECIAL_CATEGORIES, SPECIAL_STATUSES, type SpecialCategory, type SpecialReportItem, type SpecialStatus } from "@/types/database";
import { getMissionName } from "@/lib/constants/sun-directory";
import { formatShortDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<SpecialStatus, BadgeTone> = { 기도중: "sky", 진행중: "orange", 해결됨: "emerald" };
const CAT_TONE: Record<SpecialCategory, BadgeTone> = { 질병: "rose", 재정문제: "amber", 인간관계: "violet", 진로및직장문제: "brand", 기타: "gray" };

export function SpecialItemsManager({ items: initial }: { items: SpecialReportItem[] }) {
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState<string | null>(null);
  const [cat, setCat] = useState<SpecialCategory | "all">("all");
  const [st, setSt] = useState<SpecialStatus | "all">("all");
  const [drafts, setDrafts] = useState<Record<string, { status: SpecialStatus; memo: string }>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(() => items.filter((i) => (cat === "all" || i.category === cat) && (st === "all" || i.status === st)), [items, cat, st]);
  const counts = Object.fromEntries(SPECIAL_STATUSES.map((s) => [s, items.filter((i) => i.status === s).length])) as Record<SpecialStatus, number>;

  function draft(i: SpecialReportItem) {
    return drafts[i.id] ?? { status: i.status, memo: i.pastor_memo ?? "" };
  }

  async function save(i: SpecialReportItem) {
    const d = draft(i);
    setBusy(i.id);
    try {
      await api("/api/admin/special-items", { method: "PATCH", body: { id: i.id, status: d.status, pastor_memo: d.memo || null } });
      setItems((prev) => prev.map((x) => (x.id === i.id ? { ...x, status: d.status, pastor_memo: d.memo || null } : x)));
      toast.success("저장했어요");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:gap-3 rise-in">
        {SPECIAL_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSt(st === s ? "all" : s)}
            className={cn("rounded-3xl border-2 bg-white p-4 text-center shadow-soft transition-all", st === s ? "border-brand-500 scale-[1.02]" : "border-transparent hover:border-brand-200")}
          >
            <p className="text-4xl font-black tabular-nums">{counts[s]}</p>
            <Badge tone={STATUS_TONE[s]} className="mt-1">
              {s}
            </Badge>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 rise-in rise-in-2">
        <Select value={cat} onChange={(e) => setCat(e.target.value as SpecialCategory | "all")} className="h-12 w-auto min-w-[12rem]" aria-label="종류">
          <option value="all">전체 종류</option>
          {SPECIAL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select value={st} onChange={(e) => setSt(e.target.value as SpecialStatus | "all")} className="h-12 w-auto min-w-[10rem]" aria-label="진행상황">
          <option value="all">전체 상태</option>
          {SPECIAL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState title="해당하는 특별보고가 없어요" description="선교회장님이 선교회보고서에 특별보고를 등록하면 여기에 모여요." />
        </Card>
      ) : (
        <Card className="rise-in rise-in-3">
          <CardHeader>
            <CardTitle>
              특별보고 목록 <span className="text-base font-bold text-ink-soft">({filtered.length}건)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {filtered.map((i) => {
                const d = draft(i);
                const isOpen = open === i.id;
                return (
                  <li key={i.id}>
                    <button type="button" onClick={() => setOpen(isOpen ? null : i.id)} className="w-full text-left flex items-start justify-between gap-3 px-5 py-4 sm:px-6 hover:bg-brand-50/40">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Badge tone={CAT_TONE[i.category]}>{i.category}</Badge>
                          <Badge tone={STATUS_TONE[i.status]}>{i.status}</Badge>
                          <span className="text-base text-ink-soft">
                            {formatShortDate(i.report_date)} · {getMissionName(i.mission_id)} {i.mission_leader}
                          </span>
                          {i.pastor_memo && <span className="text-base font-bold text-violet-700">메모 있음</span>}
                        </div>
                        <p className={cn("text-lg", !isOpen && "line-clamp-2")}>{i.content}</p>
                      </div>
                      {isOpen ? <ChevronUp className="h-6 w-6 shrink-0 text-slate-400" /> : <ChevronDown className="h-6 w-6 shrink-0 text-slate-400" />}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 sm:px-6 bg-slate-50/70 border-t space-y-3 pt-4">
                        <div className="grid gap-3 sm:grid-cols-[14rem_1fr]">
                          <div>
                            <Label>진행상황</Label>
                            <Select value={d.status} onChange={(e) => setDrafts((p) => ({ ...p, [i.id]: { ...d, status: e.target.value as SpecialStatus } }))} className="h-12">
                              {SPECIAL_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </Select>
                          </div>
                          <div>
                            <Label>목사님 메모</Label>
                            <Textarea value={d.memo} onChange={(e) => setDrafts((p) => ({ ...p, [i.id]: { ...d, memo: e.target.value } }))} rows={3} placeholder="심방·상담·기도 내용 등" maxLength={1000} className="bg-white" />
                          </div>
                        </div>
                        <Button size="md" onClick={() => save(i)} loading={busy === i.id}>
                          {busy !== i.id && <Save className="h-5 w-5" />} 저장
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
