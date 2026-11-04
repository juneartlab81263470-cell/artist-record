-- 작가 활동기록: VIP 등급, 초대 코드, 공지
-- admin.sql을 실행한 뒤, SQL Editor에 통째로 붙여 넣고 Run 하세요. (한 번만)

-- 1) VIP 등급 추가 (작품 수 제한 없음, 기한 없음)
alter table public.members drop constraint if exists members_plan_check;
alter table public.members add constraint members_plan_check check (plan in ('free','friend','basic','pro','vip'));

create or replace function public.plan_limit(uid uuid) returns integer
language sql stable security definer set search_path = public as $$
  select case
    when exists(select 1 from public.admins a where a.user_id = uid) then 100000
    when m.plan_until is not null and m.plan_until < current_date then 10
    when m.plan = 'vip' then 100000
    when m.plan = 'pro' then 100
    when m.plan = 'friend' then 100
    when m.plan = 'basic' then 20
    else 10 end
  from (select 1) x left join public.members m on m.user_id = uid;
$$;

-- 2) 초대 코드
create table if not exists public.invite_codes (
  code text primary key,
  plan text not null check (plan in ('friend','basic','pro','vip')),
  months integer,              -- 비우면 기한 없음
  max_uses integer not null default 1,
  used integer not null default 0,
  expires_at date,             -- 코드 자체의 사용 마감일 (비우면 없음)
  memo text not null default '',
  used_by text,                -- 쓴 사람 이메일
  used_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.invite_codes add column if not exists used_by text;
alter table public.invite_codes add column if not exists used_at timestamptz;
alter table public.invite_codes enable row level security;
drop policy if exists "admin codes" on public.invite_codes;
create policy "admin codes" on public.invite_codes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 3) 코드 사용하기 (회원이 직접 입력)
create or replace function public.redeem_code(c text) returns text
language plpgsql volatile security definer set search_path = public as $$
declare ic public.invite_codes;
begin
  select * into ic from public.invite_codes where upper(code) = upper(trim(c)) for update;
  if not found then return 'NOT_FOUND'; end if;
  if ic.expires_at is not null and ic.expires_at < current_date then return 'EXPIRED'; end if;
  if ic.used >= ic.max_uses then return 'USED_UP'; end if;
  perform public.touch_member();
  update public.members set
    plan = ic.plan,
    plan_until = case when ic.months is null then null else (current_date + make_interval(months => ic.months))::date end,
    memo = trim(both ' ' from memo || ' [코드 ' || ic.code || ']')
  where user_id = auth.uid();
  update public.invite_codes set used = used + 1, used_at = now(),
    used_by = (select email from auth.users where id = auth.uid()) where code = ic.code;
  return 'OK:' || ic.plan;
end $$;

-- 4) 공지 (관리자가 쓰면 회원이 앱을 열 때 위에 한 번 보여요)
create table if not exists public.notices (
  id bigint generated always as identity primary key,
  title text not null,
  body text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.notices enable row level security;
drop policy if exists "members read notices" on public.notices;
create policy "members read notices" on public.notices for select to authenticated using (active or public.is_admin());
drop policy if exists "admin write notices" on public.notices;
create policy "admin write notices" on public.notices for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
