# Where we left off (Oct 21, 2026)

**Milestone 0: done.** Promit saw "Hello from Supabase" on his Android in Expo Go.

**Milestone 1: code written, not yet runnable.** In the repo and tested (163 unit tests, TypeScript and lint clean, iOS and Android bundles build):
- Onboarding S1–S4, Today, Plan (add/edit/delete, 3-a-day cap), Support
- `src/lib/time.ts`, `src/rules/safety.ts`, `src/rules/plan.ts`, `src/rules/insights.ts`, `src/lib/quietHours.ts`
- Data layer in `src/data/`, sign-in gate in `src/lib/session.tsx` and `src/app/_layout.tsx`

**Still to do for Milestone 1:**
1. Write `supabase/migrations/20261022000000_m1_core.sql` (drops `hello`; profiles, tasks, fix_events, events; text + check instead of enums; `light_goal`/`light_goal_week`; tester code FT01–FT99/TEAM1–4; one RLS policy per action with `(select auth.uid())`; revoke all, then explicit grants; profiles UPDATE limited to the changeable columns; indexes on user_id; events.id uuid). Must match `src/data/types.ts`. See `docs/DOCS_CHECK.md` "For Milestone 1".
2. Write `supabase/tests/rls_check.sql`: throwaway users in a transaction, PASS/FAIL table, then rollback.
3. Independent review of the M1 code (it was written quickly and hasn't been reviewed yet), then fix and push.
4. Promit, on his laptop: `git pull`, `npm install`, run both SQL files in Supabase, then `npx expo start --clear`. Phone checklist: PLAN.md §2 M1 (onboarding under 2 min, plan a task in under 30 s, 4th task refused, edit and delete work, typing a crisis phrase opens Support and isn't saved).

**Don't `git pull` on the laptop until step 1 is pushed.** The new screens need the new tables.
