# TECH — how v1 is built

Facts marked *(checked Oct 20, 2026)* were looked up that day. Versions and APIs change, so check the official docs before using any of them.

## §1 Stack, and why

| Piece | Choice | Why |
|---|---|---|
| App | **Expo (React Native) + TypeScript (strict) + Expo Router** | One codebase for iPhone and Android, close to the JavaScript Promit knows, and fixes can ship without store review (EAS Update). Chosen Oct 8 over Flutter and web-first because nudges are the core of the product and native notifications are more reliable than web push. |
| Backend | **Supabase** (Postgres, Auth, Row Level Security) | No server to run. Free plan to start. Data can stay in Canada. |
| Region | **Canada (Central), `ca-central-1`** | Data stays in Canada, which is simpler to explain to testers and later to universities. *(Region checked Oct 20, 2026)* |
| Reminders | **Local notifications** (`expo-notifications`), scheduled on the phone | Every nudge time is known ahead, so there's no push server, no push tokens, less data and it works offline. |
| Builds | **EAS Build**, plus **EAS Update** for JavaScript-only changes | Builds iPhone apps without a Mac. |
| Tests | Jest (the `jest-expo` preset) | For the pure functions in `src/rules/` and `src/lib/`. |

**Not used in v1:** a custom backend server, push notifications, third-party analytics, crash-reporting or ad SDKs, and any AI API.

## §2 Setup: who does what

**Promit (needs his accounts):**
1. Install Node.js (LTS), Git and VS Code. Make free accounts at github.com, expo.dev and supabase.com.
2. In Supabase, create a project in **Canada (Central)** and save the database password in a password manager. Then go to Authentication and turn on **anonymous sign-ins**.
3. Copy the project URL and the **publishable** key (or the older "anon" key) into the `.env` file the agent creates. Never use the **secret** key (or the older `service_role` key) in the app.
4. Install **Expo Go** on his phone for the first steps. Later, install the development build the agent makes (§9).

**Agent:**
1. Create the app with the current default Expo template (check docs.expo.dev for the command). It should come with TypeScript and Expo Router. *(Oct 21: created with `--template default@sdk-57`, because Expo Go on phones still runs SDK 57 during the SDK 58 transition. Move to SDK 58 with the development build in M2. See DECISIONS.md.)*
2. Add `@supabase/supabase-js` by following Supabase's current **Expo React Native quickstart** and Expo's "Using Supabase" guide (session storage with `expo-sqlite/localStorage/install`, which replaced AsyncStorage in the current docs, and the AppState pattern for auto-refreshing tokens).
3. Write the database as SQL files in `supabase/migrations/` (§4). Promit applies them with the Supabase CLI or by pasting them into the SQL editor. Every schema change is a new file in git.
4. Create `.env.example` (committed) and `.env` (git-ignored) with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the names Supabase's and Expo's docs use). Anything starting with `EXPO_PUBLIC_` ends up inside the app and is visible to anyone, so only the publishable key goes there.

## §3 Project structure

```
src/app/                          # Expo Router screens (the SDK 57 template keeps routes in src/app/)
  _layout.tsx                     # sign-in gate, notification-tap handling, resync on foreground
  onboarding/welcome.tsx  collect.tsx  setup.tsx  reminders.tsx
  (tabs)/_layout.tsx  index.tsx (Today)  week.tsx  settings.tsx
  plan.tsx                        # add/edit; params: date, prefill, fromFixEvent
  start/[taskId].tsx  timer/[taskId].tsx  checkin/[taskId].tsx  fix/[taskId].tsx
  support.tsx
src/                              # everything that isn't a screen
  copy/en.ts                      # every user-facing string
  rules/fixes.ts                  # fix ladders as data (RULES.md §3)
  rules/selectFix.ts              # RULES.md §4.1
  rules/outcomes.ts               # RULES.md §4.2
  rules/insights.ts               # week stats, best time of day, scaffolding/bad-week checks
  rules/safety.ts                 # RULES.md §6.1
  lib/schedule.ts                 # pure: what to schedule (§6)
  lib/notifications.ts            # the side effects: permission, channel, schedule/cancel, tap routing
  lib/time.ts                     # time-zone-aware helpers (§7)
  lib/supabase.ts  lib/events.ts
  data/                           # small typed query functions per table
  components/
supabase/migrations/
docs/
```

