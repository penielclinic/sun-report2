import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "비밀번호 찾기" };

export default function ForgotPage() {
  return (
    <AuthShell title="비밀번호 새로 정하기" subtitle={"가입할 때 등록한 전화번호가 맞으면\n새 비밀번호를 바로 정할 수 있어요"}>
      <ForgotForm />
    </AuthShell>
  );
}
