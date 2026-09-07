export type Role = "sun_leader" | "mission_leader" | "pastor";
export type ProfileStatus = "pending" | "active" | "rejected";
export type ReportStatus = "draft" | "submitted";

export const ROLE_LABEL: Record<Role, string> = {
  sun_leader: "순장",
  mission_leader: "선교회장",
  pastor: "담임목사",
};

export const SPECIAL_CATEGORIES = ["질병", "재정문제", "인간관계", "진로및직장문제", "기타"] as const;
export type SpecialCategory = (typeof SPECIAL_CATEGORIES)[number];

export const SPECIAL_STATUSES = ["기도중", "진행중", "해결됨"] as const;
export type SpecialStatus = (typeof SPECIAL_STATUSES)[number];

export interface Profile {
  id: string;
  login_id: string;
  name: string;
  role: Role;
  sun_number: number | null;
  mission_id: number | null;
  status: ProfileStatus;
  phone: string | null;
  created_at: string;
}

export interface SunReport {
  id: string;
  sun_number: number;
  sun_leader: string;
  mission_id: number;
  report_date: string;
  worship_at: string | null;
  worship_place: string | null;
  worship_leader: string | null;
  attend_total: number;
  bible_chapters: number;
  offering: number;
  special_note: string | null;
  status: ReportStatus;
  submitted_at: string | null;
  created_by: string;
  created_at: string;
}

export interface SunReportMember {
  id: string;
  report_id: string;
  sort_order: number;
  member_name: string;
  attend_samil: boolean;
  attend_friday: boolean;
  attend_sun_day: boolean;
  attend_sun_eve: boolean;
  attend_sun: boolean;
  evangelism: boolean;
  bulletin_recv: boolean;
  bible_read: number;
  member_note: string | null;
}

export type AttendKey =
  | "attend_samil"
  | "attend_friday"
  | "attend_sun_day"
  | "attend_sun_eve"
  | "attend_sun"
  | "evangelism";

export const ATTEND_COLS: { key: AttendKey; label: string; short: string; color: string }[] = [
  { key: "attend_samil", label: "삼일예배", short: "삼일", color: "indigo" },
  { key: "attend_friday", label: "금요예배", short: "금요", color: "violet" },
  { key: "attend_sun_day", label: "주일낮예배", short: "주낮", color: "amber" },
  { key: "attend_sun_eve", label: "주일밤예배", short: "주밤", color: "rose" },
  { key: "attend_sun", label: "순모임", short: "순모임", color: "emerald" },
  { key: "evangelism", label: "전도", short: "전도", color: "orange" },
];

export interface SunReportWithMembers extends SunReport {
  sun_report_members: SunReportMember[];
}

export interface MissionReport {
  id: string;
  mission_id: number;
  report_date: string;
  mission_leader: string | null;
  total_sun: number;
  total_attend: number;
  total_bible: number;
  total_offering: number;
  special_note: string | null;
  status: ReportStatus;
  submitted_at: string | null;
  created_by: string;
  created_at: string;
}

export interface SpecialReportItem {
  id: string;
  mission_report_id: string | null;
  mission_id: number;
  report_date: string;
  mission_leader: string | null;
  category: SpecialCategory;
  content: string;
  status: SpecialStatus;
  pastor_memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportComment {
  id: string;
  report_id: string;
  author_id: string;
  author_name: string;
  author_role: Role;
  content: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface PastoralAlert {
  id: string;
  alert_type: "keyword" | "special_item" | "absence";
  sun_number: number | null;
  sun_leader: string | null;
  mission_id: number | null;
  mission_leader: string | null;
  member_name: string | null;
  triggered_by: string | null;
  source_text: string | null;
  source_report_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

/** 편성표 항목의 최소 형태 (클라이언트 컴포넌트 props 용) */
export interface SunEntryLike {
  sunNumber: number;
  sunLeader: string;
  missionId: number;
}
