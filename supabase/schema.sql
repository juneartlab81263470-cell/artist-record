-- 작가 활동기록: Supabase SQL Editor에 통째로 붙여 넣고 Run 하세요. (한 번만)

-- 1) 기록
create table if not exists public.records (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type text not null check (type in ('work','exhibition','award','catalog','class')),
  f jsonb not null default '{}'::jsonb,
  genres text[] not null default '{}',
  photos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists records_user_idx on public.records(user_id);

-- 2) 설정 (작가 이름, 장르 목록)
create table if not exists public.settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  name text not null default '',
  genres text[] not null default '{}',
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.settings add column if not exists profile jsonb not null default '{}'::jsonb;

-- 3) 본인 기록만 보고 고칠 수 있게
alter table public.records enable row level security;
alter table public.settings enable row level security;

drop policy if exists "own records" on public.records;
create policy "own records" on public.records
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own settings" on public.settings;
create policy "own settings" on public.settings
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 4) 사진 저장소 (비공개). 경로는 <사용자id>/<기록id>/<파일>.jpg
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

drop policy if exists "own photos read" on storage.objects;
create policy "own photos read" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "own photos write" on storage.objects;
create policy "own photos write" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "own photos delete" on storage.objects;
create policy "own photos delete" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
