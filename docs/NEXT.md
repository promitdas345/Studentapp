# Where we left off (Oct 21, 2026)

**Milestone 0: done.** Promit saw "Hello from Supabase" on his Android in Expo Go.

**Milestone 1: code written, not yet runnable.** In the repo and tested (163 unit tests, TypeScript and lint clean, iOS and Android bundles build):
- Onboarding S1–S4, Today, Plan (add/edit/delete, 3-a-day cap), Support
- `src/lib/time.ts`, `src/rules/safety.ts`, `src/rules/plan.ts`, `src/rules/insights.ts`, `src/lib/quietHours.ts`
- Data layer in `src/data/`, sign-in gate in `src/lib/session.tsx` and `src/app/_layout.tsx`

**Still to do for Milestone 1:**
1. ~~Database migration~~ Done: `supabase/migrations/20261022000000_m1_core.sql`.
2. ~~Security self-check~~ Done: `supabase/tests/rls_check.sql`. All 11 checks PASS in PGlite (Postgres in Node) with a stand-in auth schema.
3. Independent review of the M1 app code: started, then stopped to save tokens. Run it again (3 reviewers: screens & flow, rules & time, project rules & copy & Expo Go), fix what's confirmed, and push.
4. Promit, on his laptop: `git pull`, `npm install`, run both SQL files in Supabase, then `npx expo start --clear`. Phone checklist: PLAN.md §2 M1 (onboarding under 2 min, plan a task in under 30 s, 4th task refused, edit and delete work, typing a crisis phrase opens Support and isn't saved).

**Don't `git pull` on the laptop until step 3 is pushed.** After pulling, run the migration before opening the app: the new screens need the new tables.
