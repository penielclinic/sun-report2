-- ============================================================
-- 순보고 v2 — 해운대순복음교회 순·선교회 보고 앱
-- 새 Supabase 프로젝트용 통합 스키마 (한 번에 실행)
-- Supabase Dashboard > SQL Editor 에 붙여넣고 Run
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. 프로필 (사용자)
-- ------------------------------------------------------------
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  login_id    text not null unique,                       -- 로그인 아이디 (이름)
  name        text not null,
  role        text not null check (role in ('sun_leader','mission_leader','pastor')),
  sun_number  int  check (sun_number between 1 and 45),
  mission_id  int  check (mission_id between 1 and 13),
  status      text not null default 'pending' check (status in ('pending','active','rejected')),
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_profiles_role on profiles(role, status);

-- ------------------------------------------------------------
-- 2. 순 편성표 (정적)
-- ------------------------------------------------------------
create table if not exists sun_directory (
  sun_number  int primary key,
  sun_leader  text not null,
  mission_id  int  not null
);
insert into sun_directory (sun_number, sun_leader, mission_id) values
(1,'이봉자',1),(2,'정춘옥',1),(3,'김인숙',1),(4,'이복희',1),
(5,'황양희',2),(6,'엄옥자',2),(7,'김정미',2),
(8,'김동선',3),(9,'김장순',3),(10,'박정자',3),
(11,'권덕숙',4),(12,'정호이',4),(13,'김은혜',4),(14,'김경미F',4),
(15,'김영화',5),(16,'박현순',5),(17,'김임선',5),(18,'안다인',5),
(19,'정정수',6),(20,'정가경',6),(21,'송경옥',6),(22,'정태화',6),
(23,'오미미',7),(24,'소미아',7),(25,'김옥내',7),
(26,'정행순',8),(27,'조영희',8),(28,'박미자',8),(29,'김용덕',8),
(30,'윤지은',9),(31,'배연정',9),(32,'임춘애',9),
(33,'이윤경B',10),(34,'김혜영C',10),(35,'박숙현',10),(36,'박민옥',10),(37,'박향규',10),
(38,'강경숙',11),(39,'변숙자',11),(40,'이윤정',11),(41,'신상현',11),
(42,'나순주',12),(43,'박소영B',12),(44,'한미영',12),
(45,'김의현·홍혜진',13)
on conflict (sun_number) do nothing;

-- ------------------------------------------------------------
-- 3. 순보고서
-- ------------------------------------------------------------
create table if not exists sun_reports (
  id              uuid primary key default gen_random_uuid(),
  sun_number      int  not null,
  sun_leader      text not null,
  mission_id      int  not null,
  report_date     date not null,
  worship_at      text,
  worship_place   text,
  worship_leader  text,
  attend_total    int  not null default 0,
  bible_chapters  int  not null default 0,
  offering        int  not null default 0,
  special_note    text,
  status          text not null default 'draft' check (status in ('draft','submitted')),
  submitted_at    timestamptz,
  created_by      uuid not null references auth.users(id) on delete cascade,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (sun_number, report_date)                          -- 같은 순·같은 주 중복 방지
);
create index if not exists idx_sun_reports_date on sun_reports(report_date desc);
create index if not exists idx_sun_reports_mission on sun_reports(mission_id, report_date desc);
create index if not exists idx_sun_reports_owner on sun_reports(created_by, report_date desc);

create table if not exists sun_report_members (
  id              uuid primary key default gen_random_uuid(),
  report_id       uuid not null references sun_reports(id) on delete cascade,
  sort_order      int  not null default 0,
  member_name     text not null,
  attend_samil    boolean not null default false,
  attend_friday   boolean not null default false,
  attend_sun_day  boolean not null default false,
  attend_sun_eve  boolean not null default false,
  attend_sun      boolean not null default false,
  evangelism      boolean not null default false,
  bulletin_recv   boolean not null default false,
  bible_read      int not null default 0,
  member_note     text
);
create index if not exists idx_srm_report on sun_report_members(report_id);

-- ------------------------------------------------------------
-- 4. 선교회보고서
-- ------------------------------------------------------------
create table if not exists mission_reports (
  id              uuid primary key default gen_random_uuid(),
  mission_id      int  not null,
  report_date     date not null,
  mission_leader  text,
  total_sun       int  not null default 0,
  total_attend    int  not null default 0,
  total_bible     int  not null default 0,
  total_offering  int  not null default 0,
  special_note    text,
  status          text not null default 'draft' check (status in ('draft','submitted')),
  submitted_at    timestamptz,
  created_by      uuid not null references auth.users(id) on delete cascade,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (mission_id, report_date)
);
create index if not exists idx_mission_reports_date on mission_reports(report_date desc);

