import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { SundayPicker } from "@/components/reports/sunday-picker";
import { BriefingPanel } from "./briefing-panel";
import { briefingEnabled } from "@/lib/briefing.server";
import { currentReportSunday, formatKoreanDate, isValidDateString, isSunday } from "@/lib/dates";

export const metadata: Metadata = { title: "AI 목회 브리핑" };

export default async function BriefingPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  await requirePage(["pastor"]);
  const { date } = await searchParams;
  const selected = date && isValidDateString(date) && isSunday(date) ? date : currentReportSunday();
  const supabase = await createClient();
  const { data } = await supabase.from("pastoral_briefings").select("briefing_text, care_members, joy_news, generated_at").eq("week_of", selected).maybeSingle();

  return (
    <div className="space-y-5">
      <PageHeader title="AI 목회 브리핑" subtitle={`${formatKoreanDate(selected)} 주일 보고서를 요약한 목회 노트`} icon={<BookOpen className="h-7 w-7" />} />
      <SundayPicker value={selected} basePath="/admin/briefing" />
      <BriefingPanel
        sunday={selected}
        enabled={briefingEnabled()}
        initial={data ? { text: data.briefing_text ?? "", care: (data.care_members ?? []) as { where: string; reason: string; text: string }[], joy: (data.joy_news ?? []) as { where: string; keyword: string; text: string }[], generatedAt: data.generated_at } : null}
      />
    </div>
  );
}