Tests sit next to the code (`*.test.ts`). Everything in `src/rules/` and `src/lib/schedule.ts`/`time.ts` must be pure (no network, no clock reads: pass `now` in).

## §4 Data model

A sketch. The agent writes the real migration and checks it against the current Supabase and Postgres docs.

```sql
create type task_status as enum ('planned','started','done','partly','not_yet','unanswered');
create type miss_reason as enum ('too_big','forgot','distracted','tired','out_of_time','other');

create table public.profiles (
  user_id          uuid primary key default auth.uid() references auth.users on delete cascade,
  tester_code      text not null check (tester_code ~ '^(FT[0-9]{2}|TEAM[1-4])$'),
  variant          text not null default 'full' check (variant in ('full','reminders_only')),
  timezone         text not null,                     -- IANA, e.g. America/St_Johns
  weekly_goal      int  not null default 4 check (weekly_goal between 2 and 7),
  hard_things      text[] not null default '{}',      -- starting | time | forgetting | distraction
  plan_time        time not null default '20:30',     -- local time
  quiet_start      time not null default '23:00',
  quiet_end        time not null default '08:00',
  start_nudges     boolean not null default true,
  extra_reminders  boolean not null default false,
  plan_hint        jsonb,                             -- {"cap":2,"for_date":"2026-11-04"} or {"double":true,...}
  paused_until     date,
  consent_version  text not null,
  consented_at     timestamptz not null,
  age_confirmed    boolean not null check (age_confirmed),
  created_at       timestamptz not null default now()
);

create table public.tasks (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users on delete cascade,
  plan_date        date not null,                     -- the student's local date
  title            text not null check (char_length(title) between 1 and 80),
  start_at         timestamptz not null,
  duration_min     int  not null check (duration_min in (5,10,25,50,90)),
  status           task_status not null default 'planned',
  reason           miss_reason,
  reason_note      text check (char_length(reason_note) <= 200),
  if_then          text check (char_length(if_then) <= 160),
  cue              text check (char_length(cue) <= 60),
  tip              text check (tip in ('phone_away','focus_or_move')),
  snoozed          boolean not null default false,    -- "In 10 min" used
  from_fix_event   uuid,                              -- set when a fix created this task
  started_at       timestamptz,
  checked_in_at    timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.fix_events (                      -- one row per fix card shown
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users on delete cascade,
  task_id          uuid not null references public.tasks on delete cascade,   -- the missed task
  reason           miss_reason not null,
  fix_id           text not null,                     -- too_big_1 … out_of_time_2 | if_then
  choice           text check (choice in ('used','other','dismissed','own_plan')),
  outcome          text check (outcome in ('worked','not_worked')),
  outcome_task_id  uuid references public.tasks on delete set null,
  created_at       timestamptz not null default now()
);

create table public.events (                          -- our own minimal analytics (§8)
  id               bigint generated always as identity primary key,
  user_id          uuid not null default auth.uid() references auth.users on delete cascade,
  name             text not null,
  props            jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
);

-- Row Level Security: every user sees and changes only their own rows
alter table public.profiles   enable row level security;
alter table public.tasks      enable row level security;
alter table public.fix_events enable row level security;
alter table public.events     enable row level security;

create policy "own rows" on public.profiles   for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows" on public.tasks      for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows" on public.fix_events for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows" on public.events     for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
```

Notes:
- `fix_events.choice`: `used` (main button), `other` (Try something else; the next card gets its own row), `dismissed` (Not now), `own_plan` (Make my own plan from this card).
- Keep `updated_at` current (a trigger or set it in code).
- The 3-tasks-per-day cap and the outcome rules live in app code, which is easy to change during the test.
- Tester codes are typed in any case. Uppercase and trim them before saving.
- Quiet hours include the start time and exclude the end time (23:00 ≤ t < 08:00). The plan-reminder time picker doesn't allow times inside quiet hours.

## §5 Sign-in: anonymous plus a tester code

