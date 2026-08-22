create table if not exists public.planner_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.planner_data enable row level security;

create policy "Users can read their own planner"
  on public.planner_data for select
  using (auth.uid() = user_id);

create policy "Users can insert their own planner"
  on public.planner_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own planner"
  on public.planner_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
