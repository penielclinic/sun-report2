"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Hint } from "@/components/ui/field";
import { api } from "@/lib/api-client";
import { validateLoginId, validatePin } from "@/lib/auth/login-id";

export function ForgotForm() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const idErr = validateLoginId(loginId);
    if (idErr) return toast.error(idErr);
    if (phone.replace(/\D/g, "").length < 9) return toast.error("전화번호를 확인해 주세요");
    const pinErr = validatePin(pin);
    if (pinErr) return toast.error(pinErr);
    if (pin !== pin2) return toast.error("새 비밀번호 두 번이 서로 달라요");

    setLoading(true);
    try {
      const res = await api<{ name: string }>("/api/auth/reset-pin", { body: { login_id: loginId, phone, new_pin: pin } });
      toast.success(`${res.name}님, 새 비밀번호로 로그인해 주세요`);
      router.replace("/login");
    } catch (err) {
      toast.error((err as Error).message);
      setLoading(false);
    }
  }

  const digits = (v: string) => v.replace(/\D/g, "").slice(0, 8);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="이름 (아이디)" htmlFor="f-id" required>
        <Input id="f-id" value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="예) 홍길동" autoComplete="username" required />
      </Field>
      <Field label="등록된 전화번호" htmlFor="f-phone" required>
        <Input id="f-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" autoComplete="tel" required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="새 비밀번호" htmlFor="f-pin" required>
          <Input id="f-pin" type="password" inputMode="numeric" pattern="[0-9]*" value={pin} onChange={(e) => setPin(digits(e.target.value))} placeholder="숫자 4~8자리" autoComplete="new-password" required />
        </Field>
        <Field label="한 번 더" htmlFor="f-pin2" required>
          <Input id="f-pin2" type="password" inputMode="numeric" pattern="[0-9]*" value={pin2} onChange={(e) => setPin2(digits(e.target.value))} placeholder="같은 숫자" autoComplete="new-password" required />
        </Field>
      </div>

      <Button type="submit" size="xl" full variant="gold" loading={loading}>
        {!loading && <KeyRound className="h-6 w-6" />}
        {loading ? "확인 중..." : "새 비밀번호로 바꾸기"}
      </Button>

      <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-base text-amber-900 flex gap-2">
        <PhoneCall className="h-6 w-6 shrink-0" />
        <span>
          전화번호를 등록하지 않았거나 기억나지 않으면 <b>담임목사님께 말씀해 주세요</b>. 사용자 관리에서 바로 새 비밀번호를 정해 드릴 수 있어요.
        </span>
      </div>
      <Hint className="text-center">
        <Link href="/login" className="font-bold text-brand-700 underline underline-offset-4">
          로그인 화면으로 돌아가기
        </Link>
      </Hint>
    </form>
  );
}
