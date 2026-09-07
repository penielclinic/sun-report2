import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApi, jsonError } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { commentSchema, firstIssue } from "@/lib/validation";
import { notify, pastorIds } from "@/lib/notify";
import { ROLE_LABEL } from "@/types/database";
import { getMissionName } from "@/lib/constants/sun-directory";

type Kind = "sun" | "mission";

async function loadTarget(kind: Kind, id: string) {
  const admin = createAdminClient();
  if (kind === "sun") {
    const { data } = await admin.from("sun_reports").select("id, sun_number, mission_id, created_by").eq("id", id).maybeSingle();
    return data ? { ...data, label: `${data.sun_number}순 보고서`, link: `/report/sun/${id}` } : null;
  }
  const { data } = await admin.from("mission_reports").select("id, mission_id, created_by").eq("id", id).maybeSingle();
  return data ? { ...data, sun_number: null, label: `${getMissionName(data.mission_id)} 보고서`, link: `/report/mission/${id}` } : null;
}

function canAccess(kind: Kind, profile: { role: string; mission_id: number | null; sun_number: number | null }, userId: string, t: { created_by: string; mission_id: number; sun_number: number | null }) {
  if (profile.role === "pastor") return true;
  if (t.created_by === userId) return true;
  if (profile.role === "mission_leader" && profile.mission_id === t.mission_id) return true;
  if (kind === "sun" && profile.role === "sun_leader" && profile.sun_number === t.sun_number) return true;
  return false;
}

/** 답글 작성 */
export async function POST(request: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  if (kind !== "sun" && kind !== "mission") return jsonError("잘못된 요청", 400);
  const { session, error } = await requireApi();
  if (error) return error;

  const parsed = commentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(firstIssue(parsed.error));

  const target = await loadTarget(kind, id);
  if (!target) return jsonError("보고서를 찾을 수 없어요", 404);
  if (!canAccess(kind, session.profile, session.userId, target)) return jsonError("이 보고서에 답글을 쓸 수 없어요", 403);

  const admin = createAdminClient();
  const table = kind === "sun" ? "sun_report_comments" : "mission_report_comments";
  const { data: comment, error: insErr } = await admin
    .from(table)
    .insert({
      report_id: id,
      author_id: session.userId,
      author_name: session.profile.name,
      author_role: session.profile.role,
      content: parsed.data.content,
    })
    .select("*")
    .single();
  if (insErr) return jsonError(insErr.message, 500);

  // 알림: 작성자에게 (본인 답글 제외). 선교회장·순장의 답글은 담임목사에게도.
  const preview = parsed.data.content.slice(0, 80);
  const title = `${ROLE_LABEL[session.profile.role]} ${session.profile.name}님의 답글`;
  const recipients = new Set<string>();
  if (target.created_by !== session.userId) recipients.add(target.created_by);
  if (session.profile.role !== "pastor") (await pastorIds(admin)).forEach((p) => recipients.add(p));
  recipients.delete(session.userId);
  await notify(admin, { userIds: [...recipients], kind: "comment", title, body: `${target.label}: ${preview}`, link: target.link });

  return NextResponse.json({ comment });
}

const delSchema = z.object({ commentId: z.string().uuid() });

/** 답글 삭제 — 본인 것 또는 담임목사 */
export async function DELETE(request: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  if (kind !== "sun" && kind !== "mission") return jsonError("잘못된 요청", 400);
  const { session, error } = await requireApi();
  if (error) return error;

  const parsed = delSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("잘못된 요청");

  const admin = createAdminClient();
  const table = kind === "sun" ? "sun_report_comments" : "mission_report_comments";
  let q = admin.from(table).delete().eq("id", parsed.data.commentId).eq("report_id", id);
  if (session.profile.role !== "pastor") q = q.eq("author_id", session.userId);
  const { error: delErr } = await q;
  if (delErr) return jsonError(delErr.message, 500);
  return NextResponse.json({ ok: true });
}
