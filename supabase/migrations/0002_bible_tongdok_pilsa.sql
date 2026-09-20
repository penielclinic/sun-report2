-- 성경통독 · 성경필사 완료 보고
-- 순보고서에서 순장이 체크하면 → 선교회보고서에 자동으로 모이고 → 담임목사 화면과
-- 공개 통계(/stats)에 "이름 (선교회)" 형식으로 보고된다.
-- 다 마친 그 주에 한 번만 체크하는 값이라 매주 이어지지 않는다.

alter table sun_report_members
  add column if not exists bible_tongdok boolean not null default false,
  add column if not exists bible_pilsa boolean not null default false;

comment on column sun_report_members.bible_tongdok is '성경통독 완료 (다 마친 주에 한 번 체크)';
comment on column sun_report_members.bible_pilsa is '성경필사 완료 (다 마친 주에 한 번 체크)';

-- 완료자만 추려 읽는 조회(부분 인덱스)
create index if not exists sun_report_members_bible_done_idx
  on sun_report_members (report_id)
  where bible_tongdok or bible_pilsa;
