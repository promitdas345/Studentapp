import { Settings } from 'luxon';

import {
  ANSWERED_STATUSES,
  activeDatesThisWeek,
  activeDaysThisWeek,
  effectiveWeeklyGoal,
  goalMet,
  type GoalProfile,
  type TaskForWeek,
} from './insights';

// Newfoundland: UTC−2:30 in summer, UTC−3:30 in winter. In 2026 the clocks go back
// on Sun Nov 1 at 2:00 am. Weeks used below (local, Monday to Sunday):
//   Oct 19–25 (summer) · Oct 26–Nov 1 (the clock change) · Nov 2–8 (winter)
const NL = 'America/St_Johns';

// Builds a UTC instant from an ISO string, so every test states the exact moment it means.
const utc = (iso: string) => new Date(iso);

// A task as Supabase returns the two columns this file reads.
const task = (status: string, checked_in_at: string | null): TaskForWeek => ({ status, checked_in_at });

// "now" values in St John's.
const WED_OCT_21_NOON = utc('2026-10-21T14:30:00Z'); // week of Oct 19
const WED_OCT_28_NOON = utc('2026-10-28T14:30:00Z'); // week of Oct 26
const SUN_NOV_1_2359 = utc('2026-11-02T03:29:00Z'); // last minute of the week of Oct 26 (winter time)
const MON_NOV_2_0000 = utc('2026-11-02T03:30:00Z'); // first minute of the week of Nov 2

describe('ANSWERED_STATUSES', () => {
  test('are the three check-in answers from PLAN.md §6', () => {
    expect(ANSWERED_STATUSES).toEqual(['done', 'partly', 'not_yet']);
  });
});

