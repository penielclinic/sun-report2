import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notify";
import { currentReportSunday, todayKST, dayOfWeek } from "@/lib/dates";
import { SUN_DIRECTORY } from "@/lib/constants/sun-directory";

/**
 * Vercel Cron — 매주 일요일 14:00 KST (05:00 UTC)
 * 아직 순보고서를 제출하지 않은 순장에게 앱 내 리마인더 알림
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = todayKST();
  const sunday = currentReportSunday();
  if (dayOfWeek(today) !== 0) return NextResponse.json({ ok: true, skipped: "not sunday" });

  const { data: submitted } = await admin.from("sun_reports").select("sun_number").eq("report_date", sunday).eq("status", "submitted");
  const done = new Set((submitted ?? []).map((r) => r.sun_number as number));

  const { data: leaders } = await admin.from("profiles").select("id, name, sun_number").eq("role", "sun_leader").eq("status", "active");
  const targets = (leaders ?? []).filter((p) => p.sun_number && !done.has(p.sun_number as number));

  for (const p of targets) {
    await notify(admin, {
      userIds: [p.id as string],
      kind: "reminder",
      title: "순보고서를 아직 안 내셨어요",
      body: `${p.name} 순장님, 오늘(${sunday}) 순보고서를 잊지 말고 제출해 주세요.`,
      link: "/report/sun/new",
    });
  }

  const missing = SUN_DIRECTORY.filter((s) => !done.has(s.sunNumber)).map((s) => s.sunNumber);
  return NextResponse.json({ ok: true, date: sunday, notified: targets.length, missingSuns: missing });
}
