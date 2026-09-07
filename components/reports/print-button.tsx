"use client";

import { Printer } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

export function PrintButton({ label = "인쇄 · PDF", ...props }: Omit<ButtonProps, "onClick" | "children"> & { label?: string }) {
  return (
    <Button variant="outline" size="sm" {...props} onClick={() => window.print()} className={"no-print " + (props.className ?? "")}>
      <Printer className="h-5 w-5" />
      {label}
    </Button>
  );
}
