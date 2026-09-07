"use client";

import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { MISSION_IDS, getMissionName, type SunEntry } from "@/lib/constants/sun-directory";
import { cn } from "@/lib/utils";

export function MembersBrowser({ entries }: { entries: SunEntry[] }) {
  const [q, setQ] = useState("");
  const [mission, setMission] = useState("all");
  const [sun, setSun] = useState("all");

  const sunOptions = mission === "all" ? entries : entries.filter((e) => e.missionId === Number(mission));

  const filtered = useMemo(() => {
    let list = entries;
    if (sun !== "all") list = list.filter((e) => e.sunNumber === Number(sun));
    else if (mission !== "all") list = list.filter((e) => e.missionId === Number(mission));
    const t = q.trim();
    if (t) list = list.map((e) => ({ ...e, members: e.members.filter((m) => m.includes(t)) })).filter((e) => e.members.length > 0 || e.sunLeader.includes(t));
    return list;
  }, [entries, q, mission, sun]);

  const count = filtered.reduce((s, e) => s + e.members.length, 0);

  return (
    <div className="space-y-4">
      <Card className="rise-in">
        <CardContent className="pt-5 space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="순원 이름으로 검색" className="pl-13" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={mission}
              onChange={(e) => {
                setMission(e.target.value);
                setSun("all");
              }}
              aria-label="선교회"
            >
              <option value="all">전체 선교회</option>
              {MISSION_IDS.map((m) => (
                <option key={m} value={m}>
                  {getMissionName(m)}
                </option>
              ))}
            </Select>
            <Select value={sun} onChange={(e) => setSun(e.target.value)} aria-label="순">
              <option value="all">전체 순</option>
              {sunOptions.map((e) => (
                <option key={e.sunNumber} value={e.sunNumber}>
                  {e.sunNumber}순 ({e.sunLeader})
                </option>
              ))}
            </Select>
          </div>
          <p className="text-base text-ink-soft">
            {filtered.length}순 · 순원 {count}명 표시 중
          </p>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState title="검색 결과가 없어요" />
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((e) => (
            <Card key={e.sunNumber} className="rise-in rise-in-2">
              <CardHeader className="flex items-center justify-between gap-2 pb-2">
                <CardTitle>
                  {e.sunNumber}순 <span className="text-base font-bold text-ink-soft">순장 {e.sunLeader}</span>
                </CardTitle>
                <div className="flex gap-1.5">
                  <Badge tone="brand">{getMissionName(e.missionId)}</Badge>
                  <Badge tone="emerald">
                    <Users className="h-4 w-4" /> {e.members.length}명
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {e.members.map((m) => {
                    const hit = q.trim() && m.includes(q.trim());
                    return (
                      <span key={m} className={cn("rounded-full border px-3 py-1 text-base whitespace-nowrap", hit ? "bg-brand-600 text-white border-brand-600 font-bold" : "bg-slate-50")}>
                        {m}
                      </span>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