describe('activeDaysThisWeek and activeDatesThisWeek', () => {
  test('every answer counts, including Not yet', () => {
    const tasks = [
      task('done', '2026-10-19T15:00:00Z'), // Mon Oct 19
      task('partly', '2026-10-20T15:00:00Z'), // Tue Oct 20
      task('not_yet', '2026-10-21T15:00:00Z'), // Wed Oct 21
    ];
    expect(activeDaysThisWeek(tasks, WED_OCT_21_NOON, NL)).toBe(3);
    expect(activeDatesThisWeek(tasks, WED_OCT_21_NOON, NL)).toEqual(['2026-10-19', '2026-10-20', '2026-10-21']);
  });

  test('two check-ins on the same day count once', () => {
    const tasks = [
      task('done', '2026-10-20T12:00:00Z'), // Tue 9:30 am
      task('not_yet', '2026-10-20T23:00:00Z'), // Tue 8:30 pm
      task('partly', '2026-10-21T02:29:00Z'), // Tue 11:59 pm
    ];
    expect(activeDaysThisWeek(tasks, WED_OCT_21_NOON, NL)).toBe(1);
    expect(activeDatesThisWeek(tasks, WED_OCT_21_NOON, NL)).toEqual(['2026-10-20']);
  });

  test('planned, started and unanswered tasks never make a day active', () => {
    const tasks = [
      task('planned', null),
      task('started', null),
      task('unanswered', null),
      // Even with a time filled in, these aren't answers.
      task('planned', '2026-10-19T15:00:00Z'),
      task('started', '2026-10-20T15:00:00Z'),
      task('unanswered', '2026-10-21T15:00:00Z'),
      task('something_new', '2026-10-21T15:00:00Z'),
    ];
    expect(activeDaysThisWeek(tasks, WED_OCT_21_NOON, NL)).toBe(0);
    expect(activeDatesThisWeek(tasks, WED_OCT_21_NOON, NL)).toEqual([]);
  });

  test('an answer with no check-in time is skipped, not guessed', () => {
    expect(activeDaysThisWeek([task('done', null)], WED_OCT_21_NOON, NL)).toBe(0);
  });

  test('no tasks means no active days', () => {
    expect(activeDaysThisWeek([], WED_OCT_21_NOON, NL)).toBe(0);
    expect(activeDatesThisWeek([], WED_OCT_21_NOON, NL)).toEqual([]);
  });

  test('Sunday 11:30 pm counts for that week; Monday 12:10 am counts for the next', () => {
    const sundayLate = task('done', '2026-10-26T02:00:00Z'); // Sun Oct 25, 11:30 pm
    const mondayEarly = task('done', '2026-10-26T02:40:00Z'); // Mon Oct 26, 12:10 am
    const tasks = [sundayLate, mondayEarly];

    expect(activeDatesThisWeek(tasks, WED_OCT_21_NOON, NL)).toEqual(['2026-10-25']);
    expect(activeDatesThisWeek(tasks, WED_OCT_28_NOON, NL)).toEqual(['2026-10-26']);
  });

  test('a check-in at 02:00 UTC on a Monday is still Sunday evening in St John’s', () => {
    const checkIn = task('done', '2026-10-26T02:00:00Z'); // Mon in UTC, Sun Oct 25 11:30 pm in NL

    // In St John's it lands on Sunday, the last day of the week of Oct 19.
    expect(activeDatesThisWeek([checkIn], WED_OCT_21_NOON, NL)).toEqual(['2026-10-25']);
    // Counted in UTC it would be Monday, a different week. The time zone has to come in.
    expect(activeDatesThisWeek([checkIn], utc('2026-10-21T12:00:00Z'), 'UTC')).toEqual([]);
    expect(activeDatesThisWeek([checkIn], utc('2026-10-28T12:00:00Z'), 'UTC')).toEqual(['2026-10-26']);
  });

  test('the week of the Nov 1 clock change runs Mon Oct 26 to Sun Nov 1', () => {
    const tasks = [
      task('done', '2026-10-26T11:30:00Z'), // Mon Oct 26, 9:00 am (summer time)
      task('done', '2026-11-01T04:00:00Z'), // Sun Nov 1, 1:30 am, first time (summer)
      task('partly', '2026-11-01T05:00:00Z'), // Sun Nov 1, 1:30 am, second time (winter)
      // 02:45 UTC would be Monday 12:15 am on summer time, but it's winter now: Sun 11:15 pm.
      task('not_yet', '2026-11-02T02:45:00Z'),
      task('done', '2026-11-02T03:00:00Z'), // Sun Nov 1, 11:30 pm (winter)
      task('done', '2026-11-02T03:40:00Z'), // Mon Nov 2, 12:10 am: next week
    ];

    expect(activeDatesThisWeek(tasks, SUN_NOV_1_2359, NL)).toEqual(['2026-10-26', '2026-11-01']);
    expect(activeDaysThisWeek(tasks, SUN_NOV_1_2359, NL)).toBe(2);
    // One minute later a new week starts, with only the Monday check-in in it.
    expect(activeDatesThisWeek(tasks, MON_NOV_2_0000, NL)).toEqual(['2026-11-02']);
  });

  test('check-ins from other weeks are left out', () => {
    const tasks = [
      task('done', '2026-10-12T15:00:00Z'), // Mon Oct 12, the week before
      task('done', '2026-10-22T15:00:00Z'), // Thu Oct 22, this week
      task('done', '2026-10-27T15:00:00Z'), // Tue Oct 27, the week after
    ];
    expect(activeDatesThisWeek(tasks, WED_OCT_21_NOON, NL)).toEqual(['2026-10-22']);
  });

  test('dates come back Monday first, whatever order the tasks are in', () => {
    const tasks = [
      task('done', '2026-10-25T15:00:00Z'), // Sun
      task('done', '2026-10-19T15:00:00Z'), // Mon
      task('done', '2026-10-23T15:00:00Z'), // Fri
    ];
    expect(activeDatesThisWeek(tasks, WED_OCT_21_NOON, NL)).toEqual(['2026-10-19', '2026-10-23', '2026-10-25']);
  });

  test('reads timestamps the way Supabase returns them', () => {
    const tasks = [
      task('done', '2026-10-26T02:00:00+00:00'), // Sun Oct 25, 11:30 pm
      task('done', '2026-10-20T15:00:00.123456+00:00'), // microseconds, Tue Oct 20
    ];
    expect(activeDatesThisWeek(tasks, WED_OCT_21_NOON, NL)).toEqual(['2026-10-20', '2026-10-25']);
  });

  test('throws on an unknown time zone instead of guessing', () => {
    expect(() => activeDaysThisWeek([], WED_OCT_21_NOON, 'Not/AZone')).toThrow(RangeError);
  });

  test('doesn’t depend on the phone’s own time zone', () => {
    const original = Settings.defaultZone;
    try {
      Settings.defaultZone = 'Asia/Kathmandu'; // UTC+5:45, far from St John's
      const tasks = [task('done', '2026-11-02T03:00:00Z')]; // Sun Nov 1, 11:30 pm in NL
      expect(activeDatesThisWeek(tasks, SUN_NOV_1_2359, NL)).toEqual(['2026-11-01']);
    } finally {
      Settings.defaultZone = original;
    }
  });
});

