import { z } from "zod";
import { SPECIAL_CATEGORIES } from "@/types/database";
import { isValidDateString } from "@/lib/dates";

export const dateSchema = z.string().refine(isValidDateString, "날짜 형식이 올바르지 않습니다");

const boolDefault = z.boolean().default(false);

export const memberSchema = z.object({
  member_name: z.string().trim().min(1).max(30),
  attend_samil: boolDefault,
  attend_friday: boolDefault,
  attend_sun_day: boolDefault,
  attend_sun_eve: boolDefault,
  attend_sun: boolDefault,
  evangelism: boolDefault,
  bulletin_recv: boolDefault,
  bible_read: z.coerce.number().int().min(0).max(2000).default(0),
  member_note: z.string().trim().max(300).nullable().optional(),
});

export const sunReportSchema = z.object({
  reportId: z.string().uuid().nullable().optional(),
  report_date: dateSchema,
  worship_date: dateSchema.nullable().optional(),
  worship_time: z.string().trim().max(20).nullable().optional(),
  worship_place: z.string().trim().max(50).nullable().optional(),
  worship_leader: z.string().trim().max(30).nullable().optional(),
  bible_chapters: z.coerce.number().int().min(0).max(100000).nullable().optional(),
  offering: z.coerce.number().int().min(0).max(1_000_000_000).default(0),
  special_note: z.string().trim().max(2000).nullable().optional(),
  status: z.enum(["draft", "submitted"]),
  members: z.array(memberSchema).max(120),
});
export type SunReportInput = z.infer<typeof sunReportSchema>;

export const specialItemSchema = z.object({
  category: z.enum(SPECIAL_CATEGORIES),
  content: z.string().trim().min(1).max(1000),
});

export const missionReportSchema = z.object({
  reportId: z.string().uuid().nullable().optional(),
  report_date: dateSchema,
  total_offering: z.coerce.number().int().min(0).max(1_000_000_000).default(0),
  special_note: z.string().trim().max(2000).nullable().optional(),
  status: z.enum(["draft", "submitted"]),
  special_items: z.array(specialItemSchema).max(50).default([]),
});
export type MissionReportInput = z.infer<typeof missionReportSchema>;

export const commentSchema = z.object({
  content: z.string().trim().min(1, "내용을 입력해 주세요").max(1000),
});

export const roleSchema = z.enum(["sun_leader", "mission_leader", "pastor"]);

export const registerSchema = z.object({
  login_id: z.string().trim().min(1).max(20),
  pin: z.string().regex(/^\d{4,8}$/),
  name: z.string().trim().min(1).max(20),
  phone: z.string().trim().max(20).nullable().optional(),
  role: roleSchema,
  sun_number: z.coerce.number().int().min(1).max(45).nullable().optional(),
  mission_id: z.coerce.number().int().min(1).max(13).nullable().optional(),
});

export function firstIssue(err: z.ZodError): string {
  const i = err.issues[0];
  return i ? `${i.path.join(".") ? i.path.join(".") + ": " : ""}${i.message}` : "입력값이 올바르지 않습니다";
}
