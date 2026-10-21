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

import { localDateOf, weekDates, weekStart } from '../lib/time';

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
