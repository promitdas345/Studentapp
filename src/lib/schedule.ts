// What to schedule, and when: every nudge for the next 48 hours, plus the plan reminders
// (TECH.md §6, PRODUCT.md §8, RULES.md §5.1 and §7). src/lib/notifications.ts does the scheduling.
//
// Pure: no clock reads, no phone settings, no Expo. Pass "now", the profile and the tasks in.
// Times go through src/lib/time (Luxon), never by hand, so Newfoundland's half-hour offset and
// the Nov 1 clock change come out right.

import { en, fill } from '../copy/en';
import type { HardThing, Profile, Task } from '../data/types';
import { isInQuietHours } from './quietHours';
import { addDays, localDate, localDateOf, localTimeOf, toInstant } from './time';

export type NudgeKind = 'plan' | 'heads_up' | 'start' | 'follow_up' | 'checkin' | 'timer';

export type Planned = {
  at: Date;
  kind: NudgeKind;
  // The tasks it's about. Empty for a plan reminder; several for a grouped start nudge.
  taskIds: string[];
  title: string;
  body: string;
  // The screen a tap opens (an Expo Router path).
  url: string;
};

// Only the columns this file reads, so callers and tests can pass just those.
export type ScheduleProfile = Pick<
  Profile,
  | 'timezone'
  | 'hard_things'
  | 'plan_time'
  | 'quiet_start'
  | 'quiet_end'
  | 'start_nudges'
  | 'extra_reminders'
  | 'paused_until'
>;

export type ScheduleTask = Pick<
  Task,
  | 'id'
  | 'title'
  | 'plan_date'
  | 'start_at'
  | 'duration_min'
  | 'status'
  | 'tip'
  | 'cue'
  | 'if_then'
  | 'started_at'
>;

// Task nudges look 48 hours ahead (TECH.md §6). iOS keeps only the 64 soonest pending
// notifications per app, and 48 hours of nudges plus 14 plan reminders stays well under that.
export const TASK_WINDOW_HOURS = 48;

// Plan reminders are one-off notifications for the next 14 days, remade every time the app opens,
// so a break can skip days. One daily repeating notification can't skip a break (DECISIONS.md, Nov 3).
export const PLAN_REMINDER_DAYS = 14;

// Never more than 8 notifications in one local day (PRODUCT.md §8).
export const MAX_PER_DAY = 8;

const HEADS_UP_BEFORE_MIN = 10;
const FOLLOW_UP_AFTER_MIN = 10;
// The check-in comes 5 minutes after the planned end, or right at the end with
// "Losing track of time" (RULES.md §5.1).
const CHECKIN_AFTER_END_MIN = 5;

// A plan reminder set before noon is about today ("Plan today?"), from noon about tomorrow
// ("Plan tomorrow?"), so no extra setting is needed (DECISIONS.md, Nov 3).
const MORNING_BEFORE = '12:00';

// When a day has too many, these go first, in this order (TECH.md §6). The start nudge,
// check-in and plan reminder are the core of the loop and always stay.
const DROP_FIRST: readonly NudgeKind[] = ['follow_up', 'heads_up'];

const MINUTE_MS = 60 * 1000;

const copy = en.notifications;

export function buildSchedule(now: Date, profile: ScheduleProfile, tasks: ScheduleTask[]): Planned[] {
  const windowEnd = now.getTime() + TASK_WINDOW_HOURS * 60 * MINUTE_MS;
  const taskNudges = groupStarts(tasks.flatMap((task) => nudgesFor(task, profile))).filter(
    (nudge) => nudge.at.getTime() <= windowEnd,
  );
  const upcoming = [...taskNudges, ...planReminders(now, profile, tasks)].filter(
    (nudge) => nudge.at.getTime() > now.getTime() && allowedAt(nudge.at, profile),
  );
  return capPerDay(upcoming, profile.timezone).sort(byTime);
}

// A break pauses reminders on every day before paused_until, the day they come back
// ("Reminders are off until {date}"). Dates are 'YYYY-MM-DD', which compare correctly as text.
export function onBreak(date: string, pausedUntil: string | null): boolean {
  return pausedUntil !== null && date < pausedUntil;
}

function nudgesFor(task: ScheduleTask, profile: ScheduleProfile): Planned[] {
  const ids = [task.id];
  const startUrl = `/start/${task.id}`;
  const checkinUrl = `/checkin/${task.id}`;

  // Once started, the timer's end replaces the check-in: the countdown runs from the moment
  // Start was tapped, so that's when "Time's up" comes (DECISIONS.md, Nov 3).
  if (task.status === 'started') {
    const startedAt = new Date(task.started_at ?? task.start_at);
    return [
      {
        at: plusMinutes(startedAt, task.duration_min),
        kind: 'timer',
        taskIds: ids,
        title: copy.timerTitle,
        body: fill(copy.timerBody, { title: task.title }),
        url: checkinUrl,
      },
    ];
  }
  // Answered (or left alone for 3+ days): nothing more to say about it.
  if (task.status !== 'planned') return [];

  const start = new Date(task.start_at);
  const nudges: Planned[] = [];
  if (profile.extra_reminders) {
    nudges.push({
      at: plusMinutes(start, -HEADS_UP_BEFORE_MIN),
      kind: 'heads_up',
      taskIds: ids,
      title: copy.headsUpTitle,
      body: fill(copy.headsUpBody, { title: task.title }),
      url: startUrl,
    });
  }
  if (profile.start_nudges) {
    nudges.push({
      at: start,
      kind: 'start',
      taskIds: ids,
      title: copy.startTitle,
      body: startBody(task, profile.hard_things),
      url: startUrl,
    });
  }
  // Only while the task is still planned: tapping Start re-syncs, and this one goes away.
  if (profile.extra_reminders) {
    nudges.push({
      at: plusMinutes(start, FOLLOW_UP_AFTER_MIN),
      kind: 'follow_up',
      taskIds: ids,
      title: copy.followUpTitle,
      body: fill(copy.followUpBody, { title: task.title }),
      url: startUrl,
    });
  }
  const afterEnd = profile.hard_things.includes('time') ? 0 : CHECKIN_AFTER_END_MIN;
  nudges.push({
    at: plusMinutes(start, task.duration_min + afterEnd),
    kind: 'checkin',
    taskIds: ids,
    title: copy.checkinTitle,
    body: fill(copy.checkinBody, { title: task.title }),
    url: checkinUrl,
  });
  return nudges;
}

