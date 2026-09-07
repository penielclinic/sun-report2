import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatWon(n: number | null | undefined) {
  return `${(n ?? 0).toLocaleString("ko-KR")}원`;
}

export function clampInt(v: unknown, min = 0, max = 1_000_000_000): number {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}
