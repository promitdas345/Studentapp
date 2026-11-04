# Where we left off (Nov 4, 2026)

Read this first in every new session, then keep it up to date at the end of the session.
Rules for how to work are in `CLAUDE.md`. The why behind each choice is in `docs/DECISIONS.md`. What's built and how to test it is in `docs/APP_GUIDE.md`.

## Status

| Milestone (PLAN.md §1) | State |
|---|---|
| **M0 Setup** | **Done.** Promit saw "Hello from Supabase" on an Android phone in Expo Go (Oct 21). |
| **M1 Data, onboarding, Today, Plan** | **Built; phone test partly done.** Database set up in the real project on Oct 23 (security check 11 of 11 PASS). In Expo Go, onboarding worked, two tasks were saved, and a wrong tester code was refused politely. The Expo Go crash on Android is fixed (DECISIONS.md, Oct 23). Left: APP_GUIDE.md §3, items 1–7. |
| M2 Notifications, Start, timer, first development build | **Built Nov 3, not yet seen on a phone.** The development build isn't made yet (APP_GUIDE.md §4). |
| M3 Check-in, fixes, safety | **Built Nov 3, not yet seen on a phone.** |
| M4 This week, Settings, delete, polish, privacy page | **Built Nov 3, not yet seen on a phone.** The privacy page waits for team decisions (APP_GUIDE.md §5). |
| M5 Go / no-go, tester builds | Tue Nov 3 has passed. The new date is the team's call. |

Checked on Nov 4: 268 unit tests, `npx tsc --noEmit`, lint and an Android bundle all pass. `supabase/tests/app_writes_check.mjs` shows every write the app makes is allowed (15 PASS offline), and `pglite_check.mjs` still gives 11 PASS.

