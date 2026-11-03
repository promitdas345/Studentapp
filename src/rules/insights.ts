// The numbers behind "This week: {n} of {goal} days" on Today (S5) and the dots on
// This week (S11). M1 part only: active days and the weekly goal.
//
// An active day is a local day with at least one answered check-in (PLAN.md §6). A day is
// counted by the local date of checked_in_at, not plan_date, so the app shows the same number
// as the PLAN.md §6 test query, which groups by `checked_in_at at time zone p.timezone`.
// A late check-in (answered the next morning) counts for the day it was answered.
//
// Pure (no network, no clock, no React or Expo), so it can be unit tested: pass "now" and
// the student's IANA time zone in. src/lib/time does the time-zone math.

import { localDateOf, localTimeOf, weekDates, weekStart } from '../lib/time';

// Only the two task columns this file reads, so callers can select just those.
export type TaskForWeek = { status: string; checked_in_at: string | null };

// The statuses that mean the student answered the check-in. 'planned', 'started' and
// 'unanswered' (left alone for 3+ days) are not answers, so they never make a day active.
export const ANSWERED_STATUSES = ['done', 'partly', 'not_yet'] as const;

// The student's weekly goal (profiles.weekly_goal), plus the lighter goal for one week
// from "Make this week's goal lighter" (S14). light_goal_week is the Monday of that week.
export type GoalProfile = {
  weekly_goal: number;
  light_goal: number | null;
  light_goal_week: string | null;
};

// Same range as the check on profiles.weekly_goal (TECH.md §4).
const MIN_GOAL = 2;
const MAX_GOAL = 7;
// TECH.md §4 default, used only if the profile somehow holds something that isn't a number.
const DEFAULT_GOAL = 4;

// The local dates (Monday to Sunday of this week, oldest first) with at least one answered
// check-in. Each date appears once, however many check-ins it had. For drawing the dots.
export function activeDatesThisWeek(tasks: TaskForWeek[], now: Date, tz: string): string[] {
  const week = weekDates(now, tz);
  const answeredDays = new Set<string>();
  for (const task of tasks) {
    // An answer with no time can't be placed on a day, so it can't make one active.
    if (!isAnswered(task.status) || task.checked_in_at === null) continue;
    answeredDays.add(localDateOf(task.checked_in_at, tz));
  }
  // Filtering the week (instead of sorting the set) keeps Monday-first order and drops
  // check-ins from other weeks in one step.
  return week.filter((date) => answeredDays.has(date));
}

// How many days this week the student checked in: the {n} in "{n} of {goal} days".
export function activeDaysThisWeek(tasks: TaskForWeek[], now: Date, tz: string): number {
  return activeDatesThisWeek(tasks, now, tz).length;
}

// This week's goal: the {goal} in "{n} of {goal} days".
// A lighter goal only applies in the week it was chosen for, then the normal goal comes back
// on its own, so the student never has to remember to undo it.
export function effectiveWeeklyGoal(profile: GoalProfile, now: Date, tz: string): number {
  const normal = clampGoal(profile.weekly_goal);
  const { light_goal: light, light_goal_week: lightWeek } = profile;
  if (light === null || !Number.isFinite(light) || lightWeek !== weekStart(now, tz)) {
    return normal;
  }
  // "Lighter" should never raise the goal, for example if the normal goal was lowered
  // in Settings after the lighter one was picked.
  return Math.min(clampGoal(light), normal);
}

// Did the student reach this week's goal? Days past the goal still count as met.
export function goalMet(activeDays: number, goal: number): boolean {
  return activeDays >= goal;
}

function isAnswered(status: string): boolean {
  return (ANSWERED_STATUSES as readonly string[]).includes(status);
}

// Keeps the goal a whole number from 2 to 7, so "{n} of {goal} days" always makes sense.
function clampGoal(goal: number): number {
  if (!Number.isFinite(goal)) return DEFAULT_GOAL;
  return Math.min(MAX_GOAL, Math.max(MIN_GOAL, Math.round(goal)));
}

// ─── Best time of day (RULES.md §4.4), for the "Try a better time" fix ────────────────────────

// Parts of the day in local time: morning 5:00–11:59, afternoon 12:00–16:59,
// evening 17:00–21:59, night 22:00–4:59.
export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';

const DAY_PARTS: readonly DayPart[] = ['morning', 'afternoon', 'evening', 'night'];

// Shown only with 5+ answered check-ins in total, and only parts with 3+ check-ins count.
const MIN_ANSWERED = 5;
const MIN_IN_PART = 3;

// The task columns this part reads: whether it was answered, and when it was planned to start.
export type TaskForBestTime = { status: string; start_at: string };

// clock time 'HH:mm' → its part of the day.
export function dayPartOf(time: string): DayPart {
  if (time >= '05:00' && time < '12:00') return 'morning';
  if (time >= '12:00' && time < '17:00') return 'afternoon';
  if (time >= '17:00' && time < '22:00') return 'evening';
  return 'night';
}

// The part of the day with the highest share of Done among answered check-ins, going by when
// each task was planned to start. null when there isn't enough to say, or nothing was done yet.
// A tie goes to the part with more check-ins, then the earlier part of the day.
export function bestTimeOfDay(tasks: TaskForBestTime[], tz: string): DayPart | null {
  const answered = tasks.filter((task) => isAnswered(task.status));
  if (answered.length < MIN_ANSWERED) return null;
  const counts = new Map<DayPart, { total: number; done: number }>();
  for (const task of answered) {
    const part = dayPartOf(localTimeOf(task.start_at, tz));
    const count = counts.get(part) ?? { total: 0, done: 0 };
    counts.set(part, { total: count.total + 1, done: count.done + (task.status === 'done' ? 1 : 0) });
  }
  let best: { part: DayPart; share: number; total: number } | null = null;
  for (const part of DAY_PARTS) {
    const count = counts.get(part);
    if (!count || count.total < MIN_IN_PART) continue;
    const share = count.done / count.total;
    if (!best || share > best.share || (share === best.share && count.total > best.total)) {
      best = { part, share, total: count.total };
    }
  }
  return best && best.share > 0 ? best.part : null;
}
