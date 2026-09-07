import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, CheckCircle2, Clock3, CircleDashed, Church } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatTile, ProgressBar } from "@/components/ui/misc";
import { StatusBadge } from "@/components/ui/badge";
import { SundayPicker } from "@/components/reports/sunday-picker";
import { AdminTiles } from "@/components/admin/admin-tiles";
import { RecentMessages } from "@/components/notifications/recent-messages";
import { ADMIN_MENU } from "@/lib/admin-menu";
import { currentReportSunday, formatKoreanDate, isValidDateString, isSunday } from "@/lib/dates";
import { MISSION_IDS, SUN_COUNT, MISSION_REPORT_COUNT, BRIDGE_MISSION_ID, getMissionName, getSunsByMission } from "@/lib/constants/sun-directory";
import { formatWon } from "@/lib/utils";

export const metadata: Metadata = { title: "담임목사 홈" };

export default async function PastorDashboard({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { profile, userId } = await requirePage(["pastor"]);
  const { date } = await searchParams;
  const selected = date && isValidDateString(date) && isSunday(date) ? date : currentReportSunday();
  const supabase = await createClient();
  const admin = createAdminClient();

  const [{ data: sunReports }, { data: missionReports }, { count: pending }, { count: alerts }] = await Promise.all([
    supabase.from("sun_reports").select("id, sun_number, mission_id, status, attend_total, bible_chapters, offering").eq("report_date", selected),
    supabase.from("mission_reports").select("id, mission_id, status, total_offering").eq("report_date", selected),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("pastoral_alerts").select("id", { count: "exact", head: true }).eq("is_read", false),
  ]);

  const suns = sunReports ?? [];
  const missions = missionReports ?? [];
  const submittedSuns = suns.filter((r) => r.status === "submitted");
  const submittedMissions = missions.filter((r) => r.status === "submitted");
  const totalAttend = submittedSuns.reduce((s, r) => s + r.attend_total, 0);
  const totalBible = submittedSuns.reduce((s, r) => s + r.bible_chapters, 0);
  const totalOffering = submittedMissions.reduce((s, r) => s + r.total_offering, 0) || submittedSuns.reduce((s, r) => s + (r.offering ?? 0), 0);
  const missionMap = new Map(missions.map((m) => [m.mission_id, m]));

  return (
    <div className="space-y-5">
      <div className="rise-in">
        <h1 className="text-2xl sm:text-3xl font-black">{profile.name} 목사님, 안녕하세요 🙏</h1>
        <p className="text-lg text-ink-soft">{formatKoreanDate(selected)} 주일 전체 보고 현황</p>
      </div>

      <SundayPicker value={selected} basePath="/dashboard/pastor" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card tone="violet" className="p-6 rise-in rise-in-2">
          <p className="text-base font-bold opacity-90">순보고서 제출</p>
          <div className="mt-1 flex items-end justify-between">
            <p className="text-5xl font-black tabular-nums">
              {submittedSuns.length}
              <span className="text-2xl font-bold opacity-80"> / {SUN_COUNT} 순</span>
            </p>
            <p className="text-4xl font-black">{Math.round((submittedSuns.length / SUN_COUNT) * 100)}%</p>
          </div>
          <ProgressBar value={submittedSuns.length} max={SUN_COUNT} tone="gold" className="mt-4" />
        </Card>
        <Card tone="brand" className="p-6 rise-in rise-in-2">
          <p className="text-base font-bold opacity-90">선교회보고서 제출</p>
          <div className="mt-1 flex items-end justify-between">
            <p className="text-5xl font-black tabular-nums">
              {submittedMissions.length}
              <span className="text-2xl font-bold opacity-80"> / {MISSION_REPORT_COUNT} 선교회</span>
            </p>
            <p className="text-4xl font-black">{Math.round((submittedMissions.length / MISSION_REPORT_COUNT) * 100)}%</p>
          </div>
          <ProgressBar value={submittedMissions.length} max={MISSION_REPORT_COUNT} tone="gold" className="mt-4" />
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 rise-in rise-in-3">
        <StatTile label="주일낮 참석" value={totalAttend} unit="명" tone="amber" />
        <StatTile label="성경 읽기" value={totalBible} unit="장" tone="emerald" />
        <StatTile label="헌금 총액" value={formatWon(totalOffering)} tone="sky" />
      </div>

      <AdminTiles items={ADMIN_MENU.slice(0, 8)} compact badges={{ "/admin/users": pending ?? 0, "/admin/alerts": alerts ?? 0 }} />

      <Card className="rise-in rise-in-4">
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle icon={<Church className="h-6 w-6 text-brand-600" />}>선교회별 현황</CardTitle>
            <CardDescription>선교회를 누르면 보고서를 볼 수 있어요</CardDescription>
          </div>
          <Link href={`/admin/overview?date=${selected}`} className="inline-flex items-center text-base font-bold text-brand-700 whitespace-nowrap">
            순별 상세 <ChevronRight className="h-5 w-5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y sm:grid sm:grid-cols-2 sm:divide-y-0">
            {MISSION_IDS.map((mId) => {
              const mr = missionMap.get(mId);
              const mySuns = suns.filter((s) => s.mission_id === mId);
              const submitted = mySuns.filter((s) => s.status === "submitted").length;
              const total = getSunsByMission(mId).length;
              const isBridge = mId === BRIDGE_MISSION_ID;
              const done = isBridge ? submitted > 0 : mr?.status === "submitted";
              const Icon = done ? CheckCircle2 : submitted > 0 || mr ? Clock3 : CircleDashed;
              const color = done ? "text-emerald-500" : submitted > 0 || mr ? "text-amber-500" : "text-slate-300";
              const inner = (
                <div className="flex items-center justify-between gap-3 px-5 py-3.5 sm:border-b">
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={"h-8 w-8 shrink-0 " + color} />
                    <div>
                      <p className="text-lg font-bold">{getMissionName(mId)}</p>
                      <p className="text-base text-ink-soft">{isBridge ? `목자 직접보고 ${submitted}/1` : `순보고 ${submitted}/${total}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={isBridge ? (submitted > 0 ? "submitted" : "none") : mr?.status} />
                    {mr && <ChevronRight className="h-6 w-6 text-slate-400" />}
                  </div>
                </div>
              );
              return (
                <li key={mId}>
                  {mr ? (
                    <Link href={`/report/mission/${mr.id}`} className="block hover:bg-brand-50/60">
                      {inner}
                    </Link>
                  ) : (
                    inner
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
