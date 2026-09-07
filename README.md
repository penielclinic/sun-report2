# 순보고 v2 — 해운대순복음교회 순·선교회 보고 앱

순장 → 선교회장 → 담임목사로 이어지는 주간 보고를 온라인으로 처리하는 앱입니다.
연세 드신 분들이 PC·스마트폰에서 함께 쓰는 것을 전제로 **큰 글씨·큰 버튼·색으로 구분되는 화면**으로 만들었습니다.

- 스택: Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Supabase (Auth + Postgres) · Vercel
- 언어: 한국어 UI 100%

---

## 1. 새 Supabase 프로젝트 준비 (한 번만)

1. https://supabase.com/dashboard 에서 **New project** 생성 (Region: Northeast Asia (Seoul) 권장).
2. 왼쪽 메뉴 **SQL Editor** → `supabase/migrations/0001_init.sql` 내용을 붙여넣고 **Run**.
   - 테이블·RLS·Realtime·결석자 조회 함수까지 한 번에 만들어집니다.
3. **Authentication → Providers → Email** 에서
   - `Confirm email` **끄기** (이름+숫자 비밀번호 방식이라 이메일 인증을 쓰지 않습니다)
   - `Minimum password length` 는 기본값(6) 그대로 두어도 됩니다. 앱이 PIN을 서버에서 긴 비밀번호로 바꿔 저장합니다.
4. **Project Settings → API** 에서 아래 값을 복사합니다.
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (절대 공개 금지)

## 2. 로컬 실행

```bash
cp .env.example .env.local   # 값 채우기
npm install
npm run dev                  # http://localhost:3000
```

`.env.local` 필수 항목

| 변수 | 설명 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 새 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key (서버 전용) |
| `AUTH_PIN_SECRET` | 숫자 PIN을 비밀번호로 바꿀 때 섞는 긴 무작위 문자열. **한 번 정하면 바꾸지 마세요** (바꾸면 모든 사용자가 로그인 불가) |
| `CRON_SECRET` | Vercel Cron 인증용 무작위 문자열 |
| `ANTHROPIC_API_KEY` | (선택) AI 목회 브리핑 기능 |

> 현재 로컬 `.env.local` 에는 새 프로젝트 **sun-report2**(opifoazcoviouklshlty) 의 URL·키와 자동 생성한 `AUTH_PIN_SECRET`/`CRON_SECRET` 이 이미 들어 있습니다.
> Vercel 배포 시 **같은 값**을 그대로 등록하세요 (특히 `AUTH_PIN_SECRET` 이 다르면 로컬에서 만든 계정으로 로그인할 수 없습니다).

## 3. 첫 계정 만들기

1. `/register` 에서 **담임목사** 역할로 가입하면, 활성 담임목사 계정이 아직 없을 때 **자동 승인**됩니다. (초기 설정용 — 이후 담임목사 가입은 승인 필요)
2. 담임목사로 로그인 → **관리 메뉴 → 사용자 관리**에서
   - 순장·선교회장이 직접 가입한 신청을 **승인**하거나
   - **계정 직접 만들기**로 이름·비밀번호를 정해 바로 나눠 줄 수 있습니다.

## 4. Vercel 배포

1. GitHub 저장소에 push → Vercel 에서 Import.
2. Environment Variables 에 위 `.env.local` 값을 모두 등록.
3. `vercel.json` 의 Cron(매주 일요일 14:00 KST 미제출 리마인더)이 자동 등록됩니다. `CRON_SECRET` 이 있어야 동작합니다.

## 5. 구조

```
app/(auth)/login, register, pending     로그인·가입·승인대기
app/(app)/dashboard/{sun-leader,mission-leader,pastor}
app/(app)/report/sun/*                  순보고서 작성·보기·이력
app/(app)/report/mission/*              선교회보고서
app/(app)/admin/*                       담임목사 관리 (현황·통계·출력·특별보고·목양알림·메시지·점수·명단·사용자·브리핑)
app/(app)/notifications, settings       알림함 · 내 설정(PIN 변경, 글자 크기)
app/api/*                               모든 쓰기 작업 (서버에서 권한 검사 후 service role 로 저장)
lib/constants/sun-directory.ts          45순 편성표 (순장·순원 명단)
supabase/migrations/0001_init.sql       DB 스키마 + RLS
```

## 6. 안전 설계 요약

- 브라우저(anon key)는 **읽기만** 가능. 모든 쓰기는 `/api/*` 에서 로그인·역할·소속을 검사한 뒤 service role 로 처리.
- 순 번호·선교회는 클라이언트 값이 아니라 **프로필에서 강제**.
- 같은 순·같은 주일 보고서는 DB `unique` 제약으로 중복 불가.
- 선교회보고서 제출 후에는 그 주 순보고서 수정·삭제 잠금.
- 숫자 PIN은 `AUTH_PIN_SECRET` 로 HMAC 처리해 Supabase 에 저장, 로그인 시도 횟수 제한.
- 날짜 계산은 모두 한국 시간(KST) 기준으로 서버/브라우저 어디서나 동일.
- 작성 중인 순보고서는 브라우저에 자동 임시저장(네트워크 끊김 대비).

## 7. 편성표 수정

순장 교체·순원 변경은 `lib/constants/sun-directory.ts` 를 고치고 다시 배포하면 됩니다.
(새 보고서의 기본 명단은 "그 순의 가장 최근 보고서 명단"을 우선 사용하므로, 순장이 앱에서 추가/삭제한 순원은 자동으로 유지됩니다.)
