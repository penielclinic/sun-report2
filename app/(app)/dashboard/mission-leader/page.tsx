import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, CheckCircle2, Clock3, CircleDashed, Users } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/misc";
import { ReportStatusCard } from "@/components/reports/report-status-card";
import { RecentMessages } from "@/components/notifications/recent-messages";
import { SundayPicker } from "@/components/reports/sunday-picker";
import { formatKoreanDate, resolveReportSunday, isOpenReportWeek, reportWeekEnd } from "@/lib/dates";
import { getSunsByMission, getMissionName } from "@/lib/constants/sun-directory";

export const metadata: Metadata = { title: "선교회장 홈" };

export default async function MissionLeaderDashboard({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { profile, userId } = await requirePage(["mission_leader"]);
  const { date } = await searchParams;
  const selected = resolveReportSunday(date);
  const weekOpen = isOpenReportWeek(selected);
  const missionId = profile.mission_id ?? 0;
  const entries = getSunsByMission(missionId);
  const supabase = await createClient();

  const [{ data: sunReports }, { data: missionReport }] = await Promise.all([
    supabase.from("sun_reports").select("id, sun_number, sun_leader, status, attend_total, bible_chapters, submitted_at").eq("mission_id", missionId).eq("report_date", selected),
    supabase.from("mission_reports").select("id, status").eq("mission_id", missionId).eq("report_date", selected).maybeSingle(),
  ]);

  const map = new Map((sunReports ?? []).map((r) => [r.sun_number, r]));
  const submittedCount = (sunReports ?? []).filter((r) => r.status === "submitted").length;
  const total = entries.length;

  return (
    <div className="space-y-5">
      <div className="rise-in">
        <h1 className="text-2xl sm:text-3xl font-black">
          {profile.name} 선교회장님, 안녕하세요 👋
        </h1>
        <p className="text-lg text-ink-soft">{getMissionName(missionId)} 보고 현황</p>
      </div>

      <SundayPicker value={selected} basePath="/dashboard/mission-leader" />

      <p className="px-1 text-base text-ink-soft" style={{ wordBreak: "keep-all" }}>
        {weekOpen ? (
          <>
            이번 주 보고 기간은 <b>{formatKoreanDate(reportWeekEnd(), { year: false })}</b>까지예요. 그때까지는 순장님도, 선교회장님도 몇 번이든 고쳐서 다시 낼 수 있어요.
            다음 주일 0시가 되면 새 주일 보고가 열려요.
          </>
        ) : (
          <>지난 주일이에요. 보고서는 보기만 할 수 있어요.</>
        )}
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReportStatusCard
          status={missionReport ? missionReport.status : weekOpen ? "none" : "closed"}
          dateLabel={`${formatKoreanDate(selected)} 주일 · 선교회보고서`}
          submittedLabel={
            weekOpen
              ? `담임목사님께 전달되었어요. ${formatKoreanDate(reportWeekEnd(), { year: false })}까지 고쳐서 다시 낼 수 있어요.`
              : "담임목사님께 전달되었어요."
          }
          href={missionReport ? `/report/mission/${missionReport.id}` : weekOpen ? "/report/mission/new" : undefined}
          ctaLabel={
            missionReport
              ? missionReport.status === "submitted"
                ? "제출한 보고서 보기"
                : "이어서 작성하기"
              : weekOpen
                ? "선교회보고서 작성"
                : undefined
          }
        />

        <Card tone="brand" className="rise-in rise-in-2 p-6 flex flex-col justify-between">
          <div>
            <p className="text-base font-bold opacity-90">순보고서 제출 현황</p>
            <div className="mt-1 flex items-end justify-between">
              <p className="text-5xl font-black tabular-nums">
                {submittedCount}
                <span className="text-2xl font-bold opacity-80"> / {total} 순</span>
              </p>
              <p className="text-4xl font-black">{total ? Math.round((submittedCount / total) * 100) : 0}%</p>
            </div>
          </div>
          <ProgressBar value={submittedCount} max={total} tone="gold" className="mt-4" />
          <p className="mt-3 text-base opacity-90">
            {submittedCount === total ? "모든 순이 보고서를 냈어요! 🎉" : `아직 ${total - submittedCount}개 순이 보고서를 안 냈어요.`}
          </p>
        </Card>
      </div>

      <Card className="rise-in rise-in-3">
        <CardHeader>
          <CardTitle icon={<Users className="h-6 w-6 text-emerald-600" />}>소속 순 현황</CardTitle>
          <CardDescription>{formatKoreanDate(selected)} 주일 기준</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {entries.map((e) => {
              const r = map.get(e.sunNumber);
              const Icon = r?.status === "submitted" ? CheckCircle2 : r?.status === "draft" ? Clock3 : CircleDashed;
              const color = r?.status === "submitted" ? "text-emerald-500" : r?.status === "draft" ? "text-amber-500" : "text-slate-300";
              const row = (
                <div className="flex items-center justify-between gap-3 px-5 py-3.5 sm:px-6">
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={"h-8 w-8 shrink-0 " + color} />
                    <div className="min-w-0">
                      <p className="text-lg font-bold">
                        {e.sunNumber}순 · {e.sunLeader}
                      </p>
                      {r?.status === "submitted" && (
                        <p className="text-base text-ink-soft">
                          주일낮 {r.attend_total}명 · 성경 {r.bible_chapters}장
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={r?.status} />
                    {r && <ChevronRight className="h-6 w-6 text-slate-400" />}
                  </div>
                </div>
              );
              return (
                <li key={e.sunNumber}>
                  {r ? (
                    <Link href={`/report/sun/${r.id}`} className="block hover:bg-brand-50/60">
                      {row}
                    </Link>
                  ) : (
                    row
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <RecentMessages userId={userId} />
    </div>
  );
}
