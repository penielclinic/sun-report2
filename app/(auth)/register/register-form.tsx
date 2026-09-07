"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus, Church, Users, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Hint } from "@/components/ui/field";
import { api } from "@/lib/api-client";
import { validateLoginId, validatePin } from "@/lib/auth/login-id";
import { SUN_DIRECTORY, BRIDGE_SUN_NUMBER, MISSION_IDS, getMissionName } from "@/lib/constants/sun-directory";
import type { Role } from "@/types/database";
import { cn } from "@/lib/utils";

const ROLES: { value: Role; label: string; desc: string; icon: React.ReactNode; tone: string }[] = [
  { value: "sun_leader", label: "순장", desc: "매주 순보고서 작성", icon: <Users className="h-7 w-7" />, tone: "border-emerald-300 bg-emerald-50 text-emerald-800" },
  { value: "mission_leader", label: "선교회장", desc: "선교회보고서 작성", icon: <Church className="h-7 w-7" />, tone: "border-amber-300 bg-amber-50 text-amber-900" },
  { value: "pastor", label: "담임목사", desc: "전체 현황·통계", icon: <Crown className="h-7 w-7" />, tone: "border-violet-300 bg-violet-50 text-violet-800" },
];

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<Role | "">("");
  const [sunNumber, setSunNumber] = useState("");
  const [missionId, setMissionId] = useState("");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [phone, setPhone] = useState("");

  function handleSunSelect(v: string) {
    setSunNumber(v);
    const entry = SUN_DIRECTORY.find((s) => s.sunNumber === Number(v));
    if (entry && !name && entry.sunNumber !== BRIDGE_SUN_NUMBER) setName(entry.sunLeader);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return toast.error("역할을 선택해 주세요");
    if (role === "sun_leader" && !sunNumber) return toast.error("담당 순을 선택해 주세요");
    if (role === "mission_leader" && !missionId) return toast.error("소속 선교회를 선택해 주세요");
    const idErr = validateLoginId(name);
    if (idErr) return toast.error(idErr);
    const pinErr = validatePin(pin);
    if (pinErr) return toast.error(pinErr);
    if (pin !== pin2) return toast.error("비밀번호 두 번이 서로 달라요. 다시 확인해 주세요");

    setLoading(true);
    try {
      const res = await api<{ status: "active" | "pending" }>("/api/auth/register", {
        body: {
          login_id: name,
          name,
          pin,
          phone: phone || null,
          role,
          sun_number: role === "sun_leader" ? Number(sunNumber) : null,
          mission_id: role === "mission_leader" ? Number(missionId) : null,
        },
      });
      if (res.status === "active") {
        toast.success("가입이 완료되었어요. 로그인해 주세요!");
        router.replace("/login");
      } else {
        toast.success("가입 신청이 접수되었어요");
        router.replace("/pending?applied=1");
      }
    } catch (err) {
      toast.error((err as Error).message);
      setLoading(false);
    }
  }

  const selectedSun = SUN_DIRECTORY.find((s) => s.sunNumber === Number(sunNumber));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="text-[1.05rem] font-bold mb-2">
          역할 <span className="text-rose-500">*</span>
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => {
                setRole(r.value);
                setSunNumber("");
                setMissionId("");
              }}
              aria-pressed={role === r.value}
              className={cn(
                "flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all sm:flex-col sm:text-center sm:px-2",
                role === r.value ? cn(r.tone, "shadow-soft scale-[1.03]") : "border-line bg-white text-ink-soft hover:border-brand-200"
              )}
            >
              <span className="shrink-0">{r.icon}</span>
              <span className="min-w-0">
                <span className="block text-lg font-black whitespace-nowrap">{r.label}</span>
                <span className="block text-[0.85rem] leading-tight opacity-80">{r.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {role === "sun_leader" && (
        <Field label="담당 순" htmlFor="sun" required hint={selectedSun ? `소속: ${getMissionName(selectedSun.missionId)}` : undefined}>
          <Select id="sun" value={sunNumber} onChange={(e) => handleSunSelect(e.target.value)} required>
            <option value="">담당 순을 선택하세요</option>
            {SUN_DIRECTORY.map((s) => (
              <option key={s.sunNumber} value={s.sunNumber}>
                {s.sunNumber === BRIDGE_SUN_NUMBER ? `브릿지선교회 — ${s.sunLeader} (목자)` : `${s.sunNumber}순 — ${s.sunLeader}`}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {role === "mission_leader" && (
        <Field label="소속 선교회" htmlFor="mission" required>
          <Select id="mission" value={missionId} onChange={(e) => setMissionId(e.target.value)} required>
            <option value="">선교회를 선택하세요</option>
            {MISSION_IDS.map((m) => (
              <option key={m} value={m}>
                {getMissionName(m)}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field label="이름 (로그인 아이디)" htmlFor="name" required hint="이 이름으로 로그인해요. 같은 이름이 있으면 뒤에 숫자를 붙여 주세요 (예: 김영희2)">
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="실명을 입력하세요" autoComplete="username" required />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="비밀번호" htmlFor="pin" required>
          <Input
            id="pin"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
            placeholder="숫자 4~8자리"
            autoComplete="new-password"
            required
          />
        </Field>
        <Field label="한 번 더" htmlFor="pin2" required>
          <Input
            id="pin2"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin2}
            onChange={(e) => setPin2(e.target.value.replace(/\D/g, "").slice(0, 8))}
            placeholder="같은 숫자"
            autoComplete="new-password"
            required
          />
        </Field>
      </div>
      <Hint className="-mt-3">숫자만 4~8자리. 생일이나 1234처럼 쉬운 번호는 피해 주세요.</Hint>

      <Field label="전화번호 (선택)" htmlFor="phone">
        <Input id="phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" autoComplete="tel" />
      </Field>

      <Button type="submit" size="xl" full loading={loading} variant="success">
        {!loading && <UserPlus className="h-6 w-6" />}
        {loading ? "신청 중..." : "가입 신청하기"}
      </Button>

      <p className="text-center text-base text-ink-soft">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-bold text-brand-700 underline underline-offset-4">
          로그인
        </Link>
      </p>
    </form>
  );
}
