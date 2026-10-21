-- Milestone 1: the app's real tables (docs/TECH.md §4, updated by docs/DOCS_CHECK.md "For Milestone 1").
-- Run it ONCE: Supabase dashboard → SQL Editor → New query → paste this whole file → Run.
-- Then run supabase/tests/rls_check.sql: every row should say PASS.
--
-- It all runs in one transaction, so it either fully works or changes nothing.

begin;

-- The Milestone 0 test table isn't needed any more.
drop table if exists public.hello;

-- ─── Tables ────────────────────────────────────────────────────────────────────────────────
-- Status, reason and similar lists are text with a check, not Postgres enums: values can't be
-- removed from an enum, and the rules may change during the tester test (DOCS_CHECK.md).

create table public.profiles (
  user_id          uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  tester_code      text not null check (tester_code ~ '^(FT(0[1-9]|[1-9][0-9])|TEAM[1-4])$'),
  variant          text not null default 'full' check (variant in ('full', 'reminders_only')),
  timezone         text not null,                      -- IANA, e.g. America/St_Johns
  weekly_goal      int  not null default 4 check (weekly_goal between 2 and 7),
  -- "Make this week's goal lighter": applies only in the week starting on light_goal_week (a Monday).
  light_goal       int  check (light_goal between 2 and 7),
  light_goal_week  date check (extract(isodow from light_goal_week) = 1),
  hard_things      text[] not null default '{}'
                   check (hard_things <@ array['starting', 'time', 'forgetting', 'distraction']::text[]),
  plan_time        time not null default '20:30',      -- local time
  quiet_start      time not null default '23:00',
  quiet_end        time not null default '08:00',
  start_nudges     boolean not null default true,
  extra_reminders  boolean not null default false,
  plan_hint        jsonb,                               -- {"cap":2,"for_date":"2026-11-04"} or {"double":true,...}
  paused_until     date,
  consent_version  text not null,
  consented_at     timestamptz not null,
  age_confirmed    boolean not null check (age_confirmed),
  created_at       timestamptz not null default now()
);

create table public.tasks (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  plan_date        date not null,                       -- the student's local date
  title            text not null check (char_length(title) between 1 and 80),
  start_at         timestamptz not null,
  duration_min     int  not null check (duration_min in (5, 10, 25, 50, 90)),
  status           text not null default 'planned'
                   check (status in ('planned', 'started', 'done', 'partly', 'not_yet', 'unanswered')),
  reason           text check (reason in ('too_big', 'forgot', 'distracted', 'tired', 'out_of_time', 'other')),
  reason_note      text check (char_length(reason_note) <= 200),
  if_then          text check (char_length(if_then) <= 160),
  cue              text check (char_length(cue) <= 60),
  tip              text check (tip in ('phone_away', 'focus_or_move')),
  snoozed          boolean not null default false,      -- "In 10 min" used
  from_fix_event   uuid,                                -- set when a fix created this task
  started_at       timestamptz,
  checked_in_at    timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.fix_events (                        -- one row per fix card shown
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  task_id          uuid not null references public.tasks (id) on delete cascade,  -- the missed task
  reason           text not null
                   check (reason in ('too_big', 'forgot', 'distracted', 'tired', 'out_of_time', 'other')),
  fix_id           text not null,                       -- too_big_1 … out_of_time_2 | if_then
  choice           text check (choice in ('used', 'other', 'dismissed', 'own_plan')),
  outcome          text check (outcome in ('worked', 'not_worked')),
  outcome_task_id  uuid references public.tasks (id) on delete set null,
  created_at       timestamptz not null default now()
);

create table public.events (                            -- our own minimal analytics (TECH.md §8)
  id               uuid primary key default gen_random_uuid(),  -- uuid: no sequence to grant
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name             text not null,
  props            jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
);

-- Keep tasks.updated_at current. search_path is fixed, as Supabase's security advisor asks.
create function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ─── Indexes on the columns the policies and the app filter on ─────────────────────────────
-- (profiles.user_id is the primary key, so it's indexed already.)
create index tasks_user_plan_date_idx      on public.tasks (user_id, plan_date);
create index tasks_user_checked_in_idx     on public.tasks (user_id, checked_in_at);
create index fix_events_user_created_idx   on public.fix_events (user_id, created_at);
create index fix_events_task_idx           on public.fix_events (task_id);
create index events_user_created_idx       on public.events (user_id, created_at);

-- ─── Row Level Security: each user sees and changes only their own rows ────────────────────
-- One policy per action (current Supabase advice), each for signed-in users only.
-- (select auth.uid()) is worked out once per query instead of once per row.
alter table public.profiles   enable row level security;
alter table public.tasks      enable row level security;
alter table public.fix_events enable row level security;
alter table public.events     enable row level security;

create policy "own profile: read"   on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "own profile: add"    on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own profile: change" on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own profile: delete" on public.profiles for delete to authenticated using ((select auth.uid()) = user_id);

create policy "own tasks: read"   on public.tasks for select to authenticated using ((select auth.uid()) = user_id);
create policy "own tasks: add"    on public.tasks for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own tasks: change" on public.tasks for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own tasks: delete" on public.tasks for delete to authenticated using ((select auth.uid()) = user_id);

create policy "own fix events: read"   on public.fix_events for select to authenticated using ((select auth.uid()) = user_id);
create policy "own fix events: add"    on public.fix_events for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own fix events: change" on public.fix_events for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own fix events: delete" on public.fix_events for delete to authenticated using ((select auth.uid()) = user_id);

-- Events are never changed after they're written.
create policy "own events: read"   on public.events for select to authenticated using ((select auth.uid()) = user_id);
create policy "own events: add"    on public.events for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own events: delete" on public.events for delete to authenticated using ((select auth.uid()) = user_id);

-- ─── Table access (grants) ─────────────────────────────────────────────────────────────────
-- This project was created with "Automatically expose new tables" off, so nothing is reachable
-- until it's granted. Take everything away first (in case defaults gave some), then allow only
-- what the app needs. Signed-out visitors (anon) get nothing. Delete is needed for "Delete my data".
revoke all on table public.profiles, public.tasks, public.fix_events, public.events from anon, authenticated;

-- Profiles: column lists limit what the app can write. On sign-up it may only send these five
-- columns (user_id comes from its default, auth.uid()), and afterwards it may only change settings.
-- So tester_code, variant and the consent record can't be changed from the app; the team sets variant.
grant select, delete on table public.profiles to authenticated;
grant insert (tester_code, timezone, consent_version, consented_at, age_confirmed)
  on table public.profiles to authenticated;
grant update (timezone, weekly_goal, light_goal, light_goal_week, hard_things, plan_time,
              quiet_start, quiet_end, start_nudges, extra_reminders, plan_hint, paused_until)
  on table public.profiles to authenticated;

grant select, insert, update, delete on table public.tasks      to authenticated;
grant select, insert, update, delete on table public.fix_events to authenticated;
grant select, insert, delete         on table public.events     to authenticated;

commit;

-- Tell the Data API about the new tables straight away.
notify pgrst, 'reload schema';
