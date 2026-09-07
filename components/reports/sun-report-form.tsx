"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusCircle, Trash2, Save, Send, ChevronDown, ChevronUp, Users, CalendarDays, BookOpenText, Sparkles, HandCoins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea, Hint, Label } from "@/components/ui/field";
import { BigCheck } from "@/components/ui/misc";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { ATTEND_COLS, type AttendKey, type Profile, type SunReport, type SunReportMember } from "@/types/database";
import { formatKoreanDate, isSunday, recentSundays, addDays, currentReportSunday } from "@/lib/dates";
import { getSunLabel } from "@/lib/constants/sun-directory";

interface Props {
  profile: Profile;
  reportDate: string;
  reportId: string | null;
  initialData: { report: SunReport; members: SunReportMember[] } | null;
  /** 새 보고서의 기본 순원 명단 */
  defaultMembers: string[];
}

type MemberRow = {
  member_name: string;
  attend_samil: boolean;
  attend_friday: boolean;
  attend_sun_day: boolean;
  attend_sun_eve: boolean;
  attend_sun: boolean;
  evangelism: boolean;
  bulletin_recv: boolean;
  bible_read: number;
  member_note: string;
};

const emptyMember = (name = ""): MemberRow => ({
  member_name: name,
  attend_samil: false,
  attend_friday: false,
  attend_sun_day: false,
  attend_sun_eve: false,
  attend_sun: false,
  evangelism: false,
  bulletin_recv: false,
  bible_read: 0,
  member_note: "",
});

const WORSHIP_TIMES = ["오전 10시", "오전 11시", "오후 1시", "오후 2시", "오후 3시", "오후 7시", "오후 8시"];
const WORSHIP_PLACES = ["교회", "본당", "교육관", "소예배실", "가정", "식당·카페"];

function parseWorshipAt(text: string | null | undefined, fallbackDate: string) {
  if (!text) return { date: fallbackDate, time: "오전 11시" };
  const d = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  const t = text.match(/(오전|오후)\s*\d+시/);
  return { date: d ? d[0] : fallbackDate, time: t ? t[0].replace(/\s+/, " ") : "오전 11시" };
}

const CHECK_TONE: Record<AttendKey, "indigo" | "violet" | "amber" | "rose" | "emerald" | "orange"> = {
  attend_samil: "indigo",
  attend_friday: "violet",
  attend_sun_day: "amber",
  attend_sun_eve: "rose",
  attend_sun: "emerald",
  evangelism: "orange",
};

const DRAFT_KEY = (sun: number, date: string) => `sunbogo:draft:${sun}:${date}`;

