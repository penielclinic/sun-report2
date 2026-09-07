"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { BigCheck } from "@/components/ui/misc";
import { api } from "@/lib/api-client";
import { validateLoginId } from "@/lib/auth/login-id";

const SAVED_ID_KEY = "sunbogo:saved-id";

export function LoginForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialError) toast.error(initialError);
    // 저장된 아이디 불러오기 (렌더 이후 비동기로 반영 — 하이드레이션 불일치 방지)
    const t = setTimeout(() => {
      try {
        const saved = localStorage.getItem(SAVED_ID_KEY);
        if (saved) {
          setLoginId(saved);
          setRemember(true);
        }
      } catch {}
    }, 0);
    return () => clearTimeout(t);
  }, [initialError]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const idErr = validateLoginId(loginId);
    if (idErr) return toast.error(idErr);
    if (!/^\d{4,8}$/.test(pin)) return toast.error("비밀번호는 숫자 4~8자리예요");

    setLoading(true);
    try {
      try {
        if (remember) localStorage.setItem(SAVED_ID_KEY, loginId.trim());
        else localStorage.removeItem(SAVED_ID_KEY);
      } catch {}

      const res = await api<{ redirect: string; name: string }>("/api/auth/login", {
        body: { login_id: loginId, pin },
      });
      toast.success(`${res.name}님, 반갑습니다!`);
      router.replace(res.redirect);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="이름 (아이디)" htmlFor="login-id">
        <Input
          id="login-id"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          placeholder="예) 홍길동"
          autoComplete="username"
          autoCapitalize="off"
          enterKeyHint="next"
          required
        />
      </Field>

      <Field label="비밀번호 (숫자)" htmlFor="login-pin">
        <div className="relative">
          <Input
            id="login-pin"
            type={showPin ? "text" : "password"}
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
            placeholder="숫자 4~8자리"
            autoComplete="current-password"
            enterKeyHint="go"
            className="pr-14 tracking-[0.25em] placeholder:tracking-normal"
            required
          />
          <button
            type="button"
            onClick={() => setShowPin((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-xl text-ink-soft hover:bg-slate-100"
            aria-label={showPin ? "비밀번호 숨기기" : "비밀번호 보기"}
          >
            {showPin ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
          </button>
        </div>
      </Field>

      <BigCheck checked={remember} onChange={setRemember} label="이름 기억하기" size="sm" />

      <Button type="submit" size="xl" full loading={loading}>
        {!loading && <LogIn className="h-6 w-6" />}
        {loading ? "로그인 중..." : "로그인"}
      </Button>

      <Link
        href="/register"
        className="flex h-15 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/60 text-lg font-bold text-brand-800 hover:bg-brand-100"
      >
        <UserPlus className="h-6 w-6" />
        처음이세요? 회원가입
      </Link>
    </form>
  );
}
