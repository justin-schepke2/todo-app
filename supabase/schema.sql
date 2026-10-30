-- Run this once in Supabase: SQL Editor → New query → paste → Run.
-- It creates the "tasks" table and the security rules (Row Level Security)
-- that let each logged-in user see and change ONLY their own tasks.

create table public.tasks (
  id bigint generated always as identity primary key,
  -- Filled in automatically with the logged-in user's id.
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 500),
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Turn on Row Level Security: with no matching rule, nobody can read or write.
alter table public.tasks enable row level security;

create policy "Users can view their own tasks"
  on public.tasks for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own tasks"
  on public.tasks for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own tasks"
  on public.tasks for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own tasks"
  on public.tasks for delete
  to authenticated
  using ((select auth.uid()) = user_id);
