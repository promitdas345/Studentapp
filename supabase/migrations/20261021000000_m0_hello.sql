-- Milestone 0: a one-row test table, so the app can prove it reaches Supabase.
-- A Milestone 1 migration drops it again.
--
-- How to apply: Supabase dashboard → SQL Editor → New query → paste this whole file → Run.

create table public.hello (
  id bigint generated always as identity primary key,
  message text not null
);

-- Row Level Security on, like every table (CLAUDE.md rule 5).
alter table public.hello enable row level security;

-- Anyone using the app can read this row, signed in or not. There are no insert, update
-- or delete policies, so nobody can change it from the app.
create policy "Anyone can read hello"
  on public.hello for select
  to anon, authenticated
  using (true);

-- Supabase is making table access opt-in, so grant read access explicitly
-- (Expo's "Using Supabase" guide, checked Oct 21, 2026).
grant select on public.hello to anon, authenticated;

insert into public.hello (message) values ('Hello from Supabase');
