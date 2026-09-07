import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Users, Church, Crown, CheckCircle2, Smartphone, Bell, KeyRound, ALargeSmall, ShieldCheck } from "lucide-react";
import { getSession, dashboardPath } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontSizeToggle } from "@/components/layout/font-size-toggle";

export const metadata: Metadata = { title: "사용설명서" };

const STEPS = {
  sun_leader: [
    "로그인 후 홈에서 <b>이번 주 순보고서 작성</b> 버튼을 누르세요.",
    "순모임 날짜·시간·장소를 확인하고 필요하면 고치세요.",
    "순원 이름 옆 <b>네모 칸</b>을 눌러 출석(삼일·금요·주낮·주밤·순모임·전도)을 체크하세요.",
    "이름을 누르면 <b>성경 읽은 장수</b>와 <b>메모</b>를 적을 수 있어요. 새가족은 <b>순원 추가</b>로 넣어요.",
    "헌금 합계와 특별보고(기도제목)를 적고 <b>제출하기</b>를 누르면 끝!",
    "제출 후에도 선교회장님이 선교회보고서를 내기 전까지는 <b>수정하기</b>로 고칠 수 있어요.",
  ],
  mission_leader: [
    "홈에서 소속 순들이 보고서를 냈는지 한눈에 확인하세요. 순을 누르면 내용을 볼 수 있어요.",
    "<b>선교회보고서 작성</b>을 누르면 순보고서가 자동으로 합산돼요.",
    "헌금 총액을 확인하고, 기도가 필요한 <b>특별보고</b>를 종류별로 등록하세요.",
    "<b>제출하기</b>를 누르면 담임목사님께 알림이 가요. 제출 후엔 순장님들이 그 주 보고서를 고칠 수 없어요.",
    "지난 주 보고서는 위쪽 날짜 선택에서 주일을 바꿔 볼 수 있어요.",
  ],
  pastor: [
    "홈에서 45순·13선교회의 제출 현황과 참석·성경·헌금 합계를 확인하세요.",
    "<b>전체 보고 현황</b>에서 순별 6가지 출석 숫자를, <b>통계</b>에서 주간·월간·연간 추이를 봐요.",
    "<b>특별보고 관리</b>에서 기도제목의 진행상황(기도중·진행중·해결됨)과 메모를 남기세요.",
    "<b>목양 알림</b>은 수술·입원 등 긴급 단어와 장기 결석자를 자동으로 모아 줘요.",
    "<b>사용자 관리</b>에서 가입 승인, 계정 만들기, 비밀번호 초기화를 할 수 있어요.",
    "<b>주간 보고 출력</b>에서 종이 양식과 같은 표를 엑셀·PDF로 저장하세요.",
  ],
};

