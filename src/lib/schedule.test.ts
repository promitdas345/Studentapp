import { Settings } from 'luxon';

import {
  MAX_PER_DAY,
  PLAN_REMINDER_DAYS,
  buildSchedule,
  onBreak,
  type Planned,
  type ScheduleProfile,
  type ScheduleTask,
} from './schedule';
import { localDateOf, localTimeOf } from './time';

// Newfoundland: UTC−2:30 until the clocks go back on Sun Nov 1, 2026 at 2:00 am, then UTC−3:30.
const NL = 'America/St_Johns';

// Wed Oct 28, 12:00 noon in St John's (summer time).
const NOW = new Date('2026-10-28T14:30:00Z');

const profile = (changes: Partial<ScheduleProfile> = {}): ScheduleProfile => ({
  timezone: NL,
  hard_things: [],
  plan_time: '20:30',
  quiet_start: '23:00',
  quiet_end: '08:00',
  start_nudges: true,
  extra_reminders: false,
  paused_until: null,
  ...changes,
});

// A planned 25-minute task. start_at is the UTC instant, as Supabase returns it.
const task = (changes: Partial<ScheduleTask> & Pick<ScheduleTask, 'id' | 'start_at'>): ScheduleTask => ({
  title: 'Read ch. 3',
  plan_date: '2026-10-28',
  duration_min: 25,
  status: 'planned',
  tip: null,
  cue: null,
  if_then: null,
  started_at: null,
  ...changes,
});

// Wed Oct 28, 7:00 pm in St John's.
const SEVEN_PM = '2026-10-28T21:30:00Z';

const withoutPlan = (list: Planned[]) => list.filter((n) => n.kind !== 'plan');
const brief = (list: Planned[]) => list.map((n) => [n.kind, n.at.toISOString()]);

describe('buildSchedule: one planned task (PRODUCT.md §8, RULES.md §7)', () => {
  test('a start nudge at the start time and a check-in 5 minutes after the end', () => {
    const list = withoutPlan(buildSchedule(NOW, profile(), [task({ id: 't1', start_at: SEVEN_PM })]));
    expect(list).toEqual([
      {
        at: new Date('2026-10-28T21:30:00Z'),
        kind: 'start',
        taskIds: ['t1'],
        title: 'Starting now?',
        body: 'Read ch. 3 · 25 min',
        url: '/start/t1',
      },
      {
        at: new Date('2026-10-28T22:00:00Z'), // 7:30 pm
        kind: 'checkin',
        taskIds: ['t1'],
        title: 'How did it go?',
        body: 'Did you get to Read ch. 3?',
        url: '/checkin/t1',
      },
    ]);
  });

  test('"Losing track of time" moves the check-in to the planned end (+0)', () => {
    const list = withoutPlan(
      buildSchedule(NOW, profile({ hard_things: ['time'] }), [task({ id: 't1', start_at: SEVEN_PM })]),
    );
    expect(brief(list)).toEqual([
      ['start', '2026-10-28T21:30:00.000Z'],
      ['checkin', '2026-10-28T21:55:00.000Z'],
    ]);
  });

  test('extra reminders add a heads-up 10 minutes before and a follow-up 10 minutes after', () => {
    const list = withoutPlan(
      buildSchedule(NOW, profile({ extra_reminders: true }), [task({ id: 't1', start_at: SEVEN_PM })]),
    );
    expect(brief(list)).toEqual([
      ['heads_up', '2026-10-28T21:20:00.000Z'],
      ['start', '2026-10-28T21:30:00.000Z'],
      ['follow_up', '2026-10-28T21:40:00.000Z'],
      ['checkin', '2026-10-28T22:00:00.000Z'],
    ]);
    expect(list[0]).toMatchObject({ title: 'In 10 minutes', body: 'Read ch. 3', url: '/start/t1' });
    expect(list[2]).toMatchObject({ title: 'Still on?', body: 'Read ch. 3. Even 5 minutes counts.', url: '/start/t1' });
  });

  test('start nudges switched off leave the check-in', () => {
    const list = withoutPlan(
      buildSchedule(NOW, profile({ start_nudges: false }), [task({ id: 't1', start_at: SEVEN_PM })]),
    );
    expect(brief(list)).toEqual([['checkin', '2026-10-28T22:00:00.000Z']]);
  });

  test('anything already in the past is dropped', () => {
    const fiveAfterSeven = new Date('2026-10-28T21:35:00Z');
    const list = withoutPlan(
      buildSchedule(fiveAfterSeven, profile({ extra_reminders: true }), [task({ id: 't1', start_at: SEVEN_PM })]),
    );
    expect(brief(list)).toEqual([
      ['follow_up', '2026-10-28T21:40:00.000Z'],
      ['checkin', '2026-10-28T22:00:00.000Z'],
    ]);
  });

  test('only looks 48 hours ahead', () => {
    const tasks = [
      task({ id: 'in', start_at: '2026-10-30T14:00:00Z' }), // Fri 11:30 am: start is inside
      task({ id: 'out', start_at: '2026-10-31T21:30:00Z' }), // Sat 7:00 pm: 3 days out
    ];
    const list = withoutPlan(buildSchedule(NOW, profile(), tasks));
    expect(list.map((n) => n.taskIds[0])).toEqual(['in', 'in']);
    expect(brief(list)).toEqual([
      ['start', '2026-10-30T14:00:00.000Z'],
      ['checkin', '2026-10-30T14:30:00.000Z'], // exactly 48 hours from now: still inside
    ]);
  });
});

