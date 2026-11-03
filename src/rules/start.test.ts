import { canSnooze, cardAction, formatLeft, snoozedStart, startPrompt, timerLeftMs } from './start';

// Wed Oct 28, 7:00 pm in St John's.
const SEVEN_PM = '2026-10-28T21:30:00Z';
const at = (iso: string) => new Date(iso);

describe('startPrompt (PRODUCT.md S7)', () => {
  test('"Starting now?" up to 5 minutes after the start, "Start now?" after that', () => {
    expect(startPrompt(SEVEN_PM, at('2026-10-28T21:00:00Z'))).toBe('starting_now'); // early
    expect(startPrompt(SEVEN_PM, at('2026-10-28T21:30:30Z'))).toBe('starting_now'); // opened the nudge
    expect(startPrompt(SEVEN_PM, at('2026-10-28T21:35:00Z'))).toBe('starting_now');
    expect(startPrompt(SEVEN_PM, at('2026-10-28T21:35:01Z'))).toBe('start_now');
    expect(startPrompt(SEVEN_PM, at('2026-10-28T23:00:00Z'))).toBe('start_now');
  });
});

describe('"In 10 min"', () => {
  test('works once, and only before Start', () => {
    expect(canSnooze({ status: 'planned', snoozed: false })).toBe(true);
    expect(canSnooze({ status: 'planned', snoozed: true })).toBe(false);
    expect(canSnooze({ status: 'started', snoozed: false })).toBe(false);
    expect(canSnooze({ status: 'done', snoozed: false })).toBe(false);
  });

  test('moves the start 10 minutes later', () => {
    expect(snoozedStart(SEVEN_PM, at('2026-10-28T21:30:00Z')).toISOString()).toBe('2026-10-28T21:40:00.000Z');
    expect(snoozedStart(SEVEN_PM, at('2026-10-28T21:00:00Z')).toISOString()).toBe('2026-10-28T21:40:00.000Z');
  });

  test('counts from now once the planned start has gone by, rounded up to the minute', () => {
    expect(snoozedStart(SEVEN_PM, at('2026-10-28T21:42:00Z')).toISOString()).toBe('2026-10-28T21:52:00.000Z');
    expect(snoozedStart(SEVEN_PM, at('2026-10-28T21:42:10Z')).toISOString()).toBe('2026-10-28T21:53:00.000Z');
  });
});

describe('the focus timer (PRODUCT.md S8)', () => {
  const started = '2026-10-28T21:40:00Z';

  test('counts down from when Start was tapped', () => {
    expect(timerLeftMs(started, 25, at('2026-10-28T21:40:00Z'))).toBe(25 * 60 * 1000);
    expect(timerLeftMs(started, 25, at('2026-10-28T21:52:26Z'))).toBe(754 * 1000);
  });

  test('stops at zero', () => {
    expect(timerLeftMs(started, 25, at('2026-10-28T22:05:00Z'))).toBe(0);
    expect(timerLeftMs(started, 25, at('2026-10-29T09:00:00Z'))).toBe(0);
  });

  test('shows mm:ss, rounding partial seconds up', () => {
    expect(formatLeft(754 * 1000)).toBe('12:34');
    expect(formatLeft(90 * 60 * 1000)).toBe('90:00');
    expect(formatLeft(500)).toBe('00:01');
    expect(formatLeft(0)).toBe('00:00');
    expect(formatLeft(-5)).toBe('00:00');
  });
});

describe('cardAction: tapping a task on Today', () => {
  const task = (status: Parameters<typeof cardAction>[0]['status']) => ({
    status,
    start_at: SEVEN_PM,
    duration_min: 25,
  });

  test('Start until the planned end, then the check-in', () => {
    expect(cardAction(task('planned'), at('2026-10-28T20:00:00Z'))).toBe('start');
    expect(cardAction(task('planned'), at('2026-10-28T21:54:59Z'))).toBe('start');
    expect(cardAction(task('planned'), at('2026-10-28T21:55:00Z'))).toBe('checkin');
  });

  test('the timer once started; nothing once answered', () => {
    expect(cardAction(task('started'), at('2026-10-28T21:50:00Z'))).toBe('timer');
    for (const status of ['done', 'partly', 'not_yet', 'unanswered'] as const) {
      expect(cardAction(task(status), at('2026-10-28T22:30:00Z'))).toBe('none');
    }
  });
});