describe('effectiveWeeklyGoal', () => {
  const profile = (overrides: Partial<GoalProfile> = {}): GoalProfile => ({
    weekly_goal: 4,
    light_goal: null,
    light_goal_week: null,
    ...overrides,
  });

  test('uses the normal goal when there is no lighter goal', () => {
    expect(effectiveWeeklyGoal(profile(), WED_OCT_21_NOON, NL)).toBe(4);
    expect(effectiveWeeklyGoal(profile({ weekly_goal: 5 }), WED_OCT_21_NOON, NL)).toBe(5);
  });

  test('a lighter goal applies only in its own week', () => {
    const lighter = profile({ light_goal: 3, light_goal_week: '2026-10-19' });

    expect(effectiveWeeklyGoal(lighter, utc('2026-10-19T02:29:00Z'), NL)).toBe(4); // Sun Oct 18, 11:59 pm
    expect(effectiveWeeklyGoal(lighter, utc('2026-10-19T02:30:00Z'), NL)).toBe(3); // Mon Oct 19, 12:00 am
    expect(effectiveWeeklyGoal(lighter, WED_OCT_21_NOON, NL)).toBe(3);
    expect(effectiveWeeklyGoal(lighter, utc('2026-10-26T02:29:00Z'), NL)).toBe(3); // Sun Oct 25, 11:59 pm
    expect(effectiveWeeklyGoal(lighter, utc('2026-10-26T02:30:00Z'), NL)).toBe(4); // Mon Oct 26: back to normal
    expect(effectiveWeeklyGoal(lighter, WED_OCT_28_NOON, NL)).toBe(4);
  });

  test('the week is judged on the student’s clock, not UTC', () => {
    const lighter = profile({ light_goal: 3, light_goal_week: '2026-10-19' });
    const mondayInUtc = utc('2026-10-26T02:00:00Z'); // Sun Oct 25, 11:30 pm in St John's

    expect(effectiveWeeklyGoal(lighter, mondayInUtc, NL)).toBe(3);
    expect(effectiveWeeklyGoal(lighter, mondayInUtc, 'UTC')).toBe(4);
  });

  test('a lighter goal for the Nov 1 week lasts until Sunday midnight, winter time', () => {
    const lighter = profile({ light_goal: 2, light_goal_week: '2026-10-26' });
    expect(effectiveWeeklyGoal(lighter, SUN_NOV_1_2359, NL)).toBe(2);
    expect(effectiveWeeklyGoal(lighter, MON_NOV_2_0000, NL)).toBe(4);
  });

  test('a week with no lighter goal number uses the normal goal', () => {
    expect(effectiveWeeklyGoal(profile({ light_goal_week: '2026-10-19' }), WED_OCT_21_NOON, NL)).toBe(4);
  });

  test('keeps the goal between 2 and 7', () => {
    expect(effectiveWeeklyGoal(profile({ weekly_goal: 0 }), WED_OCT_21_NOON, NL)).toBe(2);
    expect(effectiveWeeklyGoal(profile({ weekly_goal: 1 }), WED_OCT_21_NOON, NL)).toBe(2);
    expect(effectiveWeeklyGoal(profile({ weekly_goal: 7 }), WED_OCT_21_NOON, NL)).toBe(7);
    expect(effectiveWeeklyGoal(profile({ weekly_goal: 9 }), WED_OCT_21_NOON, NL)).toBe(7);

    const thisWeek = { light_goal_week: '2026-10-19' };
    expect(effectiveWeeklyGoal(profile({ ...thisWeek, light_goal: 1 }), WED_OCT_21_NOON, NL)).toBe(2);
    expect(effectiveWeeklyGoal(profile({ ...thisWeek, light_goal: 0 }), WED_OCT_21_NOON, NL)).toBe(2);
    expect(effectiveWeeklyGoal(profile({ ...thisWeek, light_goal: -3 }), WED_OCT_21_NOON, NL)).toBe(2);
  });

  test('a lighter goal never raises the goal', () => {
    const higher = profile({ weekly_goal: 3, light_goal: 5, light_goal_week: '2026-10-19' });
    expect(effectiveWeeklyGoal(higher, WED_OCT_21_NOON, NL)).toBe(3);
  });

  test('odd numbers from the database become a sensible whole-number goal', () => {
    expect(effectiveWeeklyGoal(profile({ weekly_goal: 4.4 }), WED_OCT_21_NOON, NL)).toBe(4);
    expect(effectiveWeeklyGoal(profile({ weekly_goal: Number.NaN }), WED_OCT_21_NOON, NL)).toBe(4);
    const badLight = profile({ weekly_goal: 5, light_goal: Number.NaN, light_goal_week: '2026-10-19' });
    expect(effectiveWeeklyGoal(badLight, WED_OCT_21_NOON, NL)).toBe(5);
  });
});

describe('goalMet', () => {
  test('is met at the goal or above, not below', () => {
    expect(goalMet(4, 4)).toBe(true);
    expect(goalMet(5, 4)).toBe(true);
    expect(goalMet(3, 4)).toBe(false);
    expect(goalMet(0, 2)).toBe(false);
    expect(goalMet(7, 7)).toBe(true);
  });
});