export function SunReportForm({ profile, reportDate, reportId, initialData, defaultMembers }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const [saving, setSaving] = useState<"draft" | "submitted" | null>(null);
  const [selectedDate, setSelectedDate] = useState(reportDate);

  const wa = parseWorshipAt(initialData?.report.worship_at, reportDate);
  const [worshipDate, setWorshipDate] = useState(wa.date);
  const [worshipTime, setWorshipTime] = useState(wa.time);
  const initPlace = initialData?.report.worship_place ?? "교회";
  const [placeSel, setPlaceSel] = useState(WORSHIP_PLACES.includes(initPlace) ? initPlace : "기타");
  const [placeCustom, setPlaceCustom] = useState(WORSHIP_PLACES.includes(initPlace) ? "" : initPlace);
  const [worshipLeader, setWorshipLeader] = useState(initialData?.report.worship_leader ?? profile.name);
  const [specialNote, setSpecialNote] = useState(initialData?.report.special_note ?? "");
  const [manualBible, setManualBible] = useState(initialData?.report.bible_chapters ? String(initialData.report.bible_chapters) : "");
  const [offering, setOffering] = useState(initialData?.report.offering ? String(initialData.report.offering) : "");
  const [members, setMembers] = useState<MemberRow[]>(() =>
    initialData?.members.length
      ? initialData.members.map((m) => ({
          member_name: m.member_name,
          attend_samil: m.attend_samil,
          attend_friday: m.attend_friday,
          attend_sun_day: m.attend_sun_day,
          attend_sun_eve: m.attend_sun_eve,
          attend_sun: m.attend_sun,
          evangelism: m.evangelism,
          bulletin_recv: m.bulletin_recv,
          bible_read: m.bible_read,
          member_note: m.member_note ?? "",
        }))
      : defaultMembers.map((n) => emptyMember(n))
  );
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [restored, setRestored] = useState(false);
  const newRowRef = useRef<HTMLInputElement>(null);

  // ── 브라우저 임시 저장 (네트워크 끊김 대비) ──
  const draftKey = DRAFT_KEY(profile.sun_number ?? 0, selectedDate);
  useEffect(() => {
    if (reportId || restored) return;
    const t = setTimeout(() => {
      try {
        const raw = localStorage.getItem(draftKey);
        if (raw) {
          const d = JSON.parse(raw);
          if (Array.isArray(d.members) && d.members.length) {
            setMembers(d.members);
            setSpecialNote(d.specialNote ?? "");
            setOffering(d.offering ?? "");
            setManualBible(d.manualBible ?? "");
            toast.info("저장하지 않은 내용을 불러왔어요");
          }
        }
      } catch {}
      setRestored(true);
    }, 0);
    return () => clearTimeout(t);
  }, [draftKey, reportId, restored]);

  useEffect(() => {
    if (!restored) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ members, specialNote, offering, manualBible }));
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [members, specialNote, offering, manualBible, draftKey, restored]);

  const worshipPlace = placeSel === "기타" ? placeCustom : placeSel;
  const counts = useMemo(() => {
    const c = {} as Record<AttendKey, number>;
    for (const col of ATTEND_COLS) c[col.key] = members.filter((m) => m.member_name.trim() && m[col.key]).length;
    return c;
  }, [members]);
  const autoBible = members.reduce((s, m) => s + (m.bible_read || 0), 0);
  const bibleChapters = manualBible !== "" ? parseInt(manualBible) || 0 : autoBible;
  const validCount = members.filter((m) => m.member_name.trim()).length;

  function update(idx: number, patch: Partial<MemberRow>) {
    setMembers((prev) => prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  }
  function addMember() {
    setMembers((prev) => [...prev, emptyMember()]);
    setOpenIdx(members.length);
    setTimeout(() => newRowRef.current?.focus(), 50);
  }
  async function removeMember(idx: number) {
    const name = members[idx].member_name || "이 순원";
    if (!(await confirm({ title: `${name}을(를) 명단에서 뺄까요?`, description: "다음 주 보고서 명단에서도 빠져요. 나중에 다시 추가할 수 있어요.", danger: true, confirmLabel: "빼기" }))) return;
    setMembers((prev) => prev.filter((_, i) => i !== idx));
    setOpenIdx(null);
  }
  function toggleAll(key: AttendKey) {
    const allOn = members.every((m) => !m.member_name.trim() || m[key]);
    setMembers((prev) => prev.map((m) => (m.member_name.trim() ? { ...m, [key]: !allOn } : m)));
  }

  async function save(status: "draft" | "submitted") {
    if (!isSunday(selectedDate)) return toast.error("보고 날짜는 주일(일요일)이어야 해요");
    if (status === "submitted") {
      const ok = await confirm({
        title: "보고서를 제출할까요?",
        description: `${formatKoreanDate(selectedDate)} 주일\n주일낮예배 ${counts.attend_sun_day}명 · 순모임 ${counts.attend_sun}명 · 성경 ${bibleChapters}장\n\n제출 후에도 언제든 고쳐서 다시 제출할 수 있어요.`,
        confirmLabel: "제출하기",
      });
      if (!ok) return;
    }
    setSaving(status);
    try {
      const res = await api<{ id: string }>("/api/reports/sun", {
        body: {
          reportId,
          report_date: selectedDate,
          worship_date: worshipDate || null,
          worship_time: worshipTime,
          worship_place: worshipPlace || null,
          worship_leader: worshipLeader || null,
          bible_chapters: manualBible !== "" ? parseInt(manualBible) || 0 : null,
          offering: parseInt(offering) || 0,
          special_note: specialNote || null,
          status,
          members: members.filter((m) => m.member_name.trim()).map((m) => ({ ...m, bible_read: m.bible_read || 0 })),
        },
      });
      try {
        localStorage.removeItem(draftKey);
      } catch {}
      if (status === "submitted") {
        toast.success("순보고서를 제출했어요. 수고하셨어요!");
        router.replace(`/report/sun/${res.id}?submitted=1`);
      } else {
        toast.success("임시저장했어요");
        if (!reportId) router.replace(`/report/sun/${res.id}`);
      }
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(null);
    }
  }

  const sundayOptions = useMemo(() => {
    const next = addDays(currentReportSunday(), 7);
    const list = [next, ...recentSundays(12)];
    if (!list.includes(selectedDate)) list.push(selectedDate);
    return [...new Set(list)].sort((a, b) => b.localeCompare(a));
  }, [selectedDate]);

  return (
    <div className="space-y-5 pb-6">
      {/* 기본 정보 */}
      <Card className="rise-in">
        <CardHeader>
          <CardTitle icon={<CalendarDays className="h-6 w-6 text-brand-600" />}>
            {getSunLabel(profile.sun_number ?? 0)} · {profile.name} 순장
          </CardTitle>
          <CardDescription>예배 정보를 확인하고 필요하면 고쳐 주세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Field label="보고 주일" htmlFor="report-date" hint={reportId ? "저장된 보고서의 날짜는 바꿀 수 없어요" : "다른 주일 보고서를 쓰려면 날짜를 바꿔 주세요"}>
            <Select id="report-date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} disabled={!!reportId}>
              {sundayOptions.map((d) => (
                <option key={d} value={d}>
                  {formatKoreanDate(d)}
                  {d === currentReportSunday() ? " — 이번 주" : ""}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="순모임 날짜" htmlFor="wdate">
              <Input id="wdate" type="date" value={worshipDate} onChange={(e) => setWorshipDate(e.target.value)} />
            </Field>
            <Field label="순모임 시간" htmlFor="wtime">
              <Select id="wtime" value={worshipTime} onChange={(e) => setWorshipTime(e.target.value)}>
                {WORSHIP_TIMES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="장소" htmlFor="wplace">
              <Select id="wplace" value={placeSel} onChange={(e) => setPlaceSel(e.target.value)}>
                {WORSHIP_PLACES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
                <option value="기타">기타 (직접 입력)</option>
              </Select>
              {placeSel === "기타" && (
                <Input className="mt-2" value={placeCustom} onChange={(e) => setPlaceCustom(e.target.value)} placeholder="장소를 입력하세요" maxLength={50} />
              )}
            </Field>
            <Field label="인도자" htmlFor="wleader">
              <Input id="wleader" value={worshipLeader} onChange={(e) => setWorshipLeader(e.target.value)} placeholder="인도자 이름" maxLength={30} />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* 출석 요약 */}
      <Card className="rise-in rise-in-2">
        <CardHeader>
          <CardTitle icon={<Sparkles className="h-6 w-6 text-amber-500" />}>출석 요약</CardTitle>
          <CardDescription>아래 순원 명단에서 체크하면 자동으로 계산돼요.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {ATTEND_COLS.map((c) => (
              <div key={c.key} className={cn("rounded-2xl border py-3 text-center", TONE_BG[c.key])}>
                <p className="text-3xl font-black tabular-nums">{counts[c.key]}</p>
                <p className="text-[0.9rem] font-bold opacity-80">{c.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 순원 명단 */}
      <Card className="rise-in rise-in-3">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle icon={<Users className="h-6 w-6 text-emerald-600" />}>
              순원 출석 체크 <span className="text-base font-bold text-ink-soft">({validCount}명)</span>
            </CardTitle>
            <CardDescription>이름 옆 네모를 누르면 체크돼요. 이름을 누르면 성경장수·메모를 적을 수 있어요.</CardDescription>
          </div>
        </CardHeader>

        {/* 열 머리글 + 전체 선택 */}
        <div className="hidden sm:grid grid-cols-[1fr_repeat(6,3.4rem)_2.5rem] items-center gap-1 px-6 pb-2 text-center text-[0.85rem] font-bold text-ink-soft">
          <span className="text-left">이름 (누르면 상세)</span>
          {ATTEND_COLS.map((c) => (
            <button key={c.key} type="button" onClick={() => toggleAll(c.key)} className="rounded-lg py-1 hover:bg-brand-50" title={`${c.label} 전체 선택/해제`}>
              {c.short}
            </button>
          ))}
          <span />
        </div>

        <CardContent className="p-0">
          <ul className="divide-y">
            {members.map((m, idx) => {
              const open = openIdx === idx;
              const isNew = idx === members.length - 1 && !m.member_name;
              return (
                <li key={idx} className={cn("px-3 sm:px-6 py-3 transition-colors", open ? "bg-emerald-50/70" : idx % 2 ? "bg-slate-50/50" : "bg-white")}>
                  <div className="sm:grid sm:grid-cols-[1fr_repeat(6,3.4rem)_2.5rem] sm:items-center sm:gap-1">
                    {/* 이름 */}
                    <div className="flex items-center gap-2 min-w-0">
                      {isNew || open ? (
                        <Input
                          ref={isNew ? newRowRef : undefined}
                          value={m.member_name}
                          onChange={(e) => update(idx, { member_name: e.target.value })}
                          placeholder="순원 이름"
                          className="h-12 text-lg"
                          maxLength={30}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setOpenIdx(idx)}
                          className="flex-1 min-w-0 text-left h-12 px-2 rounded-xl text-lg font-bold hover:bg-brand-50 flex items-center gap-2"
                        >
                          <span className="truncate">{m.member_name || "(이름 없음)"}</span>
                          {m.bible_read > 0 && <span className="text-sm font-bold text-emerald-700 whitespace-nowrap">📖 {m.bible_read}장</span>}
                          {m.member_note && <span className="text-sm text-slate-500">📝</span>}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setOpenIdx(open ? null : idx)}
                        className="sm:hidden grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ink-soft hover:bg-black/5"
                        aria-label={open ? "접기" : "펼치기"}
                      >
                        {open ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
                      </button>
                    </div>

                    {/* 체크 6개 */}
                    <div className="mt-2 sm:mt-0 grid grid-cols-6 gap-1 sm:contents">
                      {ATTEND_COLS.map((c) => (
                        <div key={c.key} className="flex flex-col items-center gap-0.5">
                          <span className="sm:hidden text-[0.75rem] font-bold text-ink-soft">{c.short}</span>
                          <BigCheck checked={m[c.key]} onChange={(v) => update(idx, { [c.key]: v })} tone={CHECK_TONE[c.key]} />
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setOpenIdx(open ? null : idx)}
                      className="hidden sm:grid h-10 w-10 place-items-center rounded-xl text-ink-soft hover:bg-black/5"
                      aria-label={open ? "접기" : "펼치기"}
                    >
                      {open ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
                    </button>
                  </div>

                  {open && (
                    <div className="mt-3 rounded-2xl border border-emerald-200 bg-white p-4 space-y-3">
                      <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
                        <Field label="성경 읽은 장수" htmlFor={`bible-${idx}`}>
                          <Input
                            id={`bible-${idx}`}
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={2000}
                            value={m.bible_read || ""}
                            onChange={(e) => update(idx, { bible_read: Math.max(0, Math.min(2000, parseInt(e.target.value) || 0)) })}
                            placeholder="0"
                            className="text-center"
                          />
                        </Field>
                        <div>
                          <Label>주보 전달</Label>
                          <BigCheck checked={m.bulletin_recv} onChange={(v) => update(idx, { bulletin_recv: v })} label={m.bulletin_recv ? "전달했어요" : "안 했어요"} tone="brand" />
                        </div>
                      </div>
                      <Field label="개별 메모 (선택)" htmlFor={`note-${idx}`}>
                        <Input id={`note-${idx}`} value={m.member_note} onChange={(e) => update(idx, { member_note: e.target.value })} placeholder="예) 병원 입원 중, 기도 부탁" maxLength={300} />
                      </Field>
                      <div className="flex justify-between">
                        <Button variant="ghost" size="sm" className="text-rose-600" onClick={() => removeMember(idx)}>
                          <Trash2 className="h-5 w-5" /> 명단에서 빼기
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setOpenIdx(null)}>
                          닫기
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={addMember}
            className="w-full flex items-center justify-center gap-2 py-4 text-lg font-bold text-brand-700 hover:bg-brand-50 border-t"
          >
            <PlusCircle className="h-6 w-6" /> 순원 추가 (새가족 등)
          </button>
        </CardContent>
      </Card>

      {/* 성경·헌금 */}
      <Card className="rise-in rise-in-3">
        <CardHeader>
          <CardTitle icon={<BookOpenText className="h-6 w-6 text-emerald-600" />}>성경 읽기 · 헌금</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="성경 읽은 장수 (순 전체)" htmlFor="bible-total" hint={`순원별 입력 합계 ${autoBible}장. 비워 두면 합계가 그대로 들어가요.`}>
            <Input id="bible-total" type="number" inputMode="numeric" min={0} value={manualBible} onChange={(e) => setManualBible(e.target.value)} placeholder={String(autoBible)} />
          </Field>
          <Field label="헌금 (원)" htmlFor="offering" hint="개인별 금액은 적지 않아요. 우리 순 이번 주 합계만 적어 주세요.">
            <div className="relative">
              <HandCoins className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-amber-500" />
              <Input id="offering" type="number" inputMode="numeric" min={0} value={offering} onChange={(e) => setOffering(e.target.value)} placeholder="0" className="pl-13 text-right pr-4 tabular-nums" />
            </div>
            {offering && <Hint className="text-right font-bold text-amber-700">{(parseInt(offering) || 0).toLocaleString()}원</Hint>}
          </Field>
        </CardContent>
      </Card>

      {/* 특별보고 */}
      <Card className="rise-in rise-in-4">
        <CardHeader>
          <CardTitle icon={<Sparkles className="h-6 w-6 text-violet-600" />}>특별보고 · 기도제목</CardTitle>
          <CardDescription>아픈 분, 기쁜 소식, 심방이 필요한 분 등을 자유롭게 적어 주세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea value={specialNote} onChange={(e) => setSpecialNote(e.target.value)} rows={4} maxLength={2000} placeholder="예) 김OO 성도님 수술 후 회복 중, 기도 부탁드립니다." />
        </CardContent>
      </Card>

      {/* 저장 버튼 (하단 고정) */}
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

const TONE_BG: Record<AttendKey, string> = {
  attend_samil: "bg-indigo-50 border-indigo-100 text-indigo-800",
  attend_friday: "bg-violet-50 border-violet-100 text-violet-800",
  attend_sun_day: "bg-amber-50 border-amber-100 text-amber-800",
  attend_sun_eve: "bg-rose-50 border-rose-100 text-rose-800",
  attend_sun: "bg-emerald-50 border-emerald-100 text-emerald-800",
  evangelism: "bg-orange-50 border-orange-100 text-orange-800",
};
