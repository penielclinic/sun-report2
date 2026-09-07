import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "회원가입" };

export default function RegisterPage() {
  return (
    <AuthShell title="회원가입" subtitle={"가입 신청 후 담임목사님이 승인하면\n바로 사용할 수 있어요"}>
      <RegisterForm />
    </AuthShell>
  );
}
