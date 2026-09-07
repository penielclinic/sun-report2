import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileText, PartyPopper, Info } from "lucide-react";
import { requirePage, dashboardPath } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { SunReportForm } from "@/components/reports/sun-report-form";
import { SunReportView } from "@/components/reports/sun-report-view";
import { Comments } from "@/components/reports/comments";
import { DeleteReportButton } from "@/components/reports/delete-report-button";
import type { SunReport, SunReportMember, ReportComment } from "@/types/database";

export const metadata: Metadata = { title: "순보고서" };

export default async function SunReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submitted?: string; mode?: string }>;
}) {
  const { id } = await params;
  const { submitted, mode } = await searchParams;
  const { profile, userId } = await requirePage();
  const supabase = await createClient();

  const { data: report } = await supabase.from("sun_reports").select("*").eq("id", id).maybeSingle();
  if (!report) notFound();
  const r = report as SunReport;

  const [{ data: members }, { data: comments }, { data: missionReport }] = await Promise.all([
    supabase.from("sun_report_members").select("*").eq("report_id", id).order("sort_order").order("member_name"),
    supabase.from("sun_report_comments").select("*").eq("report_id", id).order("created_at"),
    supabase.from("mission_reports").select("status").eq("mission_id", r.mission_id).eq("report_date", r.report_date).maybeSingle(),
  ]);

  const missionSubmitted = missionReport?.status === "submitted";
  const isOwnerSun = profile.role === "sun_leader" && profile.sun_number === r.sun_number;
  const canEdit = isOwnerSun;
  const editing = canEdit && (r.status === "draft" || mode === "edit");
  const canComment = profile.role === "pastor" || isOwnerSun || (profile.role === "mission_leader" && profile.mission_id === r.mission_id);
  const backHref = dashboardPath(profile.role);

  return (
    <div className="space-y-5">
      <PageHeader
        title={editing ? "순보고서 수정" : "순보고서"}
        icon={<FileText className="h-7 w-7" />}
        back={{ href: backHref, label: "홈으로" }}
        action={
          !editing && canEdit ? (
            <>
              <Button variant="secondary" size="md" href={`/report/sun/${id}?mode=edit`}>
                수정하기
              </Button>
              <DeleteReportButton apiUrl={`/api/reports/sun/${id}`} title="이 보고서를 삭제할까요?" description="삭제하면 되돌릴 수 없어요." redirectTo="/dashboard/sun-leader" />
            </>
          ) : profile.role === "pastor" && !editing ? (
            <DeleteReportButton apiUrl={`/api/reports/sun/${id}`} title="이 순보고서를 삭제할까요?" description="담임목사 권한으로 삭제합니다. 되돌릴 수 없어요." redirectTo="/admin/overview" />
          ) : undefined
        }
      />

      {submitted && (
        <div className="rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-5 flex items-center gap-4 shadow-pop pop-in">
          <PartyPopper className="h-12 w-12 shrink-0" />
          <div>
            <p className="text-2xl font-black">제출 완료! 수고하셨어요 🙏</p>
            <p className="text-base opacity-95">선교회장님께 알림이 갔어요. 홈으로 돌아가셔도 돼요.</p>
          </div>
        </div>
      )}

      {missionSubmitted && isOwnerSun && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-base text-amber-900 flex gap-2">
          <Info className="h-6 w-6 shrink-0" />
          <span>
            선교회장님이 이 주 선교회보고서를 이미 제출했어요. 그래도 고쳐서 <b>다시 제출</b>할 수 있어요. 고치면 선교회보고서 합계가 자동으로 맞춰지고 선교회장님께 알림이 가요.
          </span>
        </div>
      )}

      {editing ? (
        <SunReportForm
          profile={profile}
          reportDate={r.report_date}
          reportId={id}
          initialData={{ report: r, members: (members ?? []) as SunReportMember[] }}
          defaultMembers={[]}
        />
      ) : (
        <>
          <SunReportView report={r} members={(members ?? []) as SunReportMember[]} />
          <Comments kind="sun" reportId={id} initialComments={(comments ?? []) as ReportComment[]} currentUserId={userId} currentRole={profile.role} canComment={canComment} />
        </>
      )}
    </div>
  );
}