- On S2's Start, call Supabase's anonymous sign-in, then insert the profile with the tester code. Anonymous users get the `authenticated` role, so the RLS policies above apply to them. *(Supabase docs, checked Oct 20, 2026)*
- No email, no password, no personal details in our database. The private list that maps codes to names stays with the team, outside the app and the repo.
- Limits to accept for v1: signing out, deleting the app or switching phones loses access to the account. Tell testers not to delete the app during the test. If they reinstall, they use the same code, and the analysis groups by code.
- Before any public launch: add CAPTCHA (Supabase strongly recommends it for anonymous sign-ins), or offer a real account that the anonymous user can be linked to (Supabase supports converting an anonymous user by linking an identity). This is in BACKLOG.md.
- The Supabase free plan pauses a project after about a week with no activity. Daily testers keep it awake. Between test rounds, Promit restores it from the dashboard. *(checked Oct 20, 2026)*

## §6 Notifications

**`src/lib/schedule.ts` (pure).** `buildSchedule(now, profile, tasks) → Planned[]` returns `{ at, kind, taskIds, title, body, url }` for the **next 48 hours**:
- For each task with status `planned` (or `started`, for the check-in only) in the window, following PRODUCT.md §8 and RULES.md §5.1: the heads-up and follow-up (if `extra_reminders`), the start nudge (if `start_nudges`) and the check-in (end + 5 min, or +0 with "Losing track of time").
- Drop anything in the past, inside quiet hours or during a break.
- Tasks with the same start minute get one grouped nudge.
- Never more than 8 in one local day: drop follow-ups first, then heads-ups.
- The plan reminder isn't in this list. It's one **daily repeating** notification at `plan_time`.

**`src/lib/notifications.ts` (side effects).** `syncNotifications()` cancels all scheduled notifications and schedules `buildSchedule(...)` plus the daily plan reminder. Call it on app start, when the app comes to the foreground, and after any save (plan, settings, check-in, fix). It must be safe to call any number of times.

