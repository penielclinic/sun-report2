import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, History, TrendingUp } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { StatTile } from "@/components/ui/misc";
import { ReportStatusCard } from "@/components/reports/report-status-card";
import { RecentMessages } from "@/components/notifications/recent-messages";
import { currentReportSunday, reportWeekEnd, formatKoreanDate, formatShortDate, recentSundays } from "@/lib/dates";
import { getSunLabel, getSunEntry, BRIDGE_MISSION_ID } from "@/lib/constants/sun-directory";
import { BibleCompletionList } from "@/components/reports/bible-completion-list";
import { buildBibleCompletions } from "@/lib/bible-completion";
import { UpdateNotice } from "@/components/layout/update-notice";

export const metadata: Metadata = { title: "순장 홈" };

export default async function SunLeaderDashboard() {
  const { profile, userId } = await requirePage(["sun_leader"]);
  const supabase = await createClient();
  const thisSunday = currentReportSunday();
  const since = recentSundays(8)[7];

  const { data: reports } = await supabase
    .from("sun_reports")
    .select("id, report_date, status, attend_total, bible_chapters, offering")
    .eq("sun_number", profile.sun_number ?? -1)
    .gte("report_date", since)
    .order("report_date", { ascending: false });

  const list = reports ?? [];
  const thisWeek = list.find((r) => r.report_date === thisSunday);

  // 이번 주 통독·필사 체크 현황과 보고 단계 (순장 → 선교회장 → 담임목사)
  // 선교회보고서 제출 여부는 순장 권한으로는 보이지 않아 서비스 롤로 읽는다
  const missionId = profile.mission_id ?? getSunEntry(profile.sun_number ?? 0)?.missionId ?? null;
  let bibleDone: ReturnType<typeof buildBibleCompletions> = [];
  let missionSubmitted = false;
  if (thisWeek && missionId) {
    const admin = createAdminClient();
    const [{ data: flagged }, { data: missionReport }] = await Promise.all([
      admin
        .from("sun_report_members")
        .select("member_name, bible_tongdok, bible_pilsa")
        .eq("report_id", thisWeek.id)
        .or("bible_tongdok.eq.true,bible_pilsa.eq.true"),
      admin.from("mission_reports").select("status").eq("mission_id", missionId).eq("report_date", thisSunday).maybeSingle(),
    ]);
    missionSubmitted = missionReport?.status === "submitted";
    bibleDone = buildBibleCompletions([{ mission_id: missionId, report_date: thisSunday, members: flagged ?? [] }]);
  }
  const bibleStep =
    thisWeek?.status !== "submitted"
      ? "보고서를 제출하면 선교회장님께 전달돼요."
      : missionId === BRIDGE_MISSION_ID
        ? "✓ 목사님께 보고되었어요. (브릿지선교회 — 목자 직접보고)"
        : missionSubmitted
          ? "✓ 선교회장님을 거쳐 목사님께 보고되었어요."
          : "✓ 선교회장님께 전달됐어요. 선교회장님이 선교회보고서를 내시면 목사님께 올라가요.";
  const submitted = list.filter((r) => r.status === "submitted");
  const avgAttend = submitted.length ? Math.round(submitted.reduce((s, r) => s + r.attend_total, 0) / submitted.length) : 0;
  const totalBible = submitted.reduce((s, r) => s + r.bible_chapters, 0);

  return (
    <div className="space-y-5">
      <UpdateNotice />

      <div className="rise-in">
        <h1 className="text-2xl sm:text-3xl font-black">
          {profile.name} 순장님, 안녕하세요 👋
        </h1>
        <p className="text-lg text-ink-soft">{getSunLabel(profile.sun_number ?? 0)} 보고 현황</p>
      </div>

      <ReportStatusCard
        status={thisWeek ? thisWeek.status : "none"}
        dateLabel={`${formatKoreanDate(thisSunday)} 주일`}
        submittedLabel={thisWeek?.status === "submitted" ? `주일낮 ${thisWeek.attend_total}명 · 성경 ${thisWeek.bible_chapters}장 — 고쳐서 다시 낼 수 있어요` : undefined}
        href={thisWeek ? `/report/sun/${thisWeek.id}` : "/report/sun/new"}
        ctaLabel={thisWeek?.status === "submitted" ? "제출한 보고서 보기" : thisWeek ? "이어서 작성하기" : "이번 주 순보고서 작성"}
      />

      <p className="px-1 text-base text-ink-soft" style={{ wordBreak: "keep-all" }}>
        이번 주 보고 기간은 <b>{formatKoreanDate(reportWeekEnd(), { year: false })}</b>까지예요. 그때까지는 몇 번이든 고쳐서 다시 낼 수 있고,
        다음 주일 0시가 되면 새 주일 보고서가 열려요.
      </p>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 rise-in rise-in-2">
        <StatTile label="최근 8주 제출" value={submitted.length} unit="회" tone="brand" />
        <StatTile label="평균 주일낮" value={avgAttend} unit="명" tone="amber" icon={<TrendingUp className="h-4 w-4" />} />
        <StatTile label="8주 성경" value={totalBible} unit="장" tone="emerald" />
      </div>

      {thisWeek && (
        <div className="space-y-2 rise-in rise-in-3">
          <BibleCompletionList
            completions={bibleDone}
            title="이번 주 성경통독 · 필사 보고"
            emptyText="이번 주 보고서에 체크하신 분이 없어요. 다 마치신 순원이 있으면 이름을 눌러 체크해 주세요."
          />
          {bibleDone.length > 0 && (
            <p className="px-1 text-base text-ink-soft" style={{ wordBreak: "keep-all" }}>
              {bibleStep}
            </p>
          )}
        </div>
      )}

      <RecentMessages userId={userId} />

      <Card className="rise-in rise-in-4">
        <CardHeader className="flex items-center justify-between">
          <CardTitle icon={<History className="h-6 w-6 text-brand-600" />}>최근 보고서</CardTitle>
          <Link href="/report/sun/history" className="inline-flex items-center text-base font-bold text-brand-700">
            전체보기 <ChevronRight className="h-5 w-5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {list.length === 0 ? (
            <p className="px-6 pb-6 text-base text-ink-soft">아직 작성한 보고서가 없어요.</p>
          ) : (
            <ul className="divide-y">
              {list.slice(0, 6).map((r) => (
                <li key={r.id}>
                  <Link href={`/report/sun/${r.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 sm:px-6 hover:bg-brand-50/60">
                    <div>
                      <p className="text-lg font-bold">{formatShortDate(r.report_date)} 주일</p>
                      <p className="text-base text-ink-soft">주일낮 {r.attend_total}명 · 성경 {r.bible_chapters}장</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      <ChevronRight className="h-6 w-6 text-slate-400" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
