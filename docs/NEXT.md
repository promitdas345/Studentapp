# Where we left off (Oct 23, 2026)

Read this first in every new session, then keep it up to date at the end of the session.
Rules for how to work are in `CLAUDE.md`. The why behind each choice is in `docs/DECISIONS.md`.

## Status

| Milestone (PLAN.md §1) | State |
|---|---|
| **M0 Setup** | **Done.** Promit saw "Hello from Supabase" on his Android in Expo Go (Oct 21). |
| **M1 Data, onboarding, Today, Plan** | **Built, reviewed and fixed. Waiting for Promit's phone test.** |
| M2 Notifications, Start, timer, first development build | Not started. Planned Oct 25–27. |
| M3 Check-in, fixes, safety | Not started. Planned Oct 28–30. |
| M4 This week, Settings, delete, polish, privacy page | Not started. Planned Oct 31–Nov 2. |
| M5 Go / no-go, tester builds | Tue Nov 3. |

What's in the repo for M1:
- Screens (`src/app/`): Welcome, What we collect (18+, tester code, anonymous sign-in on Start), Setup, Reminders, Today, Plan (add/edit/delete, 3-a-day cap, 2 with a plan hint), Support. Screens are gated by sign-in state in `src/app/_layout.tsx` (Expo Router protected routes) using `src/lib/session.tsx`.
- Pure modules with 164 unit tests: `src/lib/time.ts` (Luxon; St. John's offsets and the Nov 1 clock change), `src/rules/safety.ts` (crisis check, word-start matching), `src/rules/plan.ts`, `src/rules/insights.ts`, `src/lib/quietHours.ts`, `src/lib/env.ts`.
- Data layer: `src/data/` (types, profile, tasks, errors). All words: `src/copy/en.ts`.
- Database: `supabase/migrations/20261022000000_m1_core.sql` (one RLS policy per action, revoke-then-grant, profiles can't change tester_code/variant/consent). Self-check: `supabase/tests/rls_check.sql` (11 checks). Offline harness: `supabase/tests/pglite_check.mjs` (all 11 PASS).
- An independent AI code review found 3 bugs and several small issues; all fixed (commit 71c7656).

## Next steps

### 1. Promit: finish the M1 phone test (on his Windows laptop, in `Desktop\student app business 3630\Studentapp`)
1. `git restore package-lock.json` (only if `git pull` complains about it), then `git pull`, then `npm ci`. Always use `npm ci` after pulling, not `npm install` (Node 25's npm rewrites the lock file).
2. Supabase → SQL Editor: run `supabase/migrations/20261022000000_m1_core.sql` **once**, then `supabase/tests/rls_check.sql`. Every row must say PASS.
3. `npx expo start --clear`, open in Expo Go on his Android. Two yellow `expo-notifications` warnings about Expo Go are expected (push isn't used).
4. Checklist (PLAN.md §2 M1):
   - Onboarding (Welcome → What we collect → Setup → Reminders → Today) takes under 2 minutes. Supabase Table Editor → profiles shows the tester code, time zone `America/St_Johns`, consent version and 18+.
   - A teammate who has never seen it plans a task in under 30 seconds.
   - 3 tasks on one day, then a 4th is refused politely. Edit and delete work.
   - Plan a task for 7:00 pm today. Table Editor → tasks: `start_at` must be **21:30 UTC** (UTC−2:30 until Nov 1; from Nov 1 it's 22:30). This is the only check of time zones on the phone's JS engine (Hermes).
   - A crisis phrase as a task title opens "Need to talk to someone?" and isn't saved.
5. Tell the build session what failed, one sentence per problem, with a photo.

### 2. Build session: fix whatever the phone test finds, then start M2
Before M2, read `docs/DOCS_CHECK.md` "For Milestone 2". Key points:
- Move to a **development build** (EAS, `eas init` links the project to Promit's Expo org "promitdas's team"; he skipped creating a project on the website on purpose). Android dev build APK is free. Consider upgrading to SDK 58 at the same time (SDK 57 was chosen only because Expo Go runs 57).
- Android: create the `reminders` channel before asking permission (already done in `src/lib/notifications.ts`). Exact alarms: measure lateness first (PLAN.md M2), log it in DECISIONS.md.
- `src/lib/schedule.ts` must be pure with tests (TECH.md §6, §11), and `syncNotifications()` re-syncs on start, foreground and after every save.
- Check trigger types (`SchedulableTriggerInputTypes.DATE`/`DAILY`) against the installed `expo-notifications` types; the docs source didn't include the API reference.

## Open questions

- **For the team:** PRIVACY.md now says Supabase keeps technical sign-in logs (IP address, device type). Should the "What we collect" screen say it too? If yes: RULES §8 S2 → `src/copy/en.ts` → bump `CONSENT_VERSION` in `src/data/profile.ts`.
- **Proposed in the first build session, not yet confirmed by Promit** (use these defaults when building M2–M3 unless he says otherwise, and log them in DECISIONS.md then):
  - "Did the fix work?" (RULES §4.2): judge a fix only by the task the fix created (`tasks.from_fix_event`), not any later task, so the "fix worked" rate isn't inflated.
  - Plan reminder: schedule it as one-off notifications for the next 14 days (re-made on every app open, skipping break days), not one daily repeating notification, because a repeating one can't skip a break.
  - A plan reminder set before noon says "Plan today?", otherwise "Plan tomorrow?" (no extra column).
  - A grouped nudge (several tasks at the same minute) opens Today.
  - Once a task is started, the timer-end notification replaces the check-in notification.
- Still open from the kit (DECISIONS.md "Open"): feedback email (#3), data after the test (#4), Apple $99 only if testers have iPhones (#5), pass line locked before Nov 3 (#6), Dr. Nwauche's written OK before any tester (#7).

## Facts about Promit's setup

- Windows laptop, VS Code, PowerShell, Node **25** (not LTS; installing the current LTS from nodejs.org is better before M2). Android phone with Expo Go.
- GitHub: `promitdas345/Studentapp` (**public** by Promit's choice: never commit names, the tester list, or keys). Claude GitHub App installed on it.
- Supabase: project "follow-through" in **Canada (Central)**, free plan. "Automatically expose new tables" is off and "automatic RLS" is on, so every table needs explicit grants. Anonymous sign-ins are on.
- `.env` uses `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY` (the Connect panel's name; the app also accepts `..._PUBLISHABLE_KEY`).
- Expo account with organization "promitdas's team".
- Promit is a beginner with React Native/TypeScript/Supabase: plain words, small steps, and after each step say exactly what to do on the phone and what he should see.

## Tips for a cloud build session

- docs.expo.dev and supabase.com may be blocked by the network policy. Read the official docs source instead (it's the same content):
  `git clone --depth 1 --filter=blob:none --sparse https://github.com/expo/expo.git` then `git sparse-checkout set docs/pages` (versioned API pages are under `docs/pages/versions/v57.0.0/`), and the same for `supabase/supabase` with `apps/docs/content/guides`. Clone into the scratchpad, not the repo.
- Expo's servers are blocked too: run Expo CLI with `EXPO_OFFLINE=1` (e.g. `EXPO_OFFLINE=1 npx expo install <pkg>`, `EXPO_OFFLINE=1 CI=1 npx expo lint`). npm itself works.
- Checks before calling anything done: `npx tsc --noEmit`, `npx jest`, `CI=1 EXPO_OFFLINE=1 npx expo lint`, and a bundle check: `EXPO_OFFLINE=1 CI=1 npx expo export --platform android --output-dir <scratch>/export` with a throwaway `.env` (delete it after).
- New SQL: run `supabase/tests/pglite_check.mjs` (instructions at its top) before giving Promit a migration.