describe('buildSchedule: tasks in other states', () => {
  test('a started task gets "Time’s up" when its timer ends, instead of the check-in', () => {
    const started = task({
      id: 't1',
      start_at: SEVEN_PM,
      status: 'started',
      started_at: '2026-10-28T21:40:00Z', // Start tapped at 7:10 pm
    });
    expect(withoutPlan(buildSchedule(NOW, profile({ extra_reminders: true }), [started]))).toEqual([
      {
        at: new Date('2026-10-28T22:05:00Z'),
        kind: 'timer',
        taskIds: ['t1'],
        title: 'Time’s up',
        body: 'How did Read ch. 3 go?',
        url: '/checkin/t1',
      },
    ]);
  });

  test('a started task with no start time recorded counts from its planned start', () => {
    const started = task({ id: 't1', start_at: SEVEN_PM, status: 'started' });
    expect(brief(withoutPlan(buildSchedule(NOW, profile(), [started])))).toEqual([
      ['timer', '2026-10-28T21:55:00.000Z'],
    ]);
  });

  test('answered tasks, and tasks left unanswered, get nothing', () => {
    const tasks = (['done', 'partly', 'not_yet', 'unanswered'] as const).map((status, i) =>
      task({ id: `t${i}`, start_at: SEVEN_PM, status }),
    );
    expect(withoutPlan(buildSchedule(NOW, profile({ extra_reminders: true }), tasks))).toEqual([]);
  });
});

describe('buildSchedule: the start nudge’s second line (RULES.md §5.1, §7)', () => {
  const bodyFor = (changes: Partial<ScheduleTask>, hard: ScheduleProfile['hard_things'] = []) =>
    withoutPlan(
      buildSchedule(NOW, profile({ hard_things: hard }), [task({ id: 't1', start_at: SEVEN_PM, ...changes })]),
    )[0].body;

  test('the tips set by the distraction fixes', () => {
    expect(bodyFor({ tip: 'phone_away' })).toBe('Read ch. 3 · 25 min\nPhone in your bag for this one?');
    expect(bodyFor({ tip: 'focus_or_move' })).toBe('Read ch. 3 · 25 min\nFocus mode on, or somewhere new?');
  });

  test('a routine cue', () => {
    expect(bodyFor({ cue: 'supper' })).toBe('Read ch. 3 · 25 min\nAfter supper — time to start.');
  });

  test('the student’s own if-then plan comes first', () => {
    const ifThen = 'If I get home from class, then I’ll open my notes right away.';
    expect(bodyFor({ if_then: ifThen, cue: 'supper', tip: 'phone_away' })).toBe(`Read ch. 3 · 25 min\n${ifThen}`);
  });

  test('"Getting started" adds its line when nothing else applies', () => {
    expect(bodyFor({}, ['starting'])).toBe('Read ch. 3 · 25 min\nJust the first few minutes.');
    expect(bodyFor({ tip: 'phone_away' }, ['starting'])).toBe('Read ch. 3 · 25 min\nPhone in your bag for this one?');
  });

  test('blank text counts as none', () => {
    expect(bodyFor({ if_then: '  ', cue: 'supper' })).toBe('Read ch. 3 · 25 min\nAfter supper — time to start.');
    expect(bodyFor({ cue: '' })).toBe('Read ch. 3 · 25 min');
  });
});