Not built (PLAN.md §3 cut list): buttons on notifications (#1), the scaffolding card (#2), the bad-weeks card (#3) and the reminders-only comparison (#4; the app ignores `profiles.variant`).

## Next steps

### 1. Promit: the phone test
1. `git pull` (no `npm ci` needed; no packages changed), then `npx expo start --clear`.
2. Go through `docs/APP_GUIDE.md` §3 in order. Send one sentence per problem, with a screenshot.
3. The reminders "Turn on" button: say what happens when you tap it now, and send a screenshot of any yellow `[reminders: …]` line in the Expo terminal.

### 2. Build session: fix what the phone test finds, then the development build
- Fix problems first. Each fix gets the checks below before it's called done.
- Then walk Promit through `docs/APP_GUIDE.md` §4. `expo-dev-client` is added **at that step**, not before, because once it's installed `npx expo start` opens development builds by default. That would confuse testing in Expo Go.
- Decide SDK 57 vs 58 at that step (DECISIONS.md, Nov 4).
- Measure Android nudge lateness with the screen off and write it in DECISIONS.md. If it's more than about 2 minutes late, see DOCS_CHECK.md "For Milestone 2" (`SCHEDULE_EXACT_ALARM`; SDK 58 adds the exact-alarm permission calls).
- If notifications show a grey square for an icon, add the `expo-notifications` plugin with an icon to `app.json` (needs a new build).

### 3. Before testers
- The team decisions in `docs/APP_GUIDE.md` §5: start date, iPhone/Apple, feedback email, data after the test, pass line, Dr. Nwauche's written OK.
- Put the privacy page live (fill the brackets in `docs/PRIVACY.md`), and set `PRIVACY_URL` (and `FEEDBACK_EMAIL`) in `src/lib/links.ts`.
- Raise Supabase's anonymous sign-in limit (30 per hour per IP) before onboarding several testers on one campus network (DOCS_CHECK.md, M1).
- Re-check the Support numbers (RULES.md §6.2) before each tester round.
- Tester builds: an Android APK (`eas build --profile preview --platform android`); TestFlight only if the team decides on iPhone.

## Defaults in use that Promit hasn't confirmed

These were proposed in the first build session and used to build M2–M3. All are logged in DECISIONS.md (Nov 3). Change any of them, and the build session updates RULES.md/TECH.md and the code.
- A fix counts as working only by the task the fix created (RULES.md §4.2 note).
- Plan reminders are 14 one-off notifications that skip break days, not one repeating notification.
- A plan reminder before noon says "Plan today?", otherwise "Plan tomorrow?". It's skipped when that day already has a plan.
- A grouped nudge (several tasks at the same minute) opens Today.
- Once a task is started, "Time's up" at the timer's end replaces the check-in notification.

## Open questions

- **For the team:** PRIVACY.md says Supabase keeps technical sign-in logs (IP address, device type). Should the "What we collect" screen say it too? If yes: RULES §8 S2 → `src/copy/en.ts` → bump `CONSENT_VERSION` in `src/data/profile.ts`.
- Still open from the kit (DECISIONS.md "Open"): feedback email (#3), data after the test (#4), Apple $99 only if testers have iPhones (#5), pass line locked before testing (#6), Dr. Nwauche's written OK before any tester (#7).

## Things a build session must know

- **Import `expo-notifications` only through `src/lib/expoNotifications.ts`.** The package's main file crashes Expo Go on Android.
- **Checks before calling anything done:**
  - `npx tsc --noEmit`, `npx jest` and `CI=1 EXPO_OFFLINE=1 npx expo lint`.
  - A bundle check: `EXPO_OFFLINE=1 CI=1 npx expo export --platform android --no-bytecode --output-dir <scratch>/export`, with a throwaway `.env` that you delete afterwards. Then `grep -c ExpoTopicSubscriptionModule` on the bundle must give 0.
  - After any SQL or `src/data/` change, run both offline database checks (setup at the top of `supabase/tests/pglite_check.mjs`): `pglite_check.mjs` and `app_writes_check.mjs`.
- **Routes:** the tabs are in `src/app/(tabs)/`. A new screen must be added to the `ready` group in `src/app/_layout.tsx`.
- **Words** go in `src/copy/en.ts`. New ones are listed at the end of RULES.md §8.

## Facts about Promit's setup

- Windows laptop, VS Code, PowerShell, Node **25** (not LTS; the current LTS from nodejs.org is better before the development build). Android phone with Expo Go.
- GitHub: `promitdas345/Studentapp` (**public** by Promit's choice: never commit names, the tester list or keys). The Claude GitHub App is installed on it. Build sessions push to `main`, and Promit runs `git pull`.
- Supabase: project "follow-through" in **Canada (Central)**, free plan. "Automatically expose new tables" is off and "automatic RLS" is on, so every table needs explicit grants. Anonymous sign-ins are on.
- `.env` uses `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY` (the Connect panel's name; the app also accepts `..._PUBLISHABLE_KEY`).
- Expo account with organization "promitdas's team". The project isn't linked to EAS yet (`eas init` at the development-build step).
- Promit is a beginner with React Native, TypeScript and Supabase. Use plain words and small steps, and after each step say exactly what to do on the phone and what should appear.

## Tips for a cloud build session

- docs.expo.dev and supabase.com may be blocked by the network policy, so read the official docs source instead. It's the same content:
  - Expo: `git clone --depth 1 --filter=blob:none --sparse https://github.com/expo/expo.git`, then `git sparse-checkout set docs/pages`. Use the **main** branch: the versioned API pages (`docs/pages/versions/v57.0.0/sdk/`) aren't on the `sdk-57` branch.
  - Supabase: the same with `supabase/supabase` and `apps/docs/content/guides`.
  - Clone into the scratchpad, not the repo.
- The installed package's `.d.ts` files are the final word on an API (for example `node_modules/expo-notifications/build/Notifications.types.d.ts`).
- Expo's servers are blocked too, so run Expo CLI with `EXPO_OFFLINE=1`. npm itself works.
