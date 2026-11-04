# App guide: what's built, how to test it, and the development build

Written Nov 4, 2026. Everything in Milestones 1–4 is built, and the unit tests, type check, lint and an Android bundle pass. **None of Milestones 2–4 has been seen on a phone yet**, and nothing counts as working until it has (CLAUDE.md). This guide says what each part does and how to check it.

## 1. Get the latest version

In VS Code's terminal, in your `Studentapp` folder:

1. `git pull`. If it stops on `package-lock.json`, run `git restore package-lock.json` first, then `git pull` again.
2. `npm ci`, only if the pull changed `package.json` or `package-lock.json`. (The Nov 3–4 work didn't add any packages.)
3. `npx expo start --clear`, then scan the QR code with Expo Go.

Expo Go on Android shows local notifications, so you can test the nudges before the development build exists. They show up as coming from "Expo Go".

## 2. How the app works now

The loop is **plan → nudge → start → check-in → fix → this week**. There are three tabs at the bottom: **Today · This week · Settings**. Everything else opens on top of them.

| Screen | What it does |
|---|---|
| **Onboarding** (first launch) | Welcome → What we collect (18+, tester code) → Setup (what's hardest, weekly goal, plan reminder time) → Reminders permission. |
| **Today** | "Welcome back" after 3+ days without a check-in. "Reminders are off" with a Turn on button. "How did these go?" for unanswered tasks from the last 3 days. Today's and tomorrow's tasks. Plan today / Plan tomorrow. "This week: n of goal days" with dots. Tap a task to open Start (before its planned end), the timer (once started) or the check-in (after its end). |
| **Plan** | Up to 3 tasks a day (2 after "Plan fewer"), a start time and a length. Checks titles for crisis words. Saving re-schedules the nudges. |
| **Nudges** | Start nudge at the start time; check-in 5 minutes after the planned end (right at the end with "Losing track of time"); with extra reminders, a heads-up 10 minutes before and "Still on?" 10 minutes after. Plan reminder every day at the plan time. Never in quiet hours or a break, never more than 8 a day. Tapping one opens the right screen. |
| **Start** | "Starting now?" (or "Start now?" when you're more than 5 minutes late). **Start** opens the timer. **In 10 min** moves it once. **Not today** goes to "What got in the way?". |
| **Timer** | Counts down the planned length. It keeps counting with the app closed. "Time's up" comes as a notification. **I'm done** and **Stop** both open the check-in. |
| **Check-in** | "Did you get to it?" Done / Partly / Not yet. **Partly** offers "Plan the rest". **Not yet** asks why (6 reasons; "Something else" has an optional note, checked for crisis words), then opens Fix. |
| **Fix** | "Let's adjust." One fix card chosen by the rules in RULES.md §4. Its main button does what RULES.md §3 says, then opens Plan for tomorrow at the same time, filled in. **Try something else**, **Make my own plan** (the "If ___, then I'll ___." builder) or **Not now**. |
| **This week** | Days checked in vs the goal, tasks done, what got in the way most, What works for me, one suggestion, and **Share my week** (numbers only, never task titles). |
| **Settings** | What's hardest, weekly goal, plan reminder, start nudges, extra reminders, quiet hours, take a break (1, 3 or 7 days), Need to talk to someone?, What we collect, **Delete my data**, tester code and version. |

## 3. Phone checklist

Do these in order, on your Android phone, in Expo Go. When something looks wrong, write one sentence and take a screenshot. To look at the data, open Supabase → **Table Editor** (the grid icon, second from the top).

**Times in Supabase:** `start_at` is in UTC. Since the clocks went back on Nov 1, Newfoundland is 3½ hours behind UTC, so a 7:00 pm task shows as `22:30:00+00`.

### Milestone 1 (still to finish)
1. In `tasks`, check that your Oct 23 tasks show `18:00:00+00` ("Finish mid pre", 3:30 pm) and `21:00:00+00` ("Go gym", 6:30 pm).
2. In `profiles`, check for `TEAM1`, `America/St_Johns`, `collect-2026-10-21` and `age_confirmed` = true.
3. Crisis words: plan a task titled `end it all`. "Need to talk to someone?" should open, and nothing should be saved.
4. Plan 3 tasks for one day. "Three is plenty…" should appear and **Add another** should disappear.
5. Edit a task's time, then delete a task.
6. Time a teammate planning a task. It should take under 30 seconds.

### Reminders button
7. If the yellow "Reminders are off" box shows, tap **Turn on**. Either a permission pop-up appears or Expo Go's settings page opens. If neither happens, tell me. While Expo Go is running, its terminal on your laptop prints a yellow line starting with `[reminders:` that says what failed. Send a screenshot of it.

### Milestone 2: nudges, Start, timer
8. Plan a task starting **3 minutes from now**, then lock the phone. "Starting now?" should arrive. Note how many minutes late it was: Android can be late, and the plan asks us to measure it.
9. Tap the nudge. The Start screen should open. Tap **In 10 min**: the task moves 10 minutes later, and the button doesn't show a second time.
10. When the new nudge comes, tap **Start**. The timer should count down. Close the app completely and reopen it: tap the task on Today and the timer should still be at the right time.
11. When time's up, a "Time's up" notification should arrive. Tapping it opens the check-in.
12. Settings → **Plan reminder**: set it 2 minutes from now. "Plan tomorrow?" (or "Plan today?" if before noon) should arrive. It's skipped when the day it's about already has a plan (tomorrow for an evening time, today for a morning time), so test with that day empty. Then set it back.
13. Settings → **Quiet hours**: make them cover the next 10 minutes and plan a task 3 minutes ahead. No nudge should come. Then set quiet hours back (default 11 pm–8 am).
14. Settings → **Take a break** → 1 day. It should say "Reminders are off until …", and a task planned 3 minutes ahead should get no nudge. Then tap **Turn reminders back on**.

### Milestone 3: check-in and fixes
15. On a task, answer **Not yet** and pick each reason in turn, over several tasks. Each should show its first fix: Shrink it, Get a heads-up, Phone out of reach, Try a better time, Plan fewer, and the if-then builder for "Something else".
16. Tap each main button. Plan should open for tomorrow at the same time, with the change RULES.md §3 lists (for example "First 10 min: …" and 10 min for Shrink it). Save it. Afterwards:
    - in `tasks`, `from_fix_event` is set;
    - in `fix_events`, that card's `choice` is `used`.
17. Miss the same reason again within 14 days: you should get the second fix. A third miss gives "Make your own plan".
18. Check in **Done** on a task a fix created. It should say "That fix worked. Saved to What works for me.", and in `fix_events` the `outcome` should be `worked`.
19. Type `end it all` into the "Something else" note, and into the if-then builder. Support should open both times, and nothing should be saved.
20. On the Support screen, test each call, text and email button.

### Milestone 4: This week and Settings
21. After a few days of check-ins, This week's days and tasks done should match `tasks` in Supabase.
22. Tap **Share my week**. The text should only have numbers, never a task title.
23. Welcome back: in Supabase, change your latest `checked_in_at` to 4 days ago, make sure nothing is planned for today, then reopen Today. The banner should appear. Try **Make this week's goal lighter**.
24. Delete my data. Do this one last, and only with a team code. Settings → **Delete my data** should ask twice, then say "Deleted. Thanks for trying Follow Through." and return to Welcome. In Supabase, no rows should be left for that user in `tasks`, `fix_events`, `events` or `profiles`.

## 4. Making the development build (Android, free)

A development build is your own installable copy of the app. It's needed to measure nudge timing properly and before testers (PLAN.md M2). It takes about 30 minutes, most of it waiting for Expo's servers. Do it on your laptop:

1. **Add the development client:** `npx expo install expo-dev-client`, then commit and push the change. From then on, `npx expo start` opens development builds by default. Press `s` in the Expo terminal to switch back to Expo Go while you still need it.
2. **Sign in to Expo:** `npx eas-cli@latest login`, with the account that owns "promitdas's team".
3. **Link the project:** `npx eas-cli@latest init`. It adds a project ID to `app.json`. Commit that too.
4. **Give EAS the two Supabase values.** `.env` never leaves your laptop, so the cloud build can't see it. Run the line below for each name, `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY`, and for each environment, `development`, `preview` and `production`. That's six commands. Copy the values from your `.env`, type them in your own terminal, and don't paste them into the chat:
   `npx eas-cli@latest env:set --name EXPO_PUBLIC_SUPABASE_URL --value <the value> --environment development --visibility plaintext`
5. **Build:** `npx eas-cli@latest build --profile development --platform android`. The free plan queues builds, so start early in the day. When it's done, open the link on your phone and install the APK. Android asks you to allow installing from your browser the first time.
6. **Run it:** `npx expo start --clear`, then open the new app on your phone (not Expo Go). Check 8–14 again, and write the nudge lateness in DECISIONS.md.

`eas.json` already has the three build profiles (development, preview, production). Each one uses the EAS environment with the same name. The SDK 58 question gets decided at this step (DECISIONS.md, Nov 4). If notifications show a grey square for an icon in the development build, tell the build session: it needs the `expo-notifications` plugin with an icon in `app.json`.

## 5. What the team still has to decide

- **The new tester start date.** Nov 3 has passed. PLAN.md §3 lists what to cut if time is short.
- **iPhone testers:** if any testers have iPhones, the Apple Developer Program ($99) and TestFlight review need to start (DECISIONS.md #5).
- **Feedback email** (#3) and **what happens to testers' data after the test** (#4). Both go in the privacy page.
- **The privacy page** has to be live at a public link before TestFlight (TECH.md §10). The text is ready in `docs/PRIVACY.md` once the brackets are filled. The link then goes in `src/lib/links.ts`, and Settings shows it.
- **Should "What we collect" mention Supabase's sign-in logs?** If yes, the words go in RULES §8 S2 and `src/copy/en.ts`, and `CONSENT_VERSION` goes up.
- **The pass line** (#6) and **Dr. Nwauche's written OK** (#7), both before any tester.

## 6. Where things are in the code

| Area | Files |
|---|---|
| Screens | `src/app/`: `(tabs)/` (Today, This week, Settings), `plan.tsx`, `start/`, `timer/`, `checkin/`, `fix/`, `support.tsx`, `onboarding/` |
| Rules (pure, tested) | `src/rules/`: `fixes.ts` (the ladders as data), `selectFix.ts`, `outcomes.ts`, `insights.ts`, `plan.ts`, `start.ts`, `safety.ts` |
| Notifications | `src/lib/schedule.ts` (what and when, tested), `src/lib/notifications.ts` (puts it on the phone), `src/lib/expoNotifications.ts` (why it's imported file by file) |
| Words | `src/copy/en.ts` (every word the app shows) |
| Database | `supabase/migrations/`; checks in `supabase/tests/` (`rls_check.sql` for the dashboard; `pglite_check.mjs` and `app_writes_check.mjs` offline) |
