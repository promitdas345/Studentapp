// The planning rules behind the Plan screen (PRODUCT.md S2, S5, S6; RULES.md §3; TECH.md §4).
// The screens ask these functions; the numbers and limits live here so they're easy to change
// during the test (TECH.md §4: "The 3-tasks-per-day cap … lives in app code").
//
// Pure: no network, no clock reads, no React or Expo. Pass "now" and the IANA time zone in.
// Dates are local 'YYYY-MM-DD' strings and clock times are 'HH:mm', like the rest of the app.
// No user-facing words here (CLAUDE.md rule 7): problems come back as codes, and the screen
// picks the words from src/copy/en.ts.

import { isBefore, nextHalfHour } from '../lib/time';

// "Pick 1–3 small things" (DECISIONS.md kit defaults). A fix can lower it to 2 for one day.
export const MAX_TASKS_PER_DAY = 3;

// The cap on the day after a "Plan fewer" fix (RULES.md §3 out_of_time_1).
const LIGHTER_DAY_CAP = 2;

// The Plan screen only offers these. Fixes can also set 5 and 90 (RULES.md §3).
export const PLAN_LENGTHS = [10, 25, 50] as const;

// Every length the database allows (tasks.duration_min check).
export const ALL_LENGTHS = [5, 10, 25, 50, 90] as const;

export const DEFAULT_LENGTH = 25;

// Matches the database check: char_length(title) between 1 and 80.
export const TITLE_MAX = 80;

// From 5 pm local, Plan defaults to tomorrow and Today shows "Plan tomorrow" (PRODUCT.md S5, S6).
export const PLAN_TOMORROW_FROM = '17:00';

// When there's no last-used time for tomorrow. The docs don't give one, so we picked 7 pm:
// it's after most classes, well outside the default quiet hours (11 pm–8 am), and it's the
// time the docs use in the example save message ("We'll nudge you at 7:00 pm.").
// The student can change it before saving.
const TOMORROW_FALLBACK_START = '19:00';

// The latest start we offer for today. Used when the next half hour would be past midnight,
// which is tomorrow, not today.
const LATEST_TODAY_START = '23:30';

// Same shape as profiles.plan_hint (TECH.md §4), e.g. {"cap":2,"for_date":"2026-11-04"}.
export type PlanHint = { cap?: number; double?: boolean; for_date: string } | null;

export type PlanDay = 'today' | 'tomorrow';

export type TitleCheck = { ok: true; title: string } | { ok: false; problem: 'empty' | 'too_long' };

// Statuses that mean the student has answered the check-in for that task.
const CHECKED_IN: readonly string[] = ['done', 'partly', 'not_yet'];

// Codes are typed in any case (TECH.md §4). FT01–FT99 for testers, TEAM1–TEAM4 for the team.
// FT00 is left out on purpose: the codes we hand out start at FT01 (PRODUCT.md S2).
const TESTER_CODE_PATTERN = /^(FT(0[1-9]|[1-9]\d)|TEAM[1-4])$/;
const TEAM_CODE_PATTERN = /^TEAM[1-4]$/;

// Also accepts 'HH:mm:ss', because Postgres `time` columns come back with seconds.
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/;

// How many tasks the student can plan on this date. Only 2 on the one day the
// "Plan fewer" fix chose, so a lighter plan never sticks around by accident.
export function dailyCap(planHint: PlanHint, date: string): number {
  if (planHint?.cap === LIGHTER_DAY_CAP && planHint.for_date === date) return LIGHTER_DAY_CAP;
  return MAX_TASKS_PER_DAY;
}

// How many more tasks fit on the day. 0 means "Add another" is hidden and a 4th task is refused.
// Never negative, e.g. if 3 tasks were planned before a fix lowered the cap to 2.
export function slotsLeft(existingOnDate: number, cap: number): number {
  return Math.max(0, cap - existingOnDate);
}

// The Today / Tomorrow switch's default: Today before 5 pm local, Tomorrow from 5 pm.
export function defaultPlanDay(now: Date, tz: string): PlanDay {
  return isBefore(now, tz, PLAN_TOMORROW_FROM) ? 'today' : 'tomorrow';
}

// The time picker's default (PRODUCT.md S6): the last-used start time, or the next half hour
// for today. For today a last-used time that has already gone by is skipped, so the default
// isn't a time that would need "Start now?".
export function defaultStartTime(opts: {
  day: PlanDay;
  now: Date;
  tz: string;
  lastUsed: string | null;
}): string {
  const lastUsed = cleanTime(opts.lastUsed);
  if (opts.day === 'tomorrow') return lastUsed ?? TOMORROW_FALLBACK_START;

  if (lastUsed !== null && isBefore(opts.now, opts.tz, lastUsed)) return lastUsed;
  const next = nextHalfHour(opts.now, opts.tz);
  // After 11:30 pm the next half hour is '00:00', which is tomorrow. Stay on today instead.
  // That time has already passed, so the Plan screen asks "Start now?" (PRODUCT.md §9).
  if (!isBefore(opts.now, opts.tz, next)) return LATEST_TODAY_START;
  return next;
}

// Cleans up a typed title and checks it fits the database (1–80 characters).
// Spaces are trimmed and runs of spaces or line breaks become one space, so a title
// can't be blank or sneak past the limit with padding.
export function validateTitle(raw: string): TitleCheck {
  const title = raw.trim().replace(/\s+/g, ' ');
  if (title.length === 0) return { ok: false, problem: 'empty' };
  if (characterCount(title) > TITLE_MAX) return { ok: false, problem: 'too_long' };
  return { ok: true, title };
}

// The soft tip for very short titles like "Study chem" (PRODUCT.md S6). Specific plans are
// easier to start. It's only a tip: it never blocks saving.
export function shouldShowTitleTip(title: string): boolean {
  const words = title.trim().split(/\s+/).filter((word) => word.length > 0);
  return words.length >= 1 && words.length <= 2;
}

// Today's "Plan tomorrow" button (PRODUCT.md S5): from 5 pm, or earlier once every task today
// has a check-in answer. With no tasks today, it waits until 5 pm (the empty state shows
// "Plan today" instead).
export function showPlanTomorrowButton(now: Date, tz: string, todaysStatuses: string[]): boolean {
  if (!isBefore(now, tz, PLAN_TOMORROW_FROM)) return true;
  return todaysStatuses.length > 0 && todaysStatuses.every((status) => CHECKED_IN.includes(status));
}

// The tester code as we save it ('FT07', 'TEAM2'), or null if it isn't one of ours.
// S2 shows "Check the code we sent you." on null.
export function normalizeTesterCode(raw: string): string | null {
  const code = raw.trim().toUpperCase();
  return TESTER_CODE_PATTERN.test(code) ? code : null;
}

// Team codes are left out of the test results (PLAN.md §6). Accepts the code in any case.
export function isTeamCode(code: string): boolean {
  const clean = normalizeTesterCode(code);
  return clean !== null && TEAM_CODE_PATTERN.test(clean);
}

// Counts characters the way Postgres char_length does (one per Unicode code point).
// JavaScript's .length counts an emoji as 2, which would refuse titles the database accepts.
function characterCount(text: string): number {
  return Array.from(text).length;
}

// A usable 'HH:mm', or null for anything else, so a bad saved value falls back to the
// default instead of breaking the Plan screen.
function cleanTime(time: string | null): string | null {
  if (time === null) return null;
  const match = TIME_PATTERN.exec(time);
  return match ? `${match[1]}:${match[2]}` : null;
}
