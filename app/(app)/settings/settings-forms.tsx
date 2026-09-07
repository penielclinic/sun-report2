"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { api } from "@/lib/api-client";
import { validatePin } from "@/lib/auth/login-id";

export function SettingsForms({ phone: initialPhone }: { phone: string }) {
  const router = useRouter();
  const [cur, setCur] = useState("");
  const [n1, setN1] = useState("");
  const [n2, setN2] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [phone, setPhone] = useState(initialPhone);
  const [phoneLoading, setPhoneLoading] = useState(false);

  async function changePin(e: React.FormEvent) {
    e.preventDefault();
    const err = validatePin(n1);
    if (err) return toast.error(err);
    if (n1 !== n2) return toast.error("새 비밀번호 두 번이 서로 달라요");
    setPinLoading(true);
    try {
      await api("/api/auth/pin", { body: { current_pin: cur, new_pin: n1 } });
      toast.success("비밀번호를 바꿨어요");
      setCur("");
      setN1("");
      setN2("");
    } catch (er) {
      toast.error((er as Error).message);
    } finally {
      setPinLoading(false);
    }
  }

  async function savePhone(e: React.FormEvent) {
    e.preventDefault();
    setPhoneLoading(true);
    try {
      await api("/api/auth/pin", { method: "PATCH", body: { phone } });
      toast.success("전화번호를 저장했어요");
      router.refresh();
    } catch (er) {
      toast.error((er as Error).message);
    } finally {
      setPhoneLoading(false);
    }
  }

  const digits = (v: string) => v.replace(/\D/g, "").slice(0, 8);

  return (
    <>
      <Card className="rise-in rise-in-3">
        <CardHeader>
          <CardTitle icon={<Phone className="h-6 w-6 text-emerald-600" />}>전화번호</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={savePhone} className="flex gap-2 items-end">
            <Field label="전화번호" htmlFor="phone" className="flex-1">
              <Input id="phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" />
            </Field>
            <Button type="submit" size="lg" loading={phoneLoading}>
              저장
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rise-in rise-in-3">
        <CardHeader>
          <CardTitle icon={<KeyRound className="h-6 w-6 text-amber-600" />}>비밀번호 바꾸기</CardTitle>
          <CardDescription>숫자 4~8자리. 비밀번호를 잊으셨다면 담임목사님이 새로 정해 드릴 수 있어요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePin} className="space-y-4">
            <Field label="현재 비밀번호" htmlFor="cur">
              <Input id="cur" type="password" inputMode="numeric" value={cur} onChange={(e) => setCur(digits(e.target.value))} autoComplete="current-password" required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="새 비밀번호" htmlFor="n1">
                <Input id="n1" type="password" inputMode="numeric" value={n1} onChange={(e) => setN1(digits(e.target.value))} autoComplete="new-password" required />
              </Field>
              <Field label="한 번 더" htmlFor="n2">
                <Input id="n2" type="password" inputMode="numeric" value={n2} onChange={(e) => setN2(digits(e.target.value))} autoComplete="new-password" required />
              </Field>
            </div>
            <Button type="submit" size="lg" variant="gold" loading={pinLoading}>
              비밀번호 바꾸기
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
