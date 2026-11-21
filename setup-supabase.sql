
create table if not exists public.life_planners (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.life_planners enable row level security;

-- Remove existing policies before recreating them
drop policy if exists "Users can read their own planner"
on public.life_planners;

drop policy if exists "Users can insert their own planner"
on public.life_planners;

drop policy if exists "Users can update their own planner"
on public.life_planners;

-- Allow users to read only their own planner
create policy "Users can read their own planner"
on public.life_planners
for select
to authenticated
using ((select auth.uid()) = user_id);

-- Allow users to insert only their own planner
create policy "Users can insert their own planner"
on public.life_planners
for insert
to authenticated
with check ((select auth.uid()) = user_id);

-- Allow users to update only their own planner
create policy "Users can update their own planner"
on public.life_planners
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
