import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileText, PartyPopper, ClipboardList } from "lucide-react";
import { requirePage, dashboardPath } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, StatTile } from "@/components/ui/misc";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MissionReportForm } from "@/components/reports/mission-report-form";
import { MissionSummary } from "@/components/reports/mission-summary";
import { Comments } from "@/components/reports/comments";
import { DeleteReportButton } from "@/components/reports/delete-report-button";
import { PrintButton } from "@/components/reports/print-button";
import { aggregateSunReports } from "@/lib/report-utils";
import { formatKoreanDate, formatDateTime, isOpenReportWeek, reportWeekEnd } from "@/lib/dates";
import { formatWon } from "@/lib/utils";
import { getSunsByMission, getMissionName } from "@/lib/constants/sun-directory";
import type { MissionReport, SunReportWithMembers, SpecialReportItem, ReportComment, SpecialStatus } from "@/types/database";

export const metadata: Metadata = { title: "선교회보고서" };

const STATUS_TONE: Record<SpecialStatus, "sky" | "orange" | "emerald"> = { 기도중: "sky", 진행중: "orange", 해결됨: "emerald" };

export default async function MissionReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submitted?: string; mode?: string }>;
}) {
  const { id } = await params;
  const { submitted, mode } = await searchParams;
  const { profile, userId } = await requirePage(["mission_leader", "pastor"]);
  const supabase = await createClient();

  const { data: report } = await supabase.from("mission_reports").select("*").eq("id", id).maybeSingle();
  if (!report) notFound();
  const r = report as MissionReport;

  const [{ data: sunReports }, { data: items }, { data: comments }] = await Promise.all([
    supabase.from("sun_reports").select("*, sun_report_members(*)").eq("mission_id", r.mission_id).eq("report_date", r.report_date).order("sun_number"),
    supabase.from("special_report_items").select("*").eq("mission_report_id", id).order("created_at"),
    supabase.from("mission_report_comments").select("*").eq("report_id", id).order("created_at"),
  ]);

  const reports = (sunReports ?? []) as SunReportWithMembers[];
  const aggregated = aggregateSunReports(reports);
  const entries = getSunsByMission(r.mission_id).map((e) => ({ sunNumber: e.sunNumber, sunLeader: e.sunLeader, missionId: e.missionId }));
  const specialItems = (items ?? []) as SpecialReportItem[];

  const isOwner = profile.role === "mission_leader" && profile.mission_id === r.mission_id;
  // 이번 주 보고 창(주일 0시 ~ 토요일 밤 12시) 안에서만 고칠 수 있다
  const weekOpen = isOpenReportWeek(r.report_date);
  const canEdit = isOwner && weekOpen;
  const editing = canEdit && (r.status === "draft" || mode === "edit");
  const backHref = dashboardPath(profile.role);

  return (
    <div className="space-y-5">
      <PageHeader
        title={editing ? "선교회보고서 작성" : "선교회보고서"}
        subtitle={`${getMissionName(r.mission_id)} · ${formatKoreanDate(r.report_date)} 주일 · ${r.mission_leader ?? ""}`}
        icon={<FileText className="h-7 w-7" />}
        back={{ href: backHref, label: "홈으로" }}
        action={
          <>
            <StatusBadge status={r.status} />
            {!editing && <PrintButton />}
            {!editing && canEdit && (
              <Button variant="secondary" size="sm" href={`/report/mission/${id}?mode=edit`}>
                수정하기
              </Button>
            )}
            {((canEdit && r.status === "draft") || profile.role === "pastor") && !editing && (
              <DeleteReportButton
                apiUrl={`/api/reports/mission/${id}`}
                title="이 선교회보고서를 삭제할까요?"
                description="특별보고 항목도 함께 삭제돼요. 되돌릴 수 없어요."
                redirectTo={backHref}
              />
            )}
          </>
        }
      />

      {submitted && (
        <div className="rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-5 flex items-center gap-4 shadow-pop pop-in">
          <PartyPopper className="h-12 w-12 shrink-0" />
          <div>
            <p className="text-2xl font-black">제출 완료! 수고하셨어요 🙏</p>
            <p className="text-base opacity-95">담임목사님께 알림이 갔어요.</p>
          </div>
        </div>
      )}

      {editing && canEdit && r.status === "submitted" && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-base text-amber-900" style={{ wordBreak: "keep-all" }}>
          이미 제출한 보고서예요. 고친 뒤 <b>제출하기</b>를 다시 누르면 담임목사님께 다시 알림이 가요.
        </div>
      )}

      {isOwner && weekOpen && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-base text-emerald-900" style={{ wordBreak: "keep-all" }}>
          이번 주 보고 기간은 <b>{formatKoreanDate(reportWeekEnd(), { year: false })}</b>까지예요. 그때까지는 몇 번이든 고쳐서 다시 낼 수 있어요.
          순장님이 순보고서를 고치면 합계는 자동으로 다시 계산돼요.
        </div>
      )}

      {isOwner && !weekOpen && (
        <div className="rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-ink-soft" style={{ wordBreak: "keep-all" }}>
          {formatKoreanDate(r.report_date, { year: false })} 주일 보고 기간은 끝났어요. 이 보고서는 <b>보기만</b> 할 수 있어요.
        </div>
      )}

      <MissionSummary sunEntries={entries} sunReports={reports} aggregated={aggregated} totalOffering={r.total_offering} />

      {editing ? (
        <MissionReportForm reportDate={r.report_date} reportId={id} initialData={r} aggregated={aggregated} initialSpecialItems={specialItems} />
      ) : (
        <>
          <Card className="rise-in rise-in-3">
            <CardHeader>
              <CardTitle icon={<ClipboardList className="h-6 w-6 text-violet-600" />}>
                선교회 특별보고 <span className="text-base font-bold text-ink-soft">({specialItems.length}건)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatTile label="헌금 총액" value={formatWon(r.total_offering)} tone="sky" className="col-span-2 sm:col-span-2" />
                {r.submitted_at && (
                  <div className="col-span-2 flex items-center text-base text-ink-soft px-1">제출 시각: {formatDateTime(r.submitted_at)}</div>
                )}
              </div>
              {specialItems.length === 0 ? (
                <p className="text-base text-ink-soft">등록된 특별보고가 없어요.</p>
              ) : (
                <ul className="space-y-2">
                  {specialItems.map((it) => (
                    <li key={it.id} className="rounded-2xl border bg-slate-50/70 px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="violet">{it.category}</Badge>
                        <Badge tone={STATUS_TONE[it.status]}>{it.status}</Badge>
                      </div>
                      <p className="mt-1.5 text-lg whitespace-pre-wrap">{it.content}</p>
                      {it.pastor_memo && (
                        <p className="mt-2 rounded-xl bg-violet-50 border border-violet-200 px-3 py-2 text-base text-violet-900">
                          <b>목사님 메모:</b> {it.pastor_memo}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {r.special_note && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-lg whitespace-pre-wrap">
                  <b className="text-amber-900">선교회장 한마디:</b> {r.special_note}
                </div>
              )}
            </CardContent>
          </Card>
          <Comments kind="mission" reportId={id} initialComments={(comments ?? []) as ReportComment[]} currentUserId={userId} currentRole={profile.role} canComment />
        </>
      )}
    </div>
  );
}
