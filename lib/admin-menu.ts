export interface AdminMenuItem {
  href: string;
  title: string;
  desc: string;
  icon: "grid" | "chart" | "download" | "users" | "trophy" | "people" | "clipboard" | "heart" | "send" | "book" | "help" | "settings";
  tone: "brand" | "emerald" | "amber" | "violet" | "rose" | "sky" | "gold" | "orange";
}

/** 담임목사 관리 메뉴 (홈 타일 + /admin 허브 공용) */
export const ADMIN_MENU: AdminMenuItem[] = [
  { href: "/admin/overview", title: "전체 보고 현황", desc: "주일별 45순·13선교회 제출 현황", icon: "grid", tone: "brand" },
  { href: "/admin/statistics", title: "통계 · 차트", desc: "출석·성경·헌금·전도 추이 (주/월/년)", icon: "chart", tone: "violet" },
  { href: "/admin/weekly-report", title: "주간 보고 출력", desc: "선교회별 예배 보고 표 · 엑셀 · PDF", icon: "download", tone: "gold" },
  { href: "/admin/special-reports", title: "특별보고 관리", desc: "질병·재정·인간관계 등 기도제목 진행상황", icon: "clipboard", tone: "rose" },
  { href: "/admin/alerts", title: "목양 알림", desc: "긴급 소식 · 장기 결석자 자동 감지", icon: "heart", tone: "orange" },
  { href: "/admin/messages", title: "메시지 보내기", desc: "순장·선교회장에게 공지 발송", icon: "send", tone: "sky" },
  { href: "/admin/member-scores", title: "순원 점수 순위", desc: "출석·전도·성경 점수 (주/월/년)", icon: "trophy", tone: "amber" },
  { href: "/admin/members", title: "순원 명단", desc: "45순 편성표 · 이름 검색", icon: "people", tone: "emerald" },
  { href: "/admin/users", title: "사용자 관리", desc: "가입 승인 · 계정 생성 · 비밀번호 초기화", icon: "users", tone: "brand" },
  { href: "/admin/briefing", title: "AI 목회 브리핑", desc: "이번 주 보고서를 요약한 목회 노트", icon: "book", tone: "violet" },
  { href: "/settings", title: "내 설정 · 비밀번호", desc: "내 비밀번호 바꾸기 · 전화번호 · 글자 크기", icon: "settings", tone: "sky" },
  { href: "/guide", title: "사용설명서", desc: "역할별 이용 안내", icon: "help", tone: "emerald" },
];