-- 특별보고 항목 (선교회장이 등록, 담임목사가 진행상황 관리)
create table if not exists special_report_items (
  id                uuid primary key default gen_random_uuid(),
  mission_report_id uuid references mission_reports(id) on delete cascade,
  mission_id        int  not null,
  report_date       date not null,
  mission_leader    text,
  category          text not null check (category in ('질병','재정문제','인간관계','진로및직장문제','기타')),
  content           text not null,
  status            text not null default '기도중' check (status in ('기도중','진행중','해결됨')),
  pastor_memo       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_special_items_report on special_report_items(mission_report_id);
create index if not exists idx_special_items_status on special_report_items(status, report_date desc);

-- ------------------------------------------------------------
-- 5. 답글
-- ------------------------------------------------------------
create table if not exists sun_report_comments (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid not null references sun_reports(id) on delete cascade,
  author_id   uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  author_role text not null,
  content     text not null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_src_report on sun_report_comments(report_id, created_at);

create table if not exists mission_report_comments (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid not null references mission_reports(id) on delete cascade,
  author_id   uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  author_role text not null,
  content     text not null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_mrc_report on mission_report_comments(report_id, created_at);
create index if not exists idx_src_author on sun_report_comments(author_id);
create index if not exists idx_mrc_author on mission_report_comments(author_id);
create index if not exists idx_mission_reports_owner on mission_reports(created_by);

-- ------------------------------------------------------------
-- 6. 알림 (앱 내)
-- ------------------------------------------------------------
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null default 'info',   -- info | report | comment | message | reminder
  title      text not null,
  body       text not null,
  link       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user on notifications(user_id, read, created_at desc);

-- ------------------------------------------------------------
-- 7. 목양 알림 (긴급 키워드·특별보고)
-- ------------------------------------------------------------
create table if not exists pastoral_alerts (
  id            uuid primary key default gen_random_uuid(),
  alert_type    text not null check (alert_type in ('keyword','special_item','absence')),
  sun_number    int,
  sun_leader    text,
  mission_id    int,
  mission_leader text,
  member_name   text,
  triggered_by  text,
  source_text   text,
  source_report_id uuid,
  is_read       boolean not null default false,
  read_at       timestamptz,
  dedup_key     text unique,
  created_at    timestamptz not null default now()
);
create index if not exists idx_alerts_unread on pastoral_alerts(is_read, created_at desc);

-- ------------------------------------------------------------
-- 8. AI 목회 브리핑 (선택 기능)
-- ------------------------------------------------------------
create table if not exists pastoral_briefings (
  id               uuid primary key default gen_random_uuid(),
  week_of          date not null unique,
  raw_stats        jsonb not null default '{}'::jsonb,
  briefing_text    text,
  care_members     jsonb not null default '[]'::jsonb,
  joy_news         jsonb not null default '[]'::jsonb,
  generated_at     timestamptz,
  read_at          timestamptz,
  created_at       timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 9. updated_at 자동 갱신
-- ------------------------------------------------------------
create or replace function set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_profiles_updated on profiles;
create trigger trg_profiles_updated before update on profiles for each row execute function set_updated_at();
drop trigger if exists trg_sun_reports_updated on sun_reports;
create trigger trg_sun_reports_updated before update on sun_reports for each row execute function set_updated_at();
drop trigger if exists trg_mission_reports_updated on mission_reports;
create trigger trg_mission_reports_updated before update on mission_reports for each row execute function set_updated_at();
drop trigger if exists trg_special_items_updated on special_report_items;
create trigger trg_special_items_updated before update on special_report_items for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- 10. RLS 헬퍼 (security definer → 정책 재귀 방지)
-- ------------------------------------------------------------
create or replace function app_role() returns text
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid() and status = 'active'
$$;
create or replace function app_mission_id() returns int
language sql stable security definer set search_path = public as $$
  select mission_id from profiles where id = auth.uid() and status = 'active'
$$;
create or replace function app_sun_number() returns int
language sql stable security definer set search_path = public as $$
  select sun_number from profiles where id = auth.uid() and status = 'active'
$$;
revoke all on function app_role() from public;
revoke all on function app_mission_id() from public;
revoke all on function app_sun_number() from public;
grant execute on function app_role(), app_mission_id(), app_sun_number() to authenticated;
revoke execute on function app_role(), app_mission_id(), app_sun_number() from anon;

-- ------------------------------------------------------------
-- 11. RLS — 클라이언트(anon key)는 읽기만, 쓰기는 모두 서버 API(service role)
-- ------------------------------------------------------------
alter table profiles              enable row level security;
alter table sun_directory         enable row level security;
alter table sun_reports           enable row level security;
alter table sun_report_members    enable row level security;
alter table mission_reports       enable row level security;
alter table special_report_items  enable row level security;
alter table sun_report_comments   enable row level security;
alter table mission_report_comments enable row level security;
alter table notifications         enable row level security;
alter table pastoral_alerts       enable row level security;
alter table pastoral_briefings    enable row level security;

-- 프로필: 본인 + 활성 사용자는 이름 조회 가능
drop policy if exists "profiles_select" on profiles;
create policy "profiles_select" on profiles for select to authenticated
  using (id = (select auth.uid()) or app_role() is not null);

drop policy if exists "sun_directory_select" on sun_directory;
create policy "sun_directory_select" on sun_directory for select to authenticated using (true);

-- 순보고서: 작성자 본인 / 소속 선교회장 / 담임목사
drop policy if exists "sun_reports_select" on sun_reports;
create policy "sun_reports_select" on sun_reports for select to authenticated
  using (
    created_by = (select auth.uid())
    or app_role() = 'pastor'
    or (app_role() = 'mission_leader' and mission_id = app_mission_id())
    or (app_role() = 'sun_leader' and sun_number = app_sun_number())
  );

drop policy if exists "srm_select" on sun_report_members;
create policy "srm_select" on sun_report_members for select to authenticated
  using (exists (select 1 from sun_reports r where r.id = report_id));

-- 선교회보고서: 작성자 / 같은 선교회장 / 담임목사 / 소속 순장(제출 여부 확인용 읽기)
drop policy if exists "mission_reports_select" on mission_reports;
create policy "mission_reports_select" on mission_reports for select to authenticated
  using (
    created_by = (select auth.uid())
    or app_role() = 'pastor'
    or (app_role() in ('mission_leader','sun_leader') and mission_id = app_mission_id())
  );

drop policy if exists "special_items_select" on special_report_items;
create policy "special_items_select" on special_report_items for select to authenticated
  using (app_role() = 'pastor' or (app_role() = 'mission_leader' and mission_id = app_mission_id()));

drop policy if exists "src_select" on sun_report_comments;
create policy "src_select" on sun_report_comments for select to authenticated
  using (exists (select 1 from sun_reports r where r.id = report_id));

drop policy if exists "mrc_select" on mission_report_comments;
create policy "mrc_select" on mission_report_comments for select to authenticated
  using (exists (select 1 from mission_reports r where r.id = report_id));

drop policy if exists "notifications_select" on notifications;
create policy "notifications_select" on notifications for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "alerts_select" on pastoral_alerts;
create policy "alerts_select" on pastoral_alerts for select to authenticated
  using (app_role() = 'pastor');

drop policy if exists "briefings_select" on pastoral_briefings;
create policy "briefings_select" on pastoral_briefings for select to authenticated
  using (app_role() = 'pastor');

-- ------------------------------------------------------------
-- 12. Realtime (알림 종 배지)
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table notifications;
  end if;
end $$;

-- ------------------------------------------------------------
-- 13. 장기 결석자 조회 함수 (담임목사 목양알림 화면)
-- ------------------------------------------------------------
create or replace function get_absentees(min_weeks int, reference_date date)
returns table (
  member_name text,
  sun_number int,
  sun_leader text,
  mission_id int,
  weeks_reported bigint,
  weeks_absent bigint,
  last_attended date
)
language sql stable security definer set search_path = public as $$
  with recent as (
    select m.member_name, r.sun_number, r.sun_leader, r.mission_id, r.report_date,
           (m.attend_sun_day or m.attend_sun_eve or m.attend_sun) as attended
    from sun_report_members m
    join sun_reports r on r.id = m.report_id
    where r.status = 'submitted'
      and r.report_date <= reference_date
      and r.report_date > reference_date - (min_weeks * 7)
  ),
  agg as (
    select member_name, sun_number, sun_leader, mission_id,
           count(*) as weeks_reported,
           count(*) filter (where not attended) as weeks_absent,
           max(report_date) filter (where attended) as last_attended
    from recent
    group by member_name, sun_number, sun_leader, mission_id
  )
  select * from agg
  where weeks_reported >= min_weeks and weeks_absent >= min_weeks
  order by weeks_absent desc, sun_number, member_name
$$;
revoke all on function get_absentees(int, date) from public;
grant execute on function get_absentees(int, date) to authenticated, service_role;
revoke execute on function get_absentees(int, date) from anon;
