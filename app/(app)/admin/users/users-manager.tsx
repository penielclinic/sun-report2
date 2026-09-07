"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Trash2, KeyRound, UserPlus, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { api } from "@/lib/api-client";
import { validatePin, validateLoginId } from "@/lib/auth/login-id";
import { SUN_DIRECTORY, MISSION_IDS, getMissionName, BRIDGE_SUN_NUMBER } from "@/lib/constants/sun-directory";
import { ROLE_LABEL, type Profile, type ProfileStatus, type Role } from "@/types/database";
import { cn } from "@/lib/utils";

const STATUS: Record<ProfileStatus, { label: string; tone: "amber" | "emerald" | "rose" }> = {
  pending: { label: "승인 대기", tone: "amber" },
  active: { label: "사용 중", tone: "emerald" },
  rejected: { label: "중지됨", tone: "rose" },
};
const ROLE_TONE: Record<Role, "emerald" | "amber" | "violet"> = { sun_leader: "emerald", mission_leader: "amber", pastor: "violet" };

export function UsersManager({ users: initial, currentUserId }: { users: Profile[]; currentUserId: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [users, setUsers] = useState(initial);
  const [filter, setFilter] = useState<ProfileStatus | "all">(initial.some((u) => u.status === "pending") ? "pending" : "all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // 신규 계정 생성
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", pin: "", role: "sun_leader" as Role, sun_number: "", mission_id: "", phone: "" });

  const filtered = useMemo(
    () => users.filter((u) => (filter === "all" || u.status === filter) && (!q.trim() || u.name.includes(q.trim()) || u.login_id.includes(q.trim().toLowerCase()))),
    [users, filter, q]
  );

  async function patch(userId: string, updates: Record<string, unknown>, okMsg: string) {
    setBusy(userId);
    try {
      await api("/api/admin/users", { method: "PATCH", body: { userId, updates } });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...(updates as Partial<Profile>) } : u)));
      toast.success(okMsg);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function resetPin(u: Profile, pin: string) {
    const err = validatePin(pin);
    if (err) {
      toast.error(err);
      return;
    }
    if (!(await confirm({ title: `${u.name}님 비밀번호를 바꿀까요?`, description: `새 비밀번호: ${pin}\n본인에게 꼭 알려 주세요.` }))) return;
    setBusy(u.id);
    try {
      await api("/api/admin/users", { method: "PUT", body: { userId: u.id, pin } });
      toast.success("비밀번호를 바꿨어요");
    } catch (er) {
      toast.error((er as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function remove(u: Profile) {
    if (!(await confirm({ title: `${u.name} 계정을 삭제할까요?`, description: "로그인할 수 없게 돼요. 작성한 보고서는 남아 있어요.", danger: true, confirmLabel: "삭제" }))) return;
    setBusy(u.id);
    try {
      await api("/api/admin/users", { method: "DELETE", body: { userId: u.id } });
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      toast.success("삭제했어요");
      router.refresh();
    } catch (er) {
      toast.error((er as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const idErr = validateLoginId(form.name);
    if (idErr) return toast.error(idErr);
    const pinErr = validatePin(form.pin);
    if (pinErr) return toast.error(pinErr);
    setCreating(true);
    try {
      await api("/api/auth/register", {
        body: {
          login_id: form.name,
          name: form.name,
          pin: form.pin,
          phone: form.phone || null,
          role: form.role,
          sun_number: form.role === "sun_leader" ? Number(form.sun_number) || null : null,
          mission_id: form.role === "mission_leader" ? Number(form.mission_id) || null : null,
          auto_approve: true,
        },
      });
      toast.success(`${form.name} 계정을 만들었어요 (비밀번호 ${form.pin})`);
      setForm({ name: "", pin: "", role: "sun_leader", sun_number: "", mission_id: "", phone: "" });
      setShowCreate(false);
      router.refresh();
    } catch (er) {
      toast.error((er as Error).message);
    } finally {
      setCreating(false);
    }
  }

  const counts = { all: users.length, pending: users.filter((u) => u.status === "pending").length, active: users.filter((u) => u.status === "active").length, rejected: users.filter((u) => u.status === "rejected").length };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rise-in">
        {(["pending", "all", "active", "rejected"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={cn("rounded-full border-2 px-4 h-12 text-base font-bold transition-colors", filter === s ? "bg-brand-600 border-brand-600 text-white" : "bg-white text-ink-soft hover:border-brand-300")}
          >
            {s === "all" ? "전체" : STATUS[s].label} {counts[s]}
          </button>
        ))}
      </div>

      <Card className="rise-in rise-in-2">
        <button type="button" className="w-full flex items-center justify-between px-5 py-4 sm:px-6 text-left" onClick={() => setShowCreate((v) => !v)}>
          <span className="flex items-center gap-2 text-xl font-black">
            <UserPlus className="h-6 w-6 text-brand-600" /> 계정 직접 만들기
          </span>
          {showCreate ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
        </button>
        {showCreate && (
          <CardContent>
            <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
              <Field label="역할" htmlFor="c-role">
                <Select id="c-role" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role, sun_number: "", mission_id: "" }))}>
                  <option value="sun_leader">순장</option>
                  <option value="mission_leader">선교회장</option>
                  <option value="pastor">담임목사</option>
                </Select>
              </Field>
              {form.role === "sun_leader" && (
                <Field label="담당 순" htmlFor="c-sun">
                  <Select
                    id="c-sun"
                    value={form.sun_number}
                    onChange={(e) => {
                      const v = e.target.value;
                      const entry = SUN_DIRECTORY.find((s) => s.sunNumber === Number(v));
                      setForm((f) => ({ ...f, sun_number: v, name: f.name || (entry && entry.sunNumber !== BRIDGE_SUN_NUMBER ? entry.sunLeader : "") }));
                    }}
                    required
                  >
                    <option value="">선택</option>
                    {SUN_DIRECTORY.map((s) => (
                      <option key={s.sunNumber} value={s.sunNumber}>
                        {s.sunNumber}순 — {s.sunLeader}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              {form.role === "mission_leader" && (
                <Field label="소속 선교회" htmlFor="c-mission">
                  <Select id="c-mission" value={form.mission_id} onChange={(e) => setForm((f) => ({ ...f, mission_id: e.target.value }))} required>
                    <option value="">선택</option>
                    {MISSION_IDS.map((m) => (
                      <option key={m} value={m}>
                        {getMissionName(m)}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              <Field label="이름 (아이디)" htmlFor="c-name">
                <Input id="c-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </Field>
              <Field label="비밀번호 (숫자 4~8자리)" htmlFor="c-pin">
                <Input id="c-pin" inputMode="numeric" value={form.pin} onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, "").slice(0, 8) }))} required />
              </Field>
              <Field label="전화번호 (선택)" htmlFor="c-phone">
                <Input id="c-phone" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </Field>
              <div className="sm:col-span-2">
                <Button type="submit" size="lg" loading={creating} full>
                  계정 만들기 (바로 사용 가능)
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      <div className="relative rise-in rise-in-2">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름으로 찾기" className="pl-13 bg-white" />
      </div>

      <Card className="rise-in rise-in-3">
        <CardContent className="p-0">
          {filtered.length === 0 && <p className="py-10 text-center text-lg text-ink-soft">해당하는 사용자가 없어요</p>}
          <ul className="divide-y">
            {filtered.map((u) => (
              <li key={u.id}>
                <button type="button" className="w-full flex items-center justify-between gap-3 px-5 py-4 sm:px-6 text-left hover:bg-brand-50/50" onClick={() => setOpen(open === u.id ? null : u.id)}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xl font-black">{u.name}</span>
                      <Badge tone={ROLE_TONE[u.role]}>{ROLE_LABEL[u.role]}</Badge>
                      <Badge tone={STATUS[u.status].tone}>{STATUS[u.status].label}</Badge>
                      {u.id === currentUserId && <Badge tone="brand">나</Badge>}
                    </div>
                    <p className="text-base text-ink-soft mt-0.5">
                      아이디 {u.login_id}
                      {u.role === "sun_leader" && u.sun_number ? ` · ${u.sun_number}순` : ""}
                      {u.role === "mission_leader" && u.mission_id ? ` · ${getMissionName(u.mission_id)}` : ""}
                      {u.phone ? ` · ${u.phone}` : ""}
                    </p>
                  </div>
                  {open === u.id ? <ChevronUp className="h-6 w-6 shrink-0 text-slate-400" /> : <ChevronDown className="h-6 w-6 shrink-0 text-slate-400" />}
                </button>
                {open === u.id && <UserEditor u={u} busy={busy === u.id} isSelf={u.id === currentUserId} onPatch={patch} onResetPin={resetPin} onRemove={remove} />}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function UserEditor({
  u,
  busy,
  isSelf,
  onPatch,
  onResetPin,
  onRemove,
}: {
  u: Profile;
  busy: boolean;
  isSelf: boolean;
  onPatch: (id: string, updates: Record<string, unknown>, msg: string) => Promise<void>;
  onResetPin: (u: Profile, pin: string) => Promise<void>;
  onRemove: (u: Profile) => Promise<void>;
}) {
  const [role, setRole] = useState<Role>(u.role);
  const [sun, setSun] = useState(u.sun_number ? String(u.sun_number) : "");
  const [mission, setMission] = useState(u.mission_id ? String(u.mission_id) : "");
  const [name, setName] = useState(u.name);
  const [phone, setPhone] = useState(u.phone ?? "");
  const [pin, setPin] = useState("");

  return (
    <div className="px-5 pb-5 sm:px-6 space-y-4 bg-slate-50/70 border-t">
      {u.status === "pending" && (
        <div className="grid grid-cols-2 gap-3 pt-4">
          <Button variant="success" size="lg" loading={busy} onClick={() => onPatch(u.id, { status: "active" }, "승인했어요")}>
            <CheckCircle2 className="h-6 w-6" /> 승인
          </Button>
          <Button variant="danger" size="lg" loading={busy} onClick={() => onPatch(u.id, { status: "rejected" }, "거절했어요")}>
            <XCircle className="h-6 w-6" /> 거절
          </Button>
        </div>
      )}
      {u.status === "active" && !isSelf && (
        <div className="pt-4">
          <Button variant="outline" size="md" loading={busy} className="text-rose-600 border-rose-200" onClick={() => onPatch(u.id, { status: "rejected" }, "사용을 중지했어요")}>
            <XCircle className="h-5 w-5" /> 사용 중지
          </Button>
        </div>
      )}
      {u.status === "rejected" && (
        <div className="pt-4">
          <Button variant="success" size="md" loading={busy} onClick={() => onPatch(u.id, { status: "active" }, "다시 승인했어요")}>
            <CheckCircle2 className="h-5 w-5" /> 다시 승인
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">정보 수정</CardTitle>
          <CardDescription>순장 교체·선교회 변경 시 여기서 바꿔 주세요.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="이름" htmlFor={`n-${u.id}`}>
            <Input id={`n-${u.id}`} value={name} onChange={(e) => setName(e.target.value)} className="h-12" />
          </Field>
          <Field label="전화번호" htmlFor={`p-${u.id}`}>
            <Input id={`p-${u.id}`} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12" />
          </Field>
          <Field label="역할" htmlFor={`r-${u.id}`}>
            <Select id={`r-${u.id}`} value={role} onChange={(e) => setRole(e.target.value as Role)} className="h-12" disabled={isSelf}>
              <option value="sun_leader">순장</option>
              <option value="mission_leader">선교회장</option>
              <option value="pastor">담임목사</option>
            </Select>
          </Field>
          {role === "sun_leader" && (
            <Field label="담당 순" htmlFor={`s-${u.id}`}>
              <Select id={`s-${u.id}`} value={sun} onChange={(e) => setSun(e.target.value)} className="h-12">
                <option value="">선택</option>
                {SUN_DIRECTORY.map((s) => (
                  <option key={s.sunNumber} value={s.sunNumber}>
                    {s.sunNumber}순 — {s.sunLeader}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {role === "mission_leader" && (
            <Field label="소속 선교회" htmlFor={`m-${u.id}`}>
              <Select id={`m-${u.id}`} value={mission} onChange={(e) => setMission(e.target.value)} className="h-12">
                <option value="">선택</option>
                {MISSION_IDS.map((m) => (
                  <option key={m} value={m}>
                    {getMissionName(m)}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <div className="sm:col-span-2">
            <Button
              size="md"
              loading={busy}
              onClick={() =>
                onPatch(
                  u.id,
                  { name: name.trim(), phone, role, sun_number: role === "sun_leader" ? Number(sun) || null : null, mission_id: role === "mission_leader" ? Number(mission) || null : null },
                  "저장했어요"
                )
              }
            >
              저장
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 items-end">
        <Field label="비밀번호 초기화 (숫자 4~8자리)" htmlFor={`pin-${u.id}`} className="flex-1 min-w-[12rem]">
          <Input id={`pin-${u.id}`} inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="새 비밀번호" className="h-12" />
        </Field>
        <Button variant="gold" size="md" loading={busy} onClick={() => onResetPin(u, pin)}>
          <KeyRound className="h-5 w-5" /> 바꾸기
        </Button>
      </div>

      {!isSelf && (
        <Button variant="ghost" size="sm" className="text-rose-600" loading={busy} onClick={() => onRemove(u)}>
          <Trash2 className="h-5 w-5" /> 계정 삭제
        </Button>
      )}
    </div>
  );
}
