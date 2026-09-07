import Link from "next/link";
import { LayoutGrid, BarChart3, Download, Users, Trophy, UsersRound, ClipboardList, HeartHandshake, Send, BookOpen, HelpCircle, ChevronRight } from "lucide-react";
import { ADMIN_MENU, type AdminMenuItem } from "@/lib/admin-menu";
import { cn } from "@/lib/utils";

const ICON: Record<AdminMenuItem["icon"], React.ReactNode> = {
  grid: <LayoutGrid className="h-7 w-7" />,
  chart: <BarChart3 className="h-7 w-7" />,
  download: <Download className="h-7 w-7" />,
  users: <Users className="h-7 w-7" />,
  trophy: <Trophy className="h-7 w-7" />,
  people: <UsersRound className="h-7 w-7" />,
  clipboard: <ClipboardList className="h-7 w-7" />,
  heart: <HeartHandshake className="h-7 w-7" />,
  send: <Send className="h-7 w-7" />,
  book: <BookOpen className="h-7 w-7" />,
  help: <HelpCircle className="h-7 w-7" />,
};

const TONE: Record<AdminMenuItem["tone"], string> = {
  brand: "from-brand-500 to-brand-700",
  emerald: "from-emerald-500 to-teal-600",
  amber: "from-amber-400 to-orange-500",
  violet: "from-violet-500 to-indigo-600",
  rose: "from-rose-500 to-pink-600",
  sky: "from-sky-400 to-blue-500",
  gold: "from-gold-400 to-amber-500",
  orange: "from-orange-500 to-red-500",
};

export function AdminTiles({ items = ADMIN_MENU, badges = {}, compact }: { items?: AdminMenuItem[]; badges?: Record<string, number>; compact?: boolean }) {
  return (
    <div className={cn("grid gap-3", compact ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")}>
      {items.map((m, i) => (
        <Link
          key={m.href}
          href={m.href}
          className={cn("group relative flex items-center gap-3 rounded-3xl bg-white border p-4 shadow-soft hover:shadow-pop hover:-translate-y-0.5 transition-all rise-in", i > 2 && "rise-in-2")}
        >
          <span className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow", TONE[m.tone])}>{ICON[m.icon]}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-black leading-tight">{m.title}</span>
            {!compact && <span className="block text-[0.95rem] text-ink-soft leading-snug mt-0.5">{m.desc}</span>}
          </span>
          {badges[m.href] ? (
            <span className="grid min-w-8 h-8 px-2 place-items-center rounded-full bg-rose-500 text-white text-base font-black">{badges[m.href]}</span>
          ) : (
            <ChevronRight className="h-6 w-6 text-slate-300 group-hover:text-brand-500" />
          )}
        </Link>
      ))}
    </div>
  );
}