export default async function GuidePage() {
  const session = await getSession();
  const backHref = session?.profile.status === "active" ? dashboardPath(session.profile.role) : "/login";

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-brand-700 via-brand-600 to-violet-600 text-white shadow-pop">
        <div className="mx-auto max-w-4xl px-4 h-17 flex items-center justify-between gap-3">
          <Link href={backHref} className="inline-flex items-center gap-1 text-lg font-bold whitespace-nowrap">
            <ArrowLeft className="h-6 w-6" /> <span className="hidden sm:inline">돌아가기</span>
          </Link>
          <span className="flex items-center gap-2 text-xl font-black whitespace-nowrap">
            <Image src="/logo.png" alt="" width={28} height={22} className="h-auto w-7" />
            <span className="hidden sm:inline">순보고 </span>사용설명서
          </span>
          <FontSizeToggle light />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <section className="rounded-3xl bg-white border shadow-soft p-6 rise-in">
          <h1 className="text-3xl font-black">종이 보고서가 앱으로 들어왔어요</h1>
          <p className="mt-2 text-lg text-ink-soft leading-relaxed">
            매주 주일 예배 후 <b>순장 → 선교회장 → 담임목사</b> 순으로 전달되던 보고서를 스마트폰이나 컴퓨터에서 3분이면 제출할 수 있어요.
            참석 인원·성경 장수·헌금은 자동으로 더해지고, 제출하는 순간 다음 분께 알림이 가요.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { icon: <Smartphone className="h-6 w-6" />, t: "휴대폰·PC 어디서나", d: "크롬·사파리 등 인터넷 브라우저면 돼요. 앱 설치가 필요 없어요." },
              { icon: <ALargeSmall className="h-6 w-6" />, t: "글자 크게 보기", d: "오른쪽 위 '글자 크게' 버튼을 누르면 모든 글자가 커져요." },
              { icon: <ShieldCheck className="h-6 w-6" />, t: "안전한 보관", d: "보고서는 교회 전용 데이터베이스에 안전하게 저장돼요." },
            ].map((x) => (
              <div key={x.t} className="rounded-2xl bg-brand-50 p-4">
                <div className="flex items-center gap-2 text-brand-700 font-black text-lg">
                  {x.icon} {x.t}
                </div>
                <p className="mt-1 text-base text-ink-soft">{x.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 rise-in rise-in-2">
          <Card>
            <CardHeader>
              <CardTitle icon={<KeyRound className="h-6 w-6 text-amber-600" />}>처음 시작하기</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal pl-6 space-y-2 text-lg leading-relaxed">
                <li>
                  로그인 화면에서 <b>회원가입</b>을 누르세요.
                </li>
                <li>역할(순장·선교회장·담임목사)과 담당 순 또는 선교회를 고르세요.</li>
                <li>
                  <b>이름</b>이 아이디예요. 비밀번호는 <b>숫자 4~8자리</b>로 정하세요.
                </li>
                <li>담임목사님이 승인하면 로그인할 수 있어요.</li>
                <li>
                  비밀번호는 <b>설정</b>에서 언제든 직접 바꿀 수 있어요. 잊어버리면 로그인 화면의 <b>비밀번호를 잊으셨나요?</b>에서 등록된 전화번호로 새로 정하거나, 담임목사님께 초기화를 부탁하세요.
                </li>
              </ol>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle icon={<Bell className="h-6 w-6 text-rose-500" />}>알림은 이렇게 와요</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-lg leading-relaxed">
                {[
                  "순장이 제출하면 → 선교회장에게",
                  "선교회장이 제출하면 → 담임목사에게",
                  "보고서에 답글이 달리면 → 작성자에게",
                  "담임목사 공지 메시지 → 순장·선교회장에게",
                  "주일 오후 2시, 아직 안 낸 순장에게 → 알림",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-500 mt-0.5" /> {t}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-base text-ink-soft">위쪽 종 모양(알림)에 빨간 숫자가 뜨면 새 소식이 있다는 뜻이에요.</p>
            </CardContent>
          </Card>
        </section>

        {(
          [
            ["sun_leader", "순장", <Users key="a" className="h-7 w-7" />, "from-emerald-500 to-teal-600"],
            ["mission_leader", "선교회장", <Church key="b" className="h-7 w-7" />, "from-amber-400 to-orange-500"],
            ["pastor", "담임목사", <Crown key="c" className="h-7 w-7" />, "from-violet-500 to-indigo-600"],
          ] as const
        ).map(([key, label, icon, tone]) => (
          <Card key={key} className="rise-in rise-in-3">
            <CardHeader className="flex items-center gap-3">
              <span className={`grid h-13 w-13 place-items-center rounded-2xl bg-gradient-to-br text-white ${tone}`}>{icon}</span>
              <CardTitle className="text-2xl">{label}은 이렇게 써요</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {STEPS[key].map((s, i) => (
                  <li key={i} className="flex gap-3 text-lg leading-relaxed">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-800 font-black">{i + 1}</span>
                    <span dangerouslySetInnerHTML={{ __html: s }} />
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}

        <section className="rounded-3xl bg-gradient-to-r from-brand-600 to-violet-600 text-white p-6 rise-in rise-in-4">
          <h2 className="text-2xl font-black">막히면 이렇게 하세요</h2>
          <ul className="mt-3 space-y-2 text-lg">
            <li>• 화면이 이상하면 브라우저를 완전히 닫고 다시 열어 보세요.</li>
            <li>• 인터넷이 끊겨도 작성 중인 순보고서 내용은 이 기기에 잠시 저장돼요. 다시 열면 이어서 쓸 수 있어요.</li>
            <li>• 로그인이 안 되면 이름(아이디)과 숫자 비밀번호를 다시 확인하고, 그래도 안 되면 담임목사님께 초기화를 부탁하세요.</li>
          </ul>
          <Link href={backHref} className="mt-5 inline-flex h-14 items-center justify-center rounded-2xl bg-white px-6 text-lg font-black text-ink shadow">
            {session?.profile.status === "active" ? "홈으로 돌아가기" : "로그인 화면으로"}
          </Link>
        </section>
      </main>
    </div>
  );
}
