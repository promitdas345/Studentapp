// The rules behind Start (S7), the focus timer (S8) and tapping a task on Today (PRODUCT.md S5–S8).
// Pure: no network, no clock reads, no React or Expo. Pass "now" in. Instants are ISO strings,
// as Supabase returns them.

import type { TaskStatus } from '../data/types';

// "In 10 min" moves the start once per task (PRODUCT.md S7).
export const SNOOZE_MIN = 10;

// The nudge fires at the start time and the student opens it a moment later, so for the first
// few minutes it still asks "Starting now?". After that it asks "Start now?" (PRODUCT.md S7).
const STILL_STARTING_MIN = 5;

const MINUTE_MS = 60 * 1000;

export type StartPrompt = 'starting_now' | 'start_now';

export function startPrompt(startAt: string, now: Date): StartPrompt {
  const late = now.getTime() > new Date(startAt).getTime() + STILL_STARTING_MIN * MINUTE_MS;
  return late ? 'start_now' : 'starting_now';
}

// Once per task, and only before it's started.
export function canSnooze(task: { status: TaskStatus; snoozed: boolean }): boolean {
  return task.status === 'planned' && !task.snoozed;
}

// The new start: 10 minutes after the planned start, or 10 minutes from now if the planned start
// has already gone by, so the nudge never comes sooner than they asked. Rounded up to the whole
// minute, so the time on Today is the time the nudge comes.
export function snoozedStart(startAt: string, now: Date): Date {
  const base = Math.max(new Date(startAt).getTime(), now.getTime());
  return new Date(Math.ceil((base + SNOOZE_MIN * MINUTE_MS) / MINUTE_MS) * MINUTE_MS);
}

// Time left on the timer, never below zero. It counts from when Start was tapped, so closing the
// app or turning the phone off changes nothing (PRODUCT.md S8).
export function timerLeftMs(startedAt: string, durationMin: number, now: Date): number {
  return Math.max(0, new Date(startedAt).getTime() + durationMin * MINUTE_MS - now.getTime());
}

// 754000 ms → '12:34'. Partial seconds round up, so it only shows '00:00' when time is really up.
// A 90-minute session starts at '90:00'.
export function formatLeft(ms: number): string {
  const totalSeconds = Math.ceil(Math.max(0, ms) / 1000);
  return `${pad2(Math.floor(totalSeconds / 60))}:${pad2(totalSeconds % 60)}`;
}

export type CardAction = 'start' | 'timer' | 'checkin' | 'none';

// What tapping a task on Today opens: Start until its planned end, then the check-in; the timer
// once it's started. An answered task only shows its answer.
export function cardAction(
  task: { status: TaskStatus; start_at: string; duration_min: number },
  now: Date,
): CardAction {
  if (task.status === 'started') return 'timer';
  if (task.status !== 'planned') return 'none';
  const end = new Date(task.start_at).getTime() + task.duration_min * MINUTE_MS;
  return now.getTime() >= end ? 'checkin' : 'start';
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
