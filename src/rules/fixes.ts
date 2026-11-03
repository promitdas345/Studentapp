// The fix ladders as data (RULES.md §3, CLAUDE.md rule 8): which fixes each reason gets, in order,
// and what each fix's main button changes. The words live in src/copy/en.ts; selectFix.ts picks
// the fix. Pure: no network, no clock reads, no React or Expo.

import { en } from '../copy/en';
import type { MissReason, Tip } from '../data/types';

export type FixId =
  | 'too_big_1'
  | 'too_big_2'
  | 'forgot_1'
  | 'forgot_2'
  | 'distracted_1'
  | 'distracted_2'
  | 'tired_1'
  | 'tired_2'
  | 'out_of_time_1'
  | 'out_of_time_2'
  | 'if_then';

export type LadderReason = Exclude<MissReason, 'other'>;

// Each reason's two fixes: step 1, then step 2. "Something else" goes straight to the
// if-then builder (RULES.md §3).
export const LADDERS: Record<LadderReason, readonly [FixId, FixId]> = {
  too_big: ['too_big_1', 'too_big_2'],
  forgot: ['forgot_1', 'forgot_2'],
  distracted: ['distracted_1', 'distracted_2'],
  tired: ['tired_1', 'tired_2'],
  out_of_time: ['out_of_time_1', 'out_of_time_2'],
};

// What a fix's main button does. Every fix ends the same way: the Plan screen opens prefilled for
// tomorrow at the same start time ("reschedule"), and the student can change it before saving.
export type Fix = {
  // A new title made from the old one (RULES.md §3): "First 10 min: …" or "Just open it: …".
  title?: 'first_10' | 'just_open';
  // The new length, or "double" (10→25, 25→50, 50→90).
  length?: 5 | 10 | 'double';
  // Shown in the nudge (RULES.md §7).
  tip?: Tip;
  // Turns on the heads-up and follow-up in the profile.
  extraReminders?: true;
  // profiles.plan_hint for tomorrow: a cap of 2 tasks, or the "twice the time" tip.
  planHint?: 'cap' | 'double';
  // A step on the Fix screen before Plan opens: the routine picker, the if-then builder,
  // or (tired_1) the time picker opening on Plan.
  asks?: 'routine' | 'if_then' | 'time';
};

export const FIXES: Record<FixId, Fix> = {
  too_big_1: { title: 'first_10', length: 10 },
  too_big_2: { title: 'just_open', length: 5 },
  forgot_1: { extraReminders: true },
  forgot_2: { asks: 'routine' },
  distracted_1: { tip: 'phone_away' },
  distracted_2: { tip: 'focus_or_move' },
  tired_1: { asks: 'time' },
  tired_2: { length: 10 },
  out_of_time_1: { planHint: 'cap' },
  out_of_time_2: { length: 'double', planHint: 'double' },
  if_then: { asks: 'if_then' },
};

export const FIX_IDS = Object.keys(FIXES) as FixId[];

export function isFixId(value: string): value is FixId {
  return (FIX_IDS as string[]).includes(value);
}

// "Give it more time" (RULES.md §3): 10→25, 25→50, 50→90, and 90 stays 90. A 5-minute task
// (from "Make it tiny") doubles to 10. Only lengths the database allows come out.
export function doubledLength(minutes: number): number {
  if (minutes <= 5) return 10;
  if (minutes <= 10) return 25;
  if (minutes <= 25) return 50;
  return 90;
}

// The prefixes fixes and "Plan the rest" add to a title (words in src/copy/en.ts). Taken off before
// a new one goes on, so a second fix gives "Just open it: Essay", not "Just open it: First 10 min: Essay".
const TITLE_PREFIXES = Object.values(en.titlePrefixes);

export function withoutPrefixes(title: string): string {
  let rest = title.trim();
  for (let changed = true; changed; ) {
    changed = false;
    for (const prefix of TITLE_PREFIXES) {
      if (rest.startsWith(prefix)) {
        rest = rest.slice(prefix.length).trim();
        changed = true;
      }
    }
  }
  return rest;
}

// A prefixed title that still fits the 80-character limit: the old title is shortened with "…"
// when needed. Counts characters like Postgres does (one per code point).
export function prefixedTitle(prefix: string, title: string, max = 80): string {
  const base = Array.from(withoutPrefixes(title));
  const room = max - Array.from(prefix).length;
  const fitted = base.length <= room ? base.join('') : `${base.slice(0, room - 1).join('').trimEnd()}…`;
  return `${prefix}${fitted}`;
}
