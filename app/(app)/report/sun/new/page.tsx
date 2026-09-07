import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FilePenLine } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { SunReportForm } from "@/components/reports/sun-report-form";
import { defaultMemberNames } from "@/lib/reports.server";
import { currentReportSunday, reportWeekEnd, formatKoreanDate } from "@/lib/dates";

export const metadata: Metadata = { title: "순보고서 작성" };

export default async function NewSunReportPage() {
  const { profile } = await requirePage(["sun_leader"]);
  if (!profile.sun_number) redirect("/dashboard");

  // 보고 창은 주일 0시에 열려 토요일 밤 12시까지 — 새 보고서는 언제나 이번 주 주일로 쓴다
  const reportDate = currentReportSunday();

  // 같은 주 보고서가 이미 있으면 그 보고서로
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("sun_reports")
    .select("id")
    .eq("sun_number", profile.sun_number)
    .eq("report_date", reportDate)
    .maybeSingle();
  if (existing) redirect(`/report/sun/${existing.id}`);

  const { names, sortedByAttendance } = await defaultMemberNames(profile.sun_number, profile.name);

  return (
    <div className="space-y-5">
      <PageHeader
        title="순보고서 작성"
        subtitle={`${formatKoreanDate(reportDate)} 주일 보고 · ${formatKoreanDate(reportWeekEnd(), { year: false })}까지 고칠 수 있어요`}
        icon={<FilePenLine className="h-7 w-7" />}
        back={{ href: "/dashboard/sun-leader", label: "홈으로" }}
      />
      <SunReportForm
        profile={profile}
        reportDate={reportDate}
        reportId={null}
        initialData={null}
        defaultMembers={names}
        sortedByAttendance={sortedByAttendance}
      />
    </div>
  );
}