describe('buildSchedule: grouping and the daily cap', () => {
  test('tasks starting in the same minute share one start nudge that opens Today', () => {
    const tasks = [
      task({ id: 'a', start_at: SEVEN_PM }),
      task({ id: 'b', start_at: SEVEN_PM, title: 'Essay outline', duration_min: 50 }),
    ];
    const list = withoutPlan(buildSchedule(NOW, profile(), tasks));
    expect(list).toEqual([
      {
        at: new Date(SEVEN_PM),
        kind: 'start',
        taskIds: ['a', 'b'],
        title: 'Starting now?',
        body: '2 things planned for now',
        url: '/',
      },
      expect.objectContaining({ kind: 'checkin', taskIds: ['a'], at: new Date('2026-10-28T22:00:00Z') }),
      expect.objectContaining({ kind: 'checkin', taskIds: ['b'], at: new Date('2026-10-28T22:25:00Z') }),
    ]);
  });

  test('never more than 8 in a local day: follow-ups go first, then heads-ups', () => {
    // Thu Oct 29 at 9:00 am, 1:00 pm and 5:00 pm, with extra reminders on: 12 task notifications
    // plus that evening's plan reminder.
    const tasks = ['11:30', '15:30', '19:30'].map((utcTime, i) =>
      task({ id: `t${i}`, plan_date: '2026-10-29', start_at: `2026-10-29T${utcTime}:00Z` }),
    );
    const list = buildSchedule(NOW, profile({ extra_reminders: true }), tasks);
    const thursday = list.filter((n) => localDateOf(n.at, NL) === '2026-10-29');
    expect(thursday).toHaveLength(MAX_PER_DAY);
    expect(thursday.map((n) => [n.kind, localTimeOf(n.at, NL)])).toEqual([
      ['heads_up', '08:50'], // the earliest heads-up stays
      ['start', '09:00'],
      ['checkin', '09:30'],
      ['start', '13:00'],
      ['checkin', '13:30'],
      ['start', '17:00'],
      ['checkin', '17:30'],
      ['plan', '20:30'],
    ]);
  });
});

describe('buildSchedule: quiet hours and breaks', () => {
  test('nothing inside quiet hours, including the part after midnight', () => {
    const tasks = [
      // Wed 10:50 pm for 10 minutes: the start is just before 11 pm, the check-in (11:05 pm) isn't.
      task({ id: 'late', start_at: '2026-10-29T01:20:00Z', duration_min: 10 }),
      // Thu 7:30 am: the start is in quiet hours, the check-in at 8:00 am isn't (the end is excluded).
      task({ id: 'early', plan_date: '2026-10-29', start_at: '2026-10-29T10:00:00Z' }),
    ];
    const list = withoutPlan(buildSchedule(NOW, profile(), tasks));
    expect(list.map((n) => [n.kind, n.taskIds[0], localTimeOf(n.at, NL)])).toEqual([
      ['start', 'late', '22:50'],
      ['checkin', 'early', '08:00'],
    ]);
  });

  test('a plan reminder time inside quiet hours never fires', () => {
    expect(buildSchedule(NOW, profile({ plan_time: '23:30' }), [])).toEqual([]);
  });

  test('a break pauses everything until the day reminders come back', () => {
    const tasks = [
      task({ id: 'today', start_at: SEVEN_PM }),
      task({ id: 'tomorrow', plan_date: '2026-10-29', start_at: '2026-10-29T21:30:00Z' }),
    ];
    const list = buildSchedule(NOW, profile({ paused_until: '2026-10-29' }), tasks);
    expect(list.filter((n) => localDateOf(n.at, NL) === '2026-10-28')).toEqual([]);
    expect(withoutPlan(list).map((n) => [n.kind, n.taskIds[0]])).toEqual([
      ['start', 'tomorrow'],
      ['checkin', 'tomorrow'],
    ]);
    expect(list.filter((n) => n.kind === 'plan').map((n) => localDateOf(n.at, NL))[0]).toBe('2026-10-29');
  });

  test('onBreak: every day before paused_until', () => {
    expect(onBreak('2026-10-28', '2026-10-29')).toBe(true);
    expect(onBreak('2026-10-29', '2026-10-29')).toBe(false);
    expect(onBreak('2026-10-28', null)).toBe(false);
  });
});

