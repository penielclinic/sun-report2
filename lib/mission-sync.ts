import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { aggregateSunReports } from "@/lib/report-utils";
import { notify, missionLeaderIds } from "@/lib/notify";
import { getMissionName } from "@/lib/constants/sun-directory";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * 순보고서가 저장·삭제된 뒤, 같은 주 선교회보고서가 있으면 합계(순 수·참석·성경)를 다시 계산해 맞춘다.
 * 선교회보고서가 이미 제출된 상태였다면 선교회장에게 "확인 후 다시 제출" 알림을 보낸다.
 */
export async function syncMissionReportAfterSunChange(
  admin: Admin,
  input: { missionId: number; reportDate: string; sunNumber: number; sunLeader: string; action: "submitted" | "draft" | "deleted" }
): Promise<boolean> {
  const { missionId, reportDate, sunNumber, sunLeader, action } = input;
  const { data: mr } = await admin
    .from("mission_reports")
    .select("id, status, total_sun, total_attend, total_bible")
    .eq("mission_id", missionId)
    .eq("report_date", reportDate)
    .maybeSingle();
  if (!mr) return false;

  const { data: sunReports } = await admin
    .from("sun_reports")
    .select("status, attend_total, bible_chapters, offering")
    .eq("mission_id", missionId)
    .eq("report_date", reportDate);
  const agg = aggregateSunReports(sunReports ?? []);

  const changed = agg.total_sun !== mr.total_sun || agg.total_attend !== mr.total_attend || agg.total_bible !== mr.total_bible;
  if (changed) {
    await admin.from("mission_reports").update({ total_sun: agg.total_sun, total_attend: agg.total_attend, total_bible: agg.total_bible }).eq("id", mr.id);
  }

  if (mr.status === "submitted" && (action !== "draft" || changed)) {
    const what = action === "deleted" ? "삭제했어요" : action === "submitted" ? "수정해서 다시 제출했어요" : "수정 중이에요";
    await notify(admin, {
      userIds: await missionLeaderIds(admin, missionId),
      kind: "report",
      title: `${sunNumber}순 보고서가 바뀌었어요`,
      body: `${sunLeader} 순장님이 ${reportDate} 순보고서를 ${what}. 이미 제출한 ${getMissionName(missionId)} 보고서 합계가 자동으로 맞춰졌어요. 내용을 확인하고 필요하면 다시 제출해 주세요.`,
      link: `/report/mission/${mr.id}`,
    });
    return true;
  }
  return false;
}
