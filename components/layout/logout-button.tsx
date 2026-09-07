"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";

export function LogoutButton(props: Omit<ButtonProps, "onClick" | "children"> & { label?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { label = "로그아웃", ...rest } = props;

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      toast.error("로그아웃 중 오류가 났어요");
    }
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button {...rest} onClick={logout} loading={loading}>
      {!loading && <LogOut className="h-5 w-5" />}
      {label}
    </Button>
  );
}
