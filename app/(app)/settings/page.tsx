import type { Metadata } from "next";
import { Settings, HelpCircle } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FontSizeToggle } from "@/components/layout/font-size-toggle";
import { LogoutButton } from "@/components/layout/logout-button";
import { SettingsForms } from "./settings-forms";
import { ROLE_LABEL } from "@/types/database";
import { getSunLabel, getMissionName } from "@/lib/constants/sun-directory";

export const metadata: Metadata = { title: "설정" };

export default async function SettingsPage() {
  const { profile } = await requirePage();
  const scope = profile.role === "sun_leader" && profile.sun_number ? getSunLabel(profile.sun_number) : profile.mission_id ? getMissionName(profile.mission_id) : "전체";

  return (
    <div className="space-y-5">
      <PageHeader title="내 설정" icon={<Settings className="h-7 w-7" />} />

      <Card className="rise-in">
        <CardHeader>
          <CardTitle>내 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-lg">
          <p>
            <span className="text-ink-soft w-24 inline-block">이름</span>
            <b>{profile.name}</b>
          </p>
          <p>
            <span className="text-ink-soft w-24 inline-block">아이디</span>
            <b>{profile.login_id}</b>
          </p>
          <p className="flex items-center gap-2">
            <span className="text-ink-soft w-24 inline-block">역할</span>
            <Badge tone={profile.role === "pastor" ? "violet" : profile.role === "mission_leader" ? "amber" : "emerald"}>{ROLE_LABEL[profile.role]}</Badge>
            <span className="font-bold">{scope}</span>
          </p>
          <p className="text-base text-ink-soft pt-1">이름·역할·소속을 바꾸려면 담임목사님께 말씀해 주세요.</p>
        </CardContent>
      </Card>

      <Card className="rise-in rise-in-2">
        <CardHeader>
          <CardTitle>화면 글자 크기</CardTitle>
          <CardDescription>글자가 작아 보이면 크게 바꿔 보세요. 이 기기에 저장돼요.</CardDescription>
        </CardHeader>
        <CardContent>
          <FontSizeToggle />
        </CardContent>
      </Card>

      <SettingsForms phone={profile.phone ?? ""} />

      <Card className="rise-in rise-in-4">
        <CardContent className="pt-5 flex flex-wrap gap-3">
          <Button variant="secondary" size="lg" href="/guide">
            <HelpCircle className="h-5 w-5" /> 사용설명서
          </Button>
          <LogoutButton variant="outline" size="lg" />
        </CardContent>
      </Card>
    </div>
  );
}
