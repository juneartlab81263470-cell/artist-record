-- 작가 활동기록: 회원 관리(관리자 화면) 설정
-- Supabase SQL Editor에 통째로 붙여 넣고 Run 하세요. (schema.sql을 먼저 실행한 뒤, 한 번만)
-- ⚠️ 맨 아래 관리자 이메일이 작가님이 앱에 가입한 이메일과 같은지 확인하세요.

-- 1) 회원 정보 (등급, 무료 기간, 메모)
create table if not exists public.members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan text not null default 'free' check (plan in ('free','friend','basic','pro')),
  plan_until date,
  memo text not null default '',
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

-- 2) 관리자 명단
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.members enable row level security;
alter table public.admins enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.admins where user_id = auth.uid());
$$;

drop policy if exists "member read" on public.members;
create policy "member read" on public.members for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "admin update" on public.members;
create policy "admin update" on public.members for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin read admins" on public.admins;
create policy "admin read admins" on public.admins for select to authenticated
  using (user_id = auth.uid());

-- 3) 등급별 작품 수 한도
create or replace function public.plan_limit(uid uuid) returns integer
language sql stable security definer set search_path = public as $$
  select case
    when exists(select 1 from public.admins a where a.user_id = uid) then 100000
    when m.plan = 'pro' then 100
    when m.plan = 'friend' and (m.plan_until is null or m.plan_until >= current_date) then 100
    when m.plan = 'basic' then 20
    else 10 end
  from (select 1) x left join public.members m on m.user_id = uid;
$$;

-- 4) 로그인할 때마다 회원 정보 남기기 (등급은 바꿀 수 없음)
create or replace function public.touch_member() returns void
language sql volatile security definer set search_path = public as $$
  insert into public.members(user_id, email, last_seen)
  values (auth.uid(), (select email from auth.users where id = auth.uid()), now())
  on conflict (user_id) do update set last_seen = now(), email = excluded.email;
$$;

-- 5) 내 등급 보기
create or replace function public.my_plan() returns table(plan text, plan_until date, work_limit integer, work_count integer, admin boolean)
language sql stable security definer set search_path = public as $$
  select coalesce(m.plan,'free'), m.plan_until, public.plan_limit(auth.uid()),
    (select count(*)::int from public.records r where r.user_id = auth.uid() and r.type = 'work'),
    public.is_admin()
  from (select 1) x left join public.members m on m.user_id = auth.uid();
$$;

-- 6) 관리자용 회원 목록
create or replace function public.admin_members() returns table(
  user_id uuid, email text, name text, created_at timestamptz, last_seen timestamptz,
  plan text, plan_until date, memo text, work_count integer, record_count integer)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not admin'; end if;
  return query
    select m.user_id, m.email, coalesce(s.name,''), m.created_at, m.last_seen, m.plan, m.plan_until, m.memo,
      (select count(*)::int from public.records r where r.user_id = m.user_id and r.type = 'work'),
      (select count(*)::int from public.records r where r.user_id = m.user_id)
    from public.members m left join public.settings s on s.user_id = m.user_id
    order by m.created_at desc;
end $$;

-- 7) 한도를 넘는 작품 추가 막기
create or replace function public.check_work_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.type = 'work' and (tg_op = 'INSERT' or old.type <> 'work') then
    if (select count(*) from public.records where user_id = new.user_id and type = 'work') >= public.plan_limit(new.user_id) then
      raise exception 'WORK_LIMIT';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists records_work_limit on public.records;
create trigger records_work_limit before insert or update of type on public.records
  for each row execute function public.check_work_limit();

-- 8) 이미 가입한 사람들도 회원 목록에 넣기
insert into public.members(user_id, email, created_at)
select id, email, created_at from auth.users
on conflict (user_id) do nothing;

-- 9) 관리자 지정: 작가님이 앱에 가입한 이메일로 바꿔서 실행하세요
insert into public.admins(user_id)
select id from auth.users where email = 'juneartlab81263470@gmail.com'
on conflict do nothing;

-- 확인: 아래 결과에 작가님 이메일이 한 줄 나오면 성공
select u.email as "관리자" from public.admins a join auth.users u on u.id = a.user_id;
