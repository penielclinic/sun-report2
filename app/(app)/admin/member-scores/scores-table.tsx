"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Medal } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { MISSION_IDS, getMissionName, getMissionShortName } from "@/lib/constants/sun-directory";
import { cn } from "@/lib/utils";

export interface ScoreRow {
  rank: number;
  name: string;
  sun: number;
  mission: number;
  samil: number;
  friday: number;
  sunDay: number;
  sunEve: number;
  sun_: number;
  evangelism: number;
  totalBible: number;
  score: number;
}

const MEDAL = ["text-amber-500", "text-slate-400", "text-orange-600"];

export function ScoresTable({ rows, period, from, to }: { rows: ScoreRow[]; period: string; from: string; to: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [mission, setMission] = useState("all");
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);

  const filtered = useMemo(
    () => rows.filter((r) => (mission === "all" || r.mission === Number(mission)) && (!q.trim() || r.name.includes(q.trim()))),
    [rows, q, mission]
  );

  return (
    <Card className="rise-in rise-in-2">
      <CardHeader className="space-y-3 no-print">
        {period === "custom" && (
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/admin/member-scores?period=custom&from=${f}&to=${t}`);
            }}
          >
            <Input type="date" value={f} onChange={(e) => setF(e.target.value)} className="w-auto" aria-label="시작일" />
            <span className="text-lg font-bold pb-3">~</span>
            <Input type="date" value={t} onChange={(e) => setT(e.target.value)} className="w-auto" aria-label="종료일" />
            <Button type="submit" size="md">
              조회
            </Button>
          </form>
        )}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[12rem]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름 검색" className="pl-12 h-12" />
          </div>
          <Select value={mission} onChange={(e) => setMission(e.target.value)} className="h-12 w-auto min-w-[10rem]" aria-label="선교회 필터">
            <option value="all">전체 선교회</option>
            {MISSION_IDS.map((m) => (
              <option key={m} value={m}>
                {getMissionName(m)}
              </option>
            ))}
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <EmptyState title="해당하는 순원이 없어요" description="기간에 제출된 순보고서가 없거나 검색 조건에 맞는 순원이 없어요." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead>
                <tr className="bg-slate-50 border-y text-[0.95rem]">
                  <th className="px-3 py-3 text-center font-bold">순위</th>
                  <th className="px-2 py-3 text-left font-bold whitespace-nowrap">이름</th>
                  <th className="px-2 py-3 text-left font-bold whitespace-nowrap">소속</th>
                  <th className="px-2 py-3 text-center font-bold">삼일</th>
                  <th className="px-2 py-3 text-center font-bold">금요</th>
                  <th className="px-2 py-3 text-center font-bold">주낮</th>
                  <th className="px-2 py-3 text-center font-bold">주밤</th>
                  <th className="px-2 py-3 text-center font-bold whitespace-nowrap">순모임</th>
                  <th className="px-2 py-3 text-center font-bold">전도</th>
                  <th className="px-2 py-3 text-center font-bold">성경</th>
                  <th className="px-3 py-3 text-right font-bold">점수</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={`${r.sun}-${r.name}`} className={cn("border-b last:border-0", i % 2 ? "bg-slate-50/40" : "", r.rank <= 3 && "bg-amber-50/60")}>
                    <td className="px-3 py-2.5 text-center font-black tabular-nums">
                      {r.rank <= 3 ? <Medal className={"inline h-6 w-6 " + MEDAL[r.rank - 1]} /> : r.rank}
                    </td>
                    <td className="px-2 py-2.5 font-bold whitespace-nowrap">{r.name}</td>
                    <td className="px-2 py-2.5 whitespace-nowrap text-ink-soft">
                      {getMissionShortName(r.mission)} {r.sun}순
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums">{r.samil}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums">{r.friday}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums">{r.sunDay}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums">{r.sunEve}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums">{r.sun_}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-orange-700 font-bold">{r.evangelism}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-emerald-700 font-bold">{r.totalBible}</td>
                    <td className="px-3 py-2.5 text-right font-black tabular-nums text-brand-700">{r.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
