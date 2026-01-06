-- Supabase schema for a simple practice (刷题) app.
-- Run in Supabase SQL editor before importing seed data.

create extension if not exists pgcrypto;

create table if not exists public.problems (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  source_no integer not null,
  question_type text not null check (question_type in ('single_choice', 'multiple_choice', 'fill_blank')),
  stem text not null,
  options jsonb,
  answer jsonb not null,
  source text not null default 'problems.txt',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (section, source_no)
);

create index if not exists problems_section_no_idx on public.problems (section, source_no);
create index if not exists problems_type_idx on public.problems (question_type);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists problems_set_updated_at on public.problems;
create trigger problems_set_updated_at
before update on public.problems
for each row execute function public.set_updated_at();

alter table public.problems enable row level security;

drop policy if exists "problems_select_all" on public.problems;
create policy "problems_select_all"
on public.problems
for select
using (true);

create table if not exists public.user_problem_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id uuid not null references public.problems(id) on delete cascade,
  is_favorite boolean not null default false,
  last_answer jsonb,
  last_is_correct boolean,
  last_answered_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, problem_id)
);

drop trigger if exists user_problem_state_set_updated_at on public.user_problem_state;
create trigger user_problem_state_set_updated_at
before update on public.user_problem_state
for each row execute function public.set_updated_at();

alter table public.user_problem_state enable row level security;

drop policy if exists "user_problem_state_select_own" on public.user_problem_state;
create policy "user_problem_state_select_own"
on public.user_problem_state
for select
using (auth.uid() = user_id);

drop policy if exists "user_problem_state_insert_own" on public.user_problem_state;
create policy "user_problem_state_insert_own"
on public.user_problem_state
for insert
with check (auth.uid() = user_id);

drop policy if exists "user_problem_state_update_own" on public.user_problem_state;
create policy "user_problem_state_update_own"
on public.user_problem_state
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id uuid not null references public.problems(id) on delete cascade,
  answer jsonb not null,
  is_correct boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists submissions_user_created_idx on public.submissions (user_id, created_at desc);
create index if not exists submissions_problem_created_idx on public.submissions (problem_id, created_at desc);

alter table public.submissions enable row level security;

drop policy if exists "submissions_select_own" on public.submissions;
create policy "submissions_select_own"
on public.submissions
for select
using (auth.uid() = user_id);

drop policy if exists "submissions_insert_own" on public.submissions;
create policy "submissions_insert_own"
on public.submissions
for insert
with check (auth.uid() = user_id);

