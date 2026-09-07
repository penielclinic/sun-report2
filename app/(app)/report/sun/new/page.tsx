import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FilePenLine } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { SunReportForm } from "@/components/reports/sun-report-form";
import { defaultMemberNames } from "@/lib/reports.server";
import { currentReportSunday, isValidDateString, isSunday } from "@/lib/dates";

export const metadata: Metadata = { title: "순보고서 작성" };

export default async function NewSunReportPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { profile } = await requirePage(["sun_leader"]);
  if (!profile.sun_number) redirect("/dashboard");

  const { date } = await searchParams;
  const reportDate = date && isValidDateString(date) && isSunday(date) ? date : currentReportSunday();

  // 같은 주 보고서가 이미 있으면 그 보고서로
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("sun_reports")
    .select("id")
    .eq("sun_number", profile.sun_number)
    .eq("report_date", reportDate)
    .maybeSingle();
  if (existing) redirect(`/report/sun/${existing.id}`);

  const names = await defaultMemberNames(profile.sun_number, profile.name);

  return (
    <div className="space-y-5">
      <PageHeader
        title="순보고서 작성"
        subtitle="출석을 체크하고 제출 버튼을 눌러 주세요"
        icon={<FilePenLine className="h-7 w-7" />}
        back={{ href: "/dashboard/sun-leader", label: "홈으로" }}
      />
      <SunReportForm profile={profile} reportDate={reportDate} reportId={null} initialData={null} defaultMembers={names} />
    </div>
  );
}
