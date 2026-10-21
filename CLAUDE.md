# CLAUDE.md — Follow Through (working name)

Read this before every task. Product details are in `docs/`.

## The project in one paragraph

A phone app that helps university students do the studying they planned. Each day the student plans 1–3 small tasks, gets a nudge at the start time and checks in afterwards. When they miss, the app helps fix tomorrow's plan instead of making them feel guilty. That fix after a miss is the product's edge, because planning apps (Shovel) already own the planning half. First users: MUN undergrads who feel overwhelmed when work piles up and have already tried a fix that didn't stick. It's a BUSI 3630 team project (Promit, Sam, Austin, Alex), and Promit plans to keep building it after the course.

## Who you're working with

- Promit is the only engineer. He knows HTML, CSS, some JavaScript and Java. He's new to React Native, TypeScript and Supabase. Explain in plain words, keep steps small, and say why.
- After every step, tell him exactly how to try it on his phone and what he should see.
- Nothing counts as working until he has seen it work on a real phone.
- He's a full-time student, so prefer the simplest thing that works.

## Scope: v1 only

Build only what's in `docs/PRODUCT.md`. The core loop is **plan → nudge → check-in → fix → weekly view**.
If you or Promit think of something else, add it to `docs/BACKLOG.md` and keep going. Ask before building anything that isn't in PRODUCT.md.

Not in v1, even if it looks easy: due dates, syllabus import or Brightspace sync (decision pending), app or site blocking, streaks, points, badges, leaderboards or characters, AI or LLM calls, study tools, meditation, mental-health articles, self-tests or screeners, payments, ads, third-party analytics or crash SDKs, and social features beyond sharing the weekly summary through the phone's share sheet.

## Rules that never bend

1. **Never name or guess a condition.** No "you might have ADHD/anxiety/depression", no risk scores, no diagnosis fields. A verdict could make the app a regulated medical device, and it would be wrong most of the time.
2. **Crisis words get fixed rules, not judgment.** If free text matches the phrases in `docs/RULES.md` §6, show the Support screen right away and don't save that text. The app never tries to counsel anyone.
3. **No guilt.** Never "failed", "missed your goal", "streak lost" or "you should have". Use "Not yet", "Let's adjust", "Welcome back". Follow `docs/RULES.md` §1.
4. **Collect as little as possible.** No names, emails, phone numbers, contacts, location or health data. Testers are known only by a tester code. Never send user data to ad networks or analytics companies, and never put free text into analytics events.
5. **Every table has Row Level Security**, so users can only read and write their own rows. The Supabase secret (service_role) key never goes in the app or the repo.
6. **Effort is a hard limit.** Planning a day must take under a minute, less effort than a paper list. If a feature adds taps to the daily loop, it needs a strong reason.
7. **All words live in one place.** User-facing text goes in `src/copy/en.ts` so it can be translated later. Don't hard-code strings in screens.
8. **Rules are data plus pure functions.** The fix ladders are data in `src/rules/fixes.ts`. The logic that picks a fix is a pure function in `src/rules/selectFix.ts` with unit tests. The same goes for notification scheduling (`src/lib/schedule.ts`) and the crisis check (`src/rules/safety.ts`).

## Stack (details in docs/TECH.md)

- Expo (React Native) with TypeScript (strict) and Expo Router.
- Supabase: Postgres, Auth (anonymous sign-in plus a tester code) and RLS, with the project in Canada (Central), `ca-central-1`.
- Local notifications with `expo-notifications`, scheduled on the phone. No push server in v1.
- EAS Build for iPhone and Android builds, and EAS Update for JavaScript-only fixes.
- Use the latest stable versions, and **check the official docs (docs.expo.dev, supabase.com/docs) before using any API.** Don't go from memory, because APIs change.

## How to work

- Take small steps, each of which runs. Commit after each working step with a plain message.
- Write unit tests for everything in `src/rules/` and for `src/lib/schedule.ts` and `src/lib/time.ts`. Run them before calling a step done.
- Times: store UTC timestamps plus the user's IANA time zone, and use a time-zone-aware library. Never add hours by hand. Test Newfoundland's half-hour offset (UTC−2:30 in summer, UTC−3:30 in winter) and the clock change on Sun Nov 1, 2026.
- Secrets: only the Supabase URL and the publishable (anon) key go in the app, through a git-ignored `.env`. Never ask Promit to paste a secret into the chat.
- Ask first before anything that costs money, can't be undone (deleting data, store submissions), adds a new service or SDK, or sends data somewhere new.
- Log product decisions in `docs/DECISIONS.md` (date, decision, why). Keep `docs/AI_LOG.md` up to date: one line per session with the date, what Promit asked in his own words, and what was built. The course requires citing AI use.
- If a doc is unclear or two docs disagree, say so and ask. Don't guess silently.
- If a build or command fails twice the same way, stop, explain what's happening in plain words, and suggest the next step.

## Definition of done (any feature)

- It works on a real phone, and Promit has seen it.
- Its words match the tone rules in `docs/RULES.md` and live in `src/copy/en.ts`.
- Data writes respect RLS. Nothing new is collected unless the "What we collect" screen and `docs/PRIVACY.md` are updated first.
- Tests pass, with no TypeScript errors and no unexplained warnings.

## Where things are

| File | What's in it |
|---|---|
| `docs/PRODUCT.md` | Screens, the loop, what's left out |
| `docs/RULES.md` | Tone, reasons → fixes, how a fix is chosen, safety, every word the app shows |
| `docs/TECH.md` | Stack, data model, notifications, builds, privacy checklist |
| `docs/PLAN.md` | Milestones and dates, cut list, the tester test and pass line |
| `docs/EVIDENCE.md` | Interviews and research behind each decision |
| `docs/DECISIONS.md` | What's decided and what's still open |
| `docs/BACKLOG.md` | Ideas for after v1 |
| `docs/PRIVACY.md` | Draft privacy page |
| `docs/AI_LOG.md` | AI-use log for the course |
