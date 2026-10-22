// Dates, clock times and weeks in the student's own time zone (TECH.md §7).
// Pure: no clock reads and no phone settings. Pass "now" and the IANA time zone in,
// so it can be unit tested and gives the same answer on every phone.
// Luxon does all the time-zone math. Never add or subtract hours by hand (CLAUDE.md "Times").
//
// Formats used across the app:
// - local date:  'YYYY-MM-DD', the student's calendar day (like tasks.plan_date)
// - clock time:  'HH:mm', 24-hour, in the student's time zone (like profiles.plan_time)
// - instant:     a JS Date, or an ISO string like the ones Supabase returns for timestamptz
//
// Bad input (a malformed date or time, an unknown time zone, an invalid Date) throws a
// RangeError instead of quietly returning something wrong, like a nudge at the wrong hour.

import { DateTime, IANAZone } from 'luxon';

import { en } from '../copy/en';

const MINUTES_PER_DAY = 24 * 60;

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
// Postgres `time` columns come back as 'HH:mm:ss', so seconds are allowed and ignored.
// The app plans in whole minutes.
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/;

// The student's local date at this moment.
export function localDate(now: Date, tz: string): string {
  return isoDate(atInstant(now, tz));
}

// Moves a local date by whole calendar days. Days, not 24-hour blocks, so a clock
// change can't push the answer onto the wrong day.
export function addDays(date: string, days: number): string {
  if (!Number.isInteger(days)) throw new RangeError(`Days must be a whole number: ${days}`);
  return isoDate(calendarDay(date).plus({ days }));
}

// The real moment (UTC) for a local date and clock time in tz.
// Two nights a year need a rule, because the clock skips or repeats an hour:
// - Spring forward (St John's, Sun Mar 8 2026, 2:00 → 3:00): times from 2:00 to 2:59 don't
//   exist. We keep Luxon's default, which moves them forward by the length of the gap
//   (2:30 → 3:30). 2:00 and 3:00 become the same moment.
// - Fall back (St John's, Sun Nov 1 2026, 2:00 → 1:00): times from 1:00 to 1:59 happen twice.
//   We return the EARLIER one (still on summer time), so a nudge is never later than planned.
export function toInstant(date: string, time: string, tz: string): Date {
  const { year, month, day } = calendarDay(date);
  const { hour, minute } = parseTime(time);
  const local = DateTime.fromObject({ year, month, day, hour, minute }, { zone: zoneOf(tz) });
  if (!local.isValid) throw new RangeError(`Can't place ${date} ${time} in ${tz}`);
  const earliest = local
    .getPossibleOffsets()
    .reduce((best, candidate) => (candidate.toMillis() < best.toMillis() ? candidate : best), local);
  return earliest.toJSDate();
}

// The local clock time ('HH:mm') of an instant, for showing a saved start time.
export function localTimeOf(instant: Date | string, tz: string): string {
  const local = atInstant(instant, tz);
  return clockTime(local.hour * 60 + local.minute);
}

// The local date of an instant, e.g. which day a check-in counts for.
export function localDateOf(instant: Date | string, tz: string): string {
  return isoDate(atInstant(instant, tz));
}

// '19:00' → '7:00 pm'. Plain string math instead of the phone's locale settings,
// so it reads the same on every phone and matches the copy ("We'll nudge you at 7:00 pm.").
// The am/pm words live in src/copy/en.ts like all other words (CLAUDE.md rule 7).
export function formatTime(time: string): string {
  const { hour, minute } = parseTime(time);
  const suffix = hour < 12 ? en.time.am : en.time.pm;
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${pad2(minute)} ${suffix}`;
}

// The next :00 or :30 on the student's clock, strictly after now (the Plan screen's default
// start time). Rounds what the phone's clock shows, so 23:45 wraps to '00:00'.
export function nextHalfHour(now: Date, tz: string): string {
  const local = atInstant(now, tz);
  const minutesNow = local.hour * 60 + local.minute;
  const next = (Math.floor(minutesNow / 30) * 30 + 30) % MINUTES_PER_DAY;
  return clockTime(next);
}

// Is the student's clock still earlier than time? (For example "before 5 pm" on Today and Plan.)
export function isBefore(now: Date, tz: string, time: string): boolean {
  const local = atInstant(now, tz);
  const { hour, minute } = parseTime(time);
  return local.hour * 60 + local.minute < hour * 60 + minute;
}

// The local Monday of this week. Weeks run Monday to Sunday (TECH.md §7), whatever
// the phone's region says. Luxon's weekday is always 1 = Monday … 7 = Sunday.
export function weekStart(now: Date, tz: string): string {
  const local = atInstant(now, tz);
  return addDays(isoDate(local), 1 - local.weekday);
}

// The 7 local dates of this week, Monday first.
export function weekDates(now: Date, tz: string): string[] {
  const monday = weekStart(now, tz);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

// For checking the phone's time zone before saving it. expo-localization can give null
// or something odd (DOCS_CHECK.md), and the caller needs a fallback then.
export function isValidTimeZone(tz: string): boolean {
  return typeof tz === 'string' && IANAZone.isValidZone(tz);
}

// Always build an explicit zone. A name like 'system' or 'local' would make Luxon
// quietly use the phone's own zone, which would make these functions impure.
function zoneOf(tz: string): IANAZone {
  if (!isValidTimeZone(tz)) throw new RangeError(`Unknown time zone: ${tz}`);
  return IANAZone.create(tz);
}

// An instant seen on the clock in tz. Strings without an offset are read as UTC.
function atInstant(instant: Date | string, tz: string): DateTime<true> {
  const zone = zoneOf(tz);
  const local =
    typeof instant === 'string'
      ? DateTime.fromISO(instant, { zone: 'utc' }).setZone(zone)
      : DateTime.fromJSDate(instant, { zone });
  if (!local.isValid) throw new RangeError(`Not a valid instant: ${String(instant)}`);
  return local;
}

// A local date as a calendar day with no time zone, so day math never meets a clock change.
function calendarDay(date: string): DateTime<true> {
  const match = DATE_PATTERN.exec(date);
  if (!match) throw new RangeError(`Date must be YYYY-MM-DD: ${date}`);
  const day = DateTime.fromObject(
    { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) },
    { zone: 'utc' },
  );
  if (!day.isValid) throw new RangeError(`Not a real date: ${date}`);
  return day;
}

function parseTime(time: string): { hour: number; minute: number } {
  const match = TIME_PATTERN.exec(time);
  if (!match) throw new RangeError(`Time must be HH:mm (24-hour): ${time}`);
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

function isoDate(dt: DateTime<true>): string {
  return dt.toISODate();
}

function clockTime(minutesOfDay: number): string {
  return `${pad2(Math.floor(minutesOfDay / 60))}:${pad2(minutesOfDay % 60)}`;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