**Taps.** Every notification carries `data.url` (for example `/checkin/<taskId>`). Handle taps both when the app is running and when it starts from a tap (Expo Router's docs show the pattern with `expo-notifications`).

**Platform facts** *(checked Oct 20, 2026)*:
- **Expo Go:** local notifications work in Expo Go. Push doesn't (on Android since SDK 53), but we don't use push. Move to a **development build** by Milestone 2 anyway, to test real behaviour (Android channels, timing, notification buttons).
- **iOS keeps only the 64 soonest pending local notifications per app** (a repeating one counts as one). Scheduling 48 hours ahead keeps us far below that.
- **Android 14+ denies exact alarms (`SCHEDULE_EXACT_ALARM`) by default, so notifications can arrive late.** In Milestone 2, measure it on a real Android phone: schedule one 10 minutes ahead with the screen off. If it's more than about 2 minutes late, check the current `expo-notifications` docs for exact-alarm support and add a one-time prompt to allow "Alarms & reminders". Don't add `USE_EXACT_ALARM` without checking Google Play's policy, which limits it to apps like alarm clocks and calendars.
- Android needs a notification channel. Create a `reminders` channel with high importance before scheduling. Some Android brands' battery savers delay notifications. If a tester reports late nudges, check this first.
- On iOS the system permission prompt only appears once. After a "no", the app can only send people to Settings (that's the banner).

**Notification buttons** ("Start" / "In 10 min" right on the notification, using notification categories) are on the cut list. Tapping the notification and using S7 is enough.

## §7 Time

- Store instants as `timestamptz` (UTC). Store the user's IANA time zone in the profile, read from the phone (`expo-localization`) on every app open. `plan_date` is the student's local date.
- Use a time-zone-aware library (for example Luxon or date-fns-tz). Check it works with Hermes on both platforms on a real device. Never add or subtract hours by hand.
- Weeks run Monday to Sunday in local time.
- **Tests must cover:** Newfoundland's half-hour offset (UTC−2:30 until Nov 1, then UTC−3:30); the clock change on **Sun Nov 1, 2026 at 2:00 am**, when clocks go back to 1:00 (plan on Oct 31 for Nov 1 at 7 pm and check the instant); quiet hours that cross midnight; and week boundaries.

## §8 Events (our own minimal analytics)

`src/lib/events.ts` exposes `track(name, props)` with a fixed list of names: `app_open`, `onboarding_done`, `notification_permission` {granted}, `nudge_opened` {kind}, `start_tapped`, `snooze_tapped`, `timer_started`, `week_viewed`, `summary_shared`, `welcome_back_shown`, `settings_changed` {key}.
- **No free text and no task titles in props, ever.**
- **Never log** Support screen opens or crisis-check matches.
- Plans, check-ins and fixes are already in their own tables, so don't double-log them.

## §9 Builds and getting the app onto phones

| Stage | iPhone | Android |
|---|---|---|
| First steps (M0–M1) | Expo Go | Expo Go |
| Development build (from M2) | Needs the **Apple Developer Program ($99 USD/year)**. Register each iPhone (`eas device:create`); Apple allows about 100 iPhones a year. | Install the build's APK directly, free |
| Team and testers (from ~Oct 30) | **TestFlight external testing**: invite by email or a public link, up to 10,000 testers. It needs a beta description and a feedback email, and the first build of each version goes through Beta App Review (allow a day or two). | **Direct APK** link (testers allow "install unknown apps"), free. Or **Play Console internal testing** (up to 100 testers by email, no review), which needs the **$25 USD one-time** developer account. |

*(Fees and limits checked Oct 20, 2026.)*
- EAS free plan: **15 Android + 15 iOS builds a month**, in a low-priority queue, so start builds early in the day. Use **EAS Update** for JavaScript-only changes (copy, rules, screens) so testers get fixes without a new build. A native change (a new native library, permissions, icon, app config) needs a new build.
- `eas.json` profiles: `development` (dev client, internal), `preview` (internal; Android `buildType: apk`), `production` (TestFlight / Play).
- Submit iOS builds with `eas submit -p ios`. Set the app config so App Store Connect doesn't ask about encryption on every build. We only use standard HTTPS; check Expo's docs for `usesNonExemptEncryption`.
- App identity: display name **Follow Through** (working name, easy to change). iOS bundle id and Android package **`com.promitd.studentapp`**, which **can't change after the first store upload**. Version `0.1.0`. Icon: simple and neutral, nothing medical, no brains.
- Later, not now: a new personal Google Play account needs a closed test with **12+ testers for 14 days in a row** before it can publish to production. Plan for it before a public launch.

## §10 Privacy and security checklist (check before any tester)

- [ ] RLS is on for every table, and tested with two accounts: account B can't read account A's tasks.
- [ ] No secret key in the app or repo. `.env` is git-ignored and `.env.example` is committed.
- [ ] No third-party SDK that collects data (analytics, ads, crash reporting).
- [ ] Production builds don't log task titles or notes to the console.
- [ ] The "What we collect" screen, `docs/PRIVACY.md` and the data model all say the same thing.
- [ ] **Delete my data** removes every row in `events`, `fix_events`, `tasks` and `profiles` for the user, then signs out. At the end of the test, the team deletes the leftover anonymous accounts in the dashboard.
- [ ] Analysis exports group by tester code. They're never stored in the same file as the private name list.
- [ ] The privacy page is live at a public link (needed for TestFlight). For example a page on promitd.com, or GitHub Pages.

## §11 Testing

- **Unit tests (must pass):** `selectFix` and outcomes (RULES.md §4.3), the crisis check (matches and must-not-match lists, RULES.md §6.1), `buildSchedule` (48-hour window, quiet hours across midnight, past times, breaks, grouping, the 8-a-day cap with extras dropped first, end +0/+5), `time.ts` (§7) and `insights.ts` (week counts, best time of day, two-week rules).
- **On a real phone:** the phone checklist for each milestone in PLAN.md.

## §12 Gotchas

- A cloud build session can write and test code and make EAS builds, but Promit runs Expo Go from his own computer on the same Wi-Fi as his phone (or a tunnel).
- Simulators and emulators aren't reliable for notifications. Test on real phones.
- Scheduled local notifications still fire if the app is closed or the phone restarts. Re-sync on every open anyway.
- If Supabase seems to be "down" after a quiet week, the free project has probably paused. Restore it from the dashboard.
