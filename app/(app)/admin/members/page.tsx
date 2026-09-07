import type { Metadata } from "next";
import { UsersRound } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/misc";
import { MembersBrowser } from "./members-browser";
import { SUN_DIRECTORY } from "@/lib/constants/sun-directory";

export const metadata: Metadata = { title: "순원 명단" };

export default async function MembersPage() {
  await requirePage(["pastor"]);
  const total = SUN_DIRECTORY.reduce((s, e) => s + e.members.length, 0);
  return (
    <div className="space-y-5">
      <PageHeader title="순원 명단" subtitle={`45순 · 편성표 기준 ${total}명 (실제 명단은 각 순보고서 기준)`} icon={<UsersRound className="h-7 w-7" />} />
      <MembersBrowser entries={SUN_DIRECTORY} />
    </div>
  );
}
