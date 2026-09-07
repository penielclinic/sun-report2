"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";

export interface ExcelSheet {
  name: string;
  rows: (string | number | null)[][];
  /** 병합 범위 (0-based) */
  merges?: { s: { r: number; c: number }; e: { r: number; c: number } }[];
  colWidths?: number[];
}

/** xlsx 를 필요할 때만 불러와 엑셀 파일 생성 */
export function ExcelButton({ filename, sheets, label = "엑셀 저장", ...props }: { filename: string; sheets: ExcelSheet[]; label?: string } & Omit<ButtonProps, "onClick" | "children">) {
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();
      for (const s of sheets) {
        const ws = XLSX.utils.aoa_to_sheet(s.rows);
        if (s.merges) ws["!merges"] = s.merges;
        if (s.colWidths) ws["!cols"] = s.colWidths.map((wch) => ({ wch }));
        XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
      }
      XLSX.writeFile(wb, filename);
      toast.success("엑셀 파일을 저장했어요");
    } catch (err) {
      toast.error("엑셀 저장 실패: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" {...props} onClick={run} loading={loading} className={"no-print text-emerald-700 border-emerald-200 hover:bg-emerald-50 " + (props.className ?? "")}>
      {!loading && <FileSpreadsheet className="h-5 w-5" />}
      {label}
    </Button>
  );
}
