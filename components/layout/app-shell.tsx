"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Home,
  FilePenLine,
  History,
  Bell,
  Settings,
  LayoutGrid,
  BarChart3,
  Users,
  Menu,
  BookOpen,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ROLE_LABEL, type Profile } from "@/types/database";
import { navFor, type NavItem } from "./nav-config";
import { FontSizeToggle } from "./font-size-toggle";
import { LogoutButton } from "./logout-button";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { getSunLabel, getMissionName } from "@/lib/constants/sun-directory";

const ICONS = {
  home: Home,
  edit: FilePenLine,
  history: History,
  bell: Bell,
  settings: Settings,
  grid: LayoutGrid,
  chart: BarChart3,
  users: Users,
  menu: Menu,
  book: BookOpen,
};

const ROLE_TONE: Record<Profile["role"], string> = {
  sun_leader: "from-emerald-600 via-teal-600 to-emerald-700",
  mission_leader: "from-amber-500 via-orange-500 to-rose-500",
  pastor: "from-violet-600 via-indigo-600 to-brand-700",
};

function useUnreadCount(userId: string) {
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    try {
      const supabase = createClient();
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("read", false);
      setCount(count ?? 0);
    } catch {
      /* 오프라인 등 — 무시 */
    }
  }, [userId]);

  useEffect(() => {
    const t = setTimeout(refresh, 0);
    return () => clearTimeout(t);
  }, [refresh, pathname]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notif-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, () => refresh())
      .subscribe();
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId, refresh]);

  return count;
}

function isActive(pathname: string, item: NavItem) {
  const m = item.match ?? item.href;
  if (item.href === "/admin") return pathname === "/admin" || (pathname.startsWith("/admin/") && !["/admin/overview", "/admin/statistics"].some((p) => pathname.startsWith(p)));
  return pathname === m || pathname.startsWith(m + "/") || (item.match ? pathname.startsWith(item.match) : false);
}

export function AppShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const pathname = usePathname();
  const items = navFor(profile.role);
  const unread = useUnreadCount(profile.id);

  const scope =
    profile.role === "sun_leader" && profile.sun_number
      ? getSunLabel(profile.sun_number)
      : profile.role === "mission_leader" && profile.mission_id
        ? getMissionName(profile.mission_id)
        : "전체";

  return (
    <ConfirmProvider>
      <div className="min-h-dvh flex flex-col">
        {/* 상단 헤더 */}
        <header className={cn("sticky top-0 z-40 bg-gradient-to-r text-white shadow-pop no-print", ROLE_TONE[profile.role])}>
          <div className="mx-auto max-w-6xl px-4 h-17 flex items-center justify-between gap-3">
            <Link href={items[0].href} className="flex items-center gap-2.5 min-w-0">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/95 shadow">
                <Image src="/logo.png" alt="" width={32} height={26} className="h-auto w-8" priority />
              </span>
              <span className="min-w-0">
                <span className="block text-xl font-black leading-tight">순보고</span>
                <span className="block text-[0.85rem] leading-tight opacity-90 truncate">
                  {profile.name} · {ROLE_LABEL[profile.role]} · {scope}
                </span>
              </span>
            </Link>

            {/* 데스크톱 내비게이션 */}
            <nav className="hidden md:flex items-center gap-1" aria-label="주요 메뉴">
              {items.map((item) => {
                const Icon = ICONS[item.icon];
                const active = isActive(pathname, item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-1.5 rounded-xl px-3.5 h-12 text-[1.02rem] font-bold transition-colors",
                      active ? "bg-white text-ink shadow" : "text-white/90 hover:bg-white/15"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                    {item.icon === "bell" && unread > 0 && <Dot count={unread} />}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <Link href="/guide" className="hidden sm:grid h-11 w-11 place-items-center rounded-full bg-white/15 hover:bg-white/25" title="사용설명서" aria-label="사용설명서">
                <HelpCircle className="h-6 w-6" />
              </Link>
              <FontSizeToggle light className="hidden sm:inline-flex" />
              <LogoutButton variant="ghost" size="sm" className="hidden md:inline-flex bg-white/15 text-white hover:bg-white/25" />
              <Link href="/notifications" className="md:hidden relative grid h-11 w-11 place-items-center rounded-full bg-white/15" aria-label={`알림 ${unread}개`}>
                <Bell className="h-6 w-6" />
                {unread > 0 && <Dot count={unread} />}
              </Link>
            </div>
          </div>
        </header>

        {/* 본문 */}
        <main className="flex-1 mx-auto w-full max-w-6xl px-4 pt-5 pb-28 md:pb-12">{children}</main>

        {/* 모바일 하단 탭 */}
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-white/95 backdrop-blur shadow-[0_-8px_24px_-12px_rgb(29_47_133/0.25)] no-print"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          aria-label="하단 메뉴"
        >
          <div className="grid grid-cols-5 h-18">
            {items.map((item) => {
              const Icon = ICONS[item.icon];
              const active = isActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-0.5 text-[0.78rem] font-bold leading-tight",
                    active ? "text-brand-700" : "text-ink-soft"
                  )}
                >
                  <span className={cn("grid h-9 w-12 place-items-center rounded-2xl transition-colors", active && "bg-brand-100")}>
                    <Icon className="h-6 w-6" />
                    {item.icon === "bell" && unread > 0 && <Dot count={unread} className="top-0 right-1" />}
                  </span>
                  <span className="truncate max-w-full px-1">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </ConfirmProvider>
  );
}

function Dot({ count, className }: { count: number; className?: string }) {
  return (
    <span
      className={cn(
        "absolute -top-1 -right-1 min-w-5 h-5 px-1 grid place-items-center rounded-full bg-rose-500 text-white text-[0.72rem] font-black ring-2 ring-white",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
