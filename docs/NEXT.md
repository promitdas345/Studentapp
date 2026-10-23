# Where we left off (Oct 22, 2026)

**Milestone 0: done.** Promit saw "Hello from Supabase" on his Android in Expo Go.

**Milestone 1: built, reviewed and fixed. Waiting for Promit's phone test.**
- Onboarding S1–S4, Today, Plan (add/edit/delete, 3-a-day cap), Support, crisis check on titles
- Pure modules with 164 unit tests: `src/lib/time.ts`, `src/rules/safety.ts`, `src/rules/plan.ts`, `src/rules/insights.ts`, `src/lib/quietHours.ts`
- Database: `supabase/migrations/20261022000000_m1_core.sql` and `supabase/tests/rls_check.sql`. All 11 checks PASS in PGlite (Postgres in Node).
- An independent code review found 3 bugs (offline launch sent you to Welcome, edit could bypass the daily cap, Today didn't refresh on return) and smaller issues; all fixed.

**Next: Promit tests on his phone** (steps in README.md):
1. `git restore package-lock.json` (only if `git pull` complains about it), `git pull`, then `npm ci` (new packages).
2. Supabase SQL Editor: run `supabase/migrations/20261022000000_m1_core.sql` once, then `supabase/tests/rls_check.sql` (every row PASS).
3. `npx expo start --clear`, scan with Expo Go. Two yellow `expo-notifications` warnings in Expo Go are expected.
4. Checklist (PLAN.md §2 M1):
   - Onboarding takes under 2 minutes. In Supabase Table Editor → profiles: tester code, time zone `America/St_Johns`, consent version, 18+.
   - A teammate who has never seen it plans a task in under 30 seconds.
   - 3 tasks on one day, then a 4th is refused politely. Edit and delete work.
   - Plan a task for 7:00 pm today. In Table Editor → tasks, `start_at` should be **21:30 UTC** (St. John's is UTC−2:30 until Nov 1). This checks the phone's time-zone handling, which can't be tested off the phone.
   - Typing a crisis phrase as a title opens "Need to talk to someone?" and the title isn't saved.

**Open question for the team:** PRIVACY.md now says Supabase keeps technical sign-in logs (IP address, device type). Should the "What we collect" screen (S2) say it too? If yes, update RULES §8 S2 and `src/copy/en.ts`, and bump `CONSENT_VERSION` in `src/data/profile.ts`.

**After the phone test:** Milestone 2 (notifications, Start, timer, first development build). Read `docs/DOCS_CHECK.md` "For Milestone 2" first.
