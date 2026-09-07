import type { Role } from "@/types/database";

export interface NavItem {
  href: string;
  label: string;
  icon: "home" | "edit" | "history" | "bell" | "settings" | "grid" | "chart" | "users" | "menu" | "book";
  /** 활성 판정용 prefix (기본: href) */
  match?: string;
}

export function navFor(role: Role): NavItem[] {
  if (role === "sun_leader") {
    return [
      { href: "/dashboard/sun-leader", label: "홈", icon: "home" },
      { href: "/report/sun/new", label: "보고서 작성", icon: "edit", match: "/report/sun" },
      { href: "/report/sun/history", label: "지난 보고서", icon: "history" },
      { href: "/notifications", label: "알림", icon: "bell" },
      { href: "/settings", label: "설정", icon: "settings" },
    ];
  }
  if (role === "mission_leader") {
    return [
      { href: "/dashboard/mission-leader", label: "홈", icon: "home" },
      { href: "/report/mission/new", label: "선교회보고서", icon: "edit", match: "/report/mission" },
      { href: "/report/mission/history", label: "지난 보고서", icon: "history" },
      { href: "/notifications", label: "알림", icon: "bell" },
      { href: "/settings", label: "설정", icon: "settings" },
    ];
  }
  return [
    { href: "/dashboard/pastor", label: "홈", icon: "home" },
    { href: "/admin/overview", label: "전체 현황", icon: "grid" },
    { href: "/admin/statistics", label: "통계", icon: "chart" },
    { href: "/notifications", label: "알림", icon: "bell" },
    { href: "/admin", label: "관리 메뉴", icon: "menu", match: "/admin/" },
  ];
}
