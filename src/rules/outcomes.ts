// Did the fix work? Run when a check-in is answered (RULES.md §4.2).
// A fix is judged only by the task it created, the one whose from_fix_event points at it, so a
// later task that has nothing to do with the fix can't make it look like it worked (DECISIONS.md,
// Nov 3; proposed in the first build session). Otherwise as RULES.md §4.2: only fixes the student
// used ("used" or "own_plan"), with no outcome yet, shown in the 3 days before, and only when the
// task started after the fix was shown.
// Pure: no network, no clock reads, no React or Expo. Pass "now" in.

import type { FixEvent, FixOutcome } from '../data/types';

export const OUTCOME_WINDOW_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

export type CheckInAnswer = 'done' | 'partly' | 'not_yet';

export type OutcomeUpdate = { fixEventId: string; outcome: FixOutcome; outcome_task_id: string };

export function outcomeUpdates(input: {
  task: { id: string; start_at: string; from_fix_event: string | null };
  answer: CheckInAnswer;
  now: Date;
  fixEvents: Pick<FixEvent, 'id' | 'choice' | 'outcome' | 'created_at'>[];
}): OutcomeUpdate[] {
  const { task, answer, now, fixEvents } = input;
  if (!task.from_fix_event) return [];
  const since = now.getTime() - OUTCOME_WINDOW_DAYS * DAY_MS;
  const startedAt = new Date(task.start_at).getTime();
  return fixEvents
    .filter((event) => event.id === task.from_fix_event)
    .filter((event) => (event.choice === 'used' || event.choice === 'own_plan') && event.outcome === null)
    .filter((event) => {
      const shownAt = new Date(event.created_at).getTime();
      return shownAt >= since && shownAt <= now.getTime() && startedAt > shownAt;
    })
    .map((event) => ({
      fixEventId: event.id,
      // Partly is never a miss (RULES.md §2), so it counts as the fix working.
      outcome: answer === 'not_yet' ? 'not_worked' : 'worked',
      outcome_task_id: task.id,
    }));
}
