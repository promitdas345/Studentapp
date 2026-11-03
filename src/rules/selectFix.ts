// Picks the one fix card the Fix screen shows (RULES.md §4.1), and what "Try something else"
// shows next. Pure: no network, no clock reads, no React or Expo. Pass "now" and the student's
// history in.

import type { FixChoice, FixOutcome, MissReason } from '../data/types';
import { LADDERS, type FixId } from './fixes';

// Misses with the same reason count over the last 14 days (RULES.md §4.1 step 5).
export const MISS_WINDOW_DAYS = 14;

// Turned down this many times for a reason, a fix stops being offered for it (step 2).
const TURNED_DOWN_LIMIT = 2;

const DAY_MS = 24 * 60 * 60 * 1000;

// A past check-in answered "Not yet" (including "Not today"): its reason and when it was answered.
export type PastMiss = { reason: MissReason; at: string };

// The fix_events columns this file reads.
export type PastFixEvent = {
  fix_id: string;
  reason: MissReason;
  choice: FixChoice | null;
  outcome: FixOutcome | null;
  created_at: string;
};

export type FixPick = {
  fixId: FixId;
  // Shows the badge "This worked for you before."
  workedBefore: boolean;
};

// misses must include the miss being fixed right now.
export function selectFix(input: {
  reason: MissReason;
  now: Date;
  misses: PastMiss[];
  fixEvents: PastFixEvent[];
}): FixPick {
  const { reason, now, misses, fixEvents } = input;
  // 1. "Something else": the student writes their own plan.
  if (reason === 'other') return { fixId: 'if_then', workedBefore: false };

  // 2. Drop any fix turned down twice or more for this reason ("Not now" or "Try something else").
  const history = fixEvents.filter((event) => event.reason === reason);
  const left = LADDERS[reason].filter((fixId) => {
    const turnedDown = history.filter(
      (event) => event.fix_id === fixId && (event.choice === 'dismissed' || event.choice === 'other'),
    );
    return turnedDown.length < TURNED_DOWN_LIMIT;
  });

  // 3. A fix whose most recent outcome is "worked" comes back, with the badge. If several have,
  // the one that worked most recently. A later "not_worked" takes the badge away.
  const worked = left
    .map((fixId) => ({ fixId, latest: latestOutcome(history, fixId) }))
    .filter((candidate) => candidate.latest?.outcome === 'worked')
    .sort((a, b) => time(b.latest?.created_at) - time(a.latest?.created_at))[0];
  if (worked) return { fixId: worked.fixId, workedBefore: true };

  // 4. Nothing left of the ladder.
  if (left.length === 0) return { fixId: 'if_then', workedBefore: false };

  // 5. How many times this reason came up in the last 14 days, counting this one.
  const since = now.getTime() - MISS_WINDOW_DAYS * DAY_MS;
  const count = misses.filter(
    (miss) => miss.reason === reason && time(miss.at) >= since && time(miss.at) <= now.getTime(),
  ).length;
  const n = Math.max(1, count);

  // 6. Step 1 for the first miss, step 2 for the second. More misses than fixes left means our
  // ideas didn't stick, so the student writes their own plan.
  if (n > left.length) return { fixId: 'if_then', workedBefore: false };
  return { fixId: left[n - 1], workedBefore: false };
}

// "Try something else": the next fix in the reason's ladder, then the if-then builder,
// then back to step 1 (RULES.md §4.1).
export function nextFix(reason: MissReason, current: FixId): FixId {
  if (reason === 'other') return 'if_then';
  const cycle: FixId[] = [...LADDERS[reason], 'if_then'];
  return cycle[(cycle.indexOf(current) + 1) % cycle.length];
}

// The fix's most recent card that has an outcome, newest by when the card was shown.
function latestOutcome(history: PastFixEvent[], fixId: FixId): PastFixEvent | undefined {
  return history
    .filter((event) => event.fix_id === fixId && event.outcome !== null)
    .sort((a, b) => time(b.created_at) - time(a.created_at))[0];
}

function time(iso: string | undefined): number {
  return iso === undefined ? 0 : new Date(iso).getTime();
}