describe('buildSchedule: plan reminders (DECISIONS.md, Nov 3)', () => {
  test('an evening time gives "Plan tomorrow?" every day for 14 days, at the same local time', () => {
    const plans = buildSchedule(NOW, profile(), []);
    expect(plans).toHaveLength(PLAN_REMINDER_DAYS);
    expect(plans[0]).toEqual({
      at: new Date('2026-10-28T23:00:00Z'), // tonight, 8:30 pm
      kind: 'plan',
      taskIds: [],
      title: 'Plan tomorrow?',
      body: 'Takes a minute. Pick 1–3 small things.',
      url: '/plan?day=tomorrow',
    });
    expect(plans.map((n) => localTimeOf(n.at, NL)).every((t) => t === '20:30')).toBe(true);
    expect(localDateOf(plans[PLAN_REMINDER_DAYS - 1].at, NL)).toBe('2026-11-10');
  });

  test('the clock change keeps the reminder at 8:30 pm local', () => {
    const plans = buildSchedule(NOW, profile(), []);
    const at = (date: string) => plans.find((n) => localDateOf(n.at, NL) === date)?.at.toISOString();
    expect(at('2026-10-31')).toBe('2026-10-31T23:00:00.000Z'); // Sat, UTC−2:30
    expect(at('2026-11-01')).toBe('2026-11-02T00:00:00.000Z'); // Sun, UTC−3:30
  });

  test('a morning time gives "Plan today?", starting tomorrow once today’s has gone by', () => {
    const plans = buildSchedule(NOW, profile({ plan_time: '08:00' }), []);
    expect(plans).toHaveLength(PLAN_REMINDER_DAYS - 1);
    expect(plans[0]).toMatchObject({
      at: new Date('2026-10-29T10:30:00Z'), // Thu 8:00 am
      title: 'Plan today?',
      url: '/plan?day=today',
    });
  });

  test('skipped when the day it’s about already has a plan', () => {
    const tomorrow = [task({ id: 't1', plan_date: '2026-10-29', start_at: '2026-10-29T21:30:00Z' })];
    const evening = buildSchedule(NOW, profile(), tomorrow).filter((n) => n.kind === 'plan');
    expect(localDateOf(evening[0].at, NL)).toBe('2026-10-29'); // tonight's "Plan tomorrow?" is skipped
    const morning = buildSchedule(NOW, profile({ plan_time: '08:00' }), tomorrow).filter((n) => n.kind === 'plan');
    expect(localDateOf(morning[0].at, NL)).toBe('2026-10-30'); // Thursday's "Plan today?" is skipped
  });
});

describe('buildSchedule: time zones', () => {
  test('quiet hours use winter time after the clock change', () => {
    const satNoon = new Date('2026-10-31T14:30:00Z');
    const tasks = [
      task({ id: 'quiet', plan_date: '2026-11-01', start_at: '2026-11-01T11:00:00Z' }), // Sun 7:30 am
      task({ id: 'fine', plan_date: '2026-11-01', start_at: '2026-11-01T11:30:00Z' }), // Sun 8:00 am
    ];
    const starts = withoutPlan(buildSchedule(satNoon, profile(), tasks)).filter((n) => n.kind === 'start');
    expect(starts.map((n) => n.taskIds[0])).toEqual(['fine']);
  });

  test('gives the same answer whatever time zone the phone is set to', () => {
    const tasks = [task({ id: 't1', start_at: SEVEN_PM })];
    const expected = buildSchedule(NOW, profile({ extra_reminders: true }), tasks);
    const original = Settings.defaultZone;
    try {
      Settings.defaultZone = 'Asia/Kathmandu';
      expect(buildSchedule(NOW, profile({ extra_reminders: true }), tasks)).toEqual(expected);
    } finally {
      Settings.defaultZone = original;
    }
  });

  test('comes out sorted by time whatever order the tasks are in', () => {
    const tasks = [
      task({ id: 'late', start_at: '2026-10-28T22:30:00Z' }),
      task({ id: 'early', start_at: '2026-10-28T19:30:00Z' }),
    ];
    const list = buildSchedule(NOW, profile(), tasks);
    const times = list.map((n) => n.at.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
});
