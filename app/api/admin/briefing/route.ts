import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApi, jsonError } from "@/lib/auth/session";
import { generateBriefing, briefingEnabled } from "@/lib/briefing.server";
import { dateSchema } from "@/lib/validation";
import { isSunday } from "@/lib/dates";

export const maxDuration = 120;

const schema = z.object({ sunday: dateSchema });

/** 담임목사: 해당 주일 AI 브리핑 생성 */
export async function POST(request: Request) {
  const { error } = await requireApi(["pastor"]);
  if (error) return error;
  if (!briefingEnabled()) return jsonError("AI 브리핑 기능이 꺼져 있어요 (ANTHROPIC_API_KEY 필요)", 503);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isSunday(parsed.data.sunday)) return jsonError("주일 날짜를 확인해 주세요");
  try {
    const result = await generateBriefing(parsed.data.sunday);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[briefing]", err);
    return jsonError((err as Error).message || "브리핑 생성 중 오류가 났어요", 500);
  }
}
