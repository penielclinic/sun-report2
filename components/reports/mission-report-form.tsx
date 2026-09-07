"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Send, PlusCircle, Trash2, HandCoins, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea, Hint } from "@/components/ui/field";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { api } from "@/lib/api-client";
import { SPECIAL_CATEGORIES, type MissionReport, type SpecialCategory, type SpecialReportItem } from "@/types/database";
import { formatKoreanDate } from "@/lib/dates";

interface Props {
  reportDate: string;
  reportId: string | null;
  initialData: MissionReport | null;
  aggregated: { total_sun: number; total_attend: number; total_bible: number; total_offering: number };
  initialSpecialItems: SpecialReportItem[];
}

const CAT_TONE: Record<SpecialCategory, string> = {
  질병: "bg-rose-50 border-rose-200",
  재정문제: "bg-amber-50 border-amber-200",
  인간관계: "bg-violet-50 border-violet-200",
  진로및직장문제: "bg-indigo-50 border-indigo-200",
  기타: "bg-slate-50 border-slate-200",
};

export function MissionReportForm({ reportDate, reportId, initialData, aggregated, initialSpecialItems }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const [saving, setSaving] = useState<"draft" | "submitted" | null>(null);
  const [offering, setOffering] = useState(
    initialData?.total_offering ? String(initialData.total_offering) : aggregated.total_offering ? String(aggregated.total_offering) : ""
  );
  const [note, setNote] = useState(initialData?.special_note ?? "");
  const [items, setItems] = useState<{ category: SpecialCategory; content: string }[]>(
    initialSpecialItems.map((i) => ({ category: i.category, content: i.content }))
  );

  function updateItem(i: number, patch: Partial<{ category: SpecialCategory; content: string }>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  async function save(status: "draft" | "submitted") {
    if (status === "submitted") {
      const ok = await confirm({
        title: "선교회보고서를 제출할까요?",
        description: `${formatKoreanDate(reportDate)} 주일\n제출 순 ${aggregated.total_sun}개 · 주일낮 ${aggregated.total_attend}명 · 헌금 ${(parseInt(offering) || 0).toLocaleString()}원\n\n제출 후 순장님이 보고서를 고치면 합계가 자동으로 맞춰지고 알림이 와요. 그때 다시 제출하면 돼요.`,
        confirmLabel: "제출하기",
      });
      if (!ok) return;
    }
    setSaving(status);
    try {
      const res = await api<{ id: string }>("/api/reports/mission", {
        body: {
          reportId,
          report_date: reportDate,
          total_offering: parseInt(offering) || 0,
          special_note: note || null,
          status,
          special_items: items.filter((i) => i.content.trim()).map((i) => ({ category: i.category, content: i.content.trim() })),
        },
      });
      if (status === "submitted") {
        toast.success("선교회보고서를 제출했어요. 수고하셨어요!");
        router.replace(`/report/mission/${res.id}?submitted=1`);
      } else {
        toast.success("임시저장했어요");
        if (!reportId) router.replace(`/report/mission/${res.id}`);
      }
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-5 pb-6">
      <Card className="rise-in">
        <CardHeader>
          <CardTitle icon={<HandCoins className="h-6 w-6 text-amber-500" />}>헌금 현황</CardTitle>
          <CardDescription>
            순보고서 헌금 합계 <b className="text-amber-700">{aggregated.total_offering.toLocaleString()}원</b>이 자동으로 들어가요. 다르면 고쳐 주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field label="선교회 헌금 총액 (원)" htmlFor="offering">
            <Input id="offering" type="number" inputMode="numeric" min={0} value={offering} onChange={(e) => setOffering(e.target.value)} placeholder="0" className="text-right tabular-nums" />
            {offering && <Hint className="text-right font-bold text-amber-700">{(parseInt(offering) || 0).toLocaleString()}원</Hint>}
          </Field>
        </CardContent>
      </Card>

      <Card className="rise-in rise-in-2">
        <CardHeader>
          <CardTitle icon={<ClipboardList className="h-6 w-6 text-violet-600" />}>선교회 특별보고</CardTitle>
          <CardDescription>기도가 필요한 일을 종류별로 적어 주세요. 담임목사님이 진행상황을 관리해요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 && <p className="text-center text-base text-ink-soft py-2">등록된 항목이 없어요</p>}
          {items.map((it, i) => (
            <div key={i} className={"rounded-2xl border p-3 space-y-2 " + CAT_TONE[it.category]}>
              <div className="flex items-center gap-2">
                <Select value={it.category} onChange={(e) => updateItem(i, { category: e.target.value as SpecialCategory })} className="h-12 flex-1" aria-label="종류">
                  {SPECIAL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
                <Button variant="ghost" size="icon" className="text-rose-600 shrink-0" onClick={() => setItems((p) => p.filter((_, idx) => idx !== i))} aria-label="항목 삭제">
                  <Trash2 className="h-6 w-6" />
                </Button>
              </div>
              <Textarea value={it.content} onChange={(e) => updateItem(i, { content: e.target.value })} rows={2} placeholder="내용을 적어 주세요 (예: 3순 김OO 성도 수술 예정)" maxLength={1000} className="bg-white" />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setItems((p) => [...p, { category: "기타", content: "" }])}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50/50 py-4 text-lg font-bold text-violet-800 hover:bg-violet-100"
          >
            <PlusCircle className="h-6 w-6" /> 항목 추가
          </button>
        </CardContent>
      </Card>

      <Card className="rise-in rise-in-3">
        <CardHeader>
          <CardTitle>선교회장 한마디 (선택)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={2000} placeholder="담임목사님께 전할 말씀이 있으면 적어 주세요." />
        </CardContent>
      </Card>

      <div className="sticky bottom-20 md:bottom-4 z-30 rounded-3xl bg-white/90 backdrop-blur border shadow-pop p-3 grid grid-cols-2 gap-3">
        <Button variant="outline" size="xl" onClick={() => save("draft")} loading={saving === "draft"} disabled={!!saving}>
          {saving !== "draft" && <Save className="h-6 w-6" />}
          임시저장
        </Button>
        <Button variant="success" size="xl" onClick={() => save("submitted")} loading={saving === "submitted"} disabled={!!saving}>
          {saving !== "submitted" && <Send className="h-6 w-6" />}
          제출하기
        </Button>
      </div>
    </div>
  );
}
