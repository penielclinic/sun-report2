import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FilePenLine } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { MissionReportForm } from "@/components/reports/mission-report-form";
import { MissionSummary } from "@/components/reports/mission-summary";
import { aggregateSunReports } from "@/lib/report-utils";
import { currentReportSunday, formatKoreanDate, reportWeekEnd } from "@/lib/dates";
import { getSunsByMission, getMissionName, BRIDGE_MISSION_ID } from "@/lib/constants/sun-directory";
import type { SunReportWithMembers } from "@/types/database";

export const metadata: Metadata = { title: "선교회보고서 작성" };

export default async function NewMissionReportPage() {
  const { profile } = await requirePage(["mission_leader"]);
  const missionId = profile.mission_id;
  if (!missionId || missionId === BRIDGE_MISSION_ID) redirect("/dashboard");

  // 보고 창은 주일 0시에 열려 토요일 밤 12시까지 — 새 보고서는 언제나 이번 주 주일로 쓴다
  const reportDate = currentReportSunday();

  const supabase = await createClient();
  const { data: existing } = await supabase.from("mission_reports").select("id").eq("mission_id", missionId).eq("report_date", reportDate).maybeSingle();
  if (existing) redirect(`/report/mission/${existing.id}`);

  const { data: sunReports } = await supabase
    .from("sun_reports")
    .select("*, sun_report_members(*)")
    .eq("mission_id", missionId)
    .eq("report_date", reportDate)
    .order("sun_number");
  const reports = (sunReports ?? []) as SunReportWithMembers[];
  const aggregated = aggregateSunReports(reports);
  const entries = getSunsByMission(missionId).map((e) => ({ sunNumber: e.sunNumber, sunLeader: e.sunLeader, missionId: e.missionId }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="선교회보고서 작성"
        subtitle={`${getMissionName(missionId)} · ${formatKoreanDate(reportDate)} 주일 · ${formatKoreanDate(reportWeekEnd(), { year: false })}까지 고칠 수 있어요`}
        icon={<FilePenLine className="h-7 w-7" />}
        back={{ href: "/dashboard/mission-leader", label: "홈으로" }}
      />
      <MissionSummary sunEntries={entries} sunReports={reports} aggregated={aggregated} />
      <MissionReportForm reportDate={reportDate} reportId={null} initialData={null} aggregated={aggregated} initialSpecialItems={[]} />
    </div>
  );
}
