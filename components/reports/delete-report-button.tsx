"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { api } from "@/lib/api-client";

export function DeleteReportButton({
  apiUrl,
  body,
  title,
  description,
  redirectTo,
  label = "삭제",
  ...btn
}: {
  apiUrl: string;
  body?: Record<string, unknown>;
  title: string;
  description?: string;
  redirectTo?: string;
  label?: string;
} & Omit<ButtonProps, "onClick" | "children">) {
  const router = useRouter();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(false);

  async function run() {
    const ok = await confirm({ title, description, danger: true, confirmLabel: "삭제" });
    if (!ok) return;
    setLoading(true);
    try {
      await api(apiUrl, { method: "DELETE", body });
      toast.success("삭제했어요");
      if (redirectTo) router.replace(redirectTo);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" {...btn} onClick={run} loading={loading} className={"text-rose-600 border-rose-200 hover:bg-rose-50 " + (btn.className ?? "")}>
      {!loading && <Trash2 className="h-5 w-5" />}
      {label}
    </Button>
  );
}