// "{title} · {length} min", plus one more line when there's something to remind them of.
function startBody(task: ScheduleTask, hardThings: HardThing[]): string {
  const first = fill(copy.startBody, { title: task.title, length: task.duration_min });
  const second = secondLine(task, hardThings);
  return second ? `${first}\n${second}` : first;
}

// The student's own if-then plan comes first, then their routine cue, then the tip a fix set,
// then the "Getting started" line (RULES.md §5.1, §7). Blank text counts as none.
function secondLine(task: ScheduleTask, hardThings: HardThing[]): string | null {
  const ifThen = task.if_then?.trim();
  if (ifThen) return ifThen;
  const cue = task.cue?.trim();
  if (cue) return fill(copy.cueLine, { cue });
  if (task.tip === 'phone_away') return copy.tipPhoneAway;
  if (task.tip === 'focus_or_move') return copy.tipFocusOrMove;
  if (hardThings.includes('starting')) return copy.startingLine;
  return null;
}

// Several tasks starting in the same minute get one nudge that opens Today (PRODUCT.md §9).
function groupStarts(nudges: Planned[]): Planned[] {
  const startsByMinute = new Map<number, Planned[]>();
  const result: Planned[] = [];
  for (const nudge of nudges) {
    if (nudge.kind !== 'start') {
      result.push(nudge);
      continue;
    }
    const key = nudge.at.getTime();
    startsByMinute.set(key, [...(startsByMinute.get(key) ?? []), nudge]);
  }
  for (const group of startsByMinute.values()) {
    if (group.length === 1) {
      result.push(group[0]);
      continue;
    }
    result.push({
      at: group[0].at,
      kind: 'start',
      taskIds: group.flatMap((nudge) => nudge.taskIds),
      title: copy.startTitle,
      body: fill(copy.startGroupBody, { n: group.length }),
      url: '/',
    });
  }
  return result;
}

// One reminder a day at plan_time for the next 14 days, except when the day it's about already
// has a plan (DECISIONS.md, Nov 3). Tasks can only be planned for today and tomorrow, so the
// tasks passed in cover every day that could have one.
function planReminders(now: Date, profile: ScheduleProfile, tasks: ScheduleTask[]): Planned[] {
  const tz = profile.timezone;
  const today = localDate(now, tz);
  const morning = profile.plan_time < MORNING_BEFORE;
  const plannedDates = new Set(tasks.map((task) => task.plan_date));
  const reminders: Planned[] = [];
  for (let i = 0; i < PLAN_REMINDER_DAYS; i++) {
    const date = addDays(today, i);
    const about = morning ? date : addDays(date, 1);
    if (plannedDates.has(about)) continue;
    reminders.push({
      at: toInstant(date, profile.plan_time, tz),
      kind: 'plan',
      taskIds: [],
      title: morning ? copy.planTodayTitle : copy.planTomorrowTitle,
      body: copy.planBody,
      url: morning ? '/plan?day=today' : '/plan?day=tomorrow',
    });
  }
  return reminders;
}

// Never inside quiet hours or a break (PRODUCT.md §8).
function allowedAt(at: Date, profile: ScheduleProfile): boolean {
  const tz = profile.timezone;
  if (isInQuietHours(localTimeOf(at, tz), profile.quiet_start, profile.quiet_end)) return false;
  return !onBreak(localDateOf(at, tz), profile.paused_until);
}

// At most 8 a day: follow-ups go first, then heads-ups, the latest of each first,
// so the earlier reminders of the day are the ones that stay.
function capPerDay(nudges: Planned[], tz: string): Planned[] {
  const byDay = new Map<string, Planned[]>();
  for (const nudge of nudges) {
    const day = localDateOf(nudge.at, tz);
    byDay.set(day, [...(byDay.get(day) ?? []), nudge]);
  }
  const kept: Planned[] = [];
  for (const dayNudges of byDay.values()) {
    let list = [...dayNudges].sort(byTime);
    for (const kind of DROP_FIRST) {
      while (list.length > MAX_PER_DAY) {
        const last = list.map((nudge) => nudge.kind).lastIndexOf(kind);
        if (last === -1) break;
        list = list.filter((_, i) => i !== last);
      }
    }
    kept.push(...list);
  }
  return kept;
}

function plusMinutes(at: Date, minutes: number): Date {
  return new Date(at.getTime() + minutes * MINUTE_MS);
}

// By time, then by kind and screen, so the order never depends on the input's order.
function byTime(a: Planned, b: Planned): number {
  return (
    a.at.getTime() - b.at.getTime() || a.kind.localeCompare(b.kind) || a.url.localeCompare(b.url)
  );
}
