import type { FixEvent } from '../data/types';
import { outcomeUpdates, type CheckInAnswer } from './outcomes';

// Thu Oct 29, 7:30 pm in St John's: the check-in for the task a fix created yesterday.
const NOW = new Date('2026-10-29T22:00:00Z');
const FIX_SHOWN = '2026-10-28T22:05:00Z'; // Wed 7:35 pm
const NEW_TASK_START = '2026-10-29T21:30:00Z'; // Thu 7:00 pm

type Event = Pick<FixEvent, 'id' | 'choice' | 'outcome' | 'created_at'>;
const event = (changes: Partial<Event> = {}): Event => ({
  id: 'fix1',
  choice: 'used',
  outcome: null,
  created_at: FIX_SHOWN,
  ...changes,
});

const run = (
  answer: CheckInAnswer,
  options: { events?: Event[]; start_at?: string; from_fix_event?: string | null; now?: Date } = {},
) =>
  outcomeUpdates({
    task: {
      id: 'task2',
      start_at: options.start_at ?? NEW_TASK_START,
      // `in`, not ??, so a test can pass null on purpose.
      from_fix_event: 'from_fix_event' in options ? (options.from_fix_event ?? null) : 'fix1',
    },
    answer,
    now: options.now ?? NOW,
    fixEvents: options.events ?? [event()],
  });

describe('outcomeUpdates: RULES.md §4.3 test 10', () => {
  test('Done means the fix worked', () => {
    expect(run('done')).toEqual([{ fixEventId: 'fix1', outcome: 'worked', outcome_task_id: 'task2' }]);
  });

  test('Partly means it worked too (partly is never a miss)', () => {
    expect(run('partly')).toEqual([{ fixEventId: 'fix1', outcome: 'worked', outcome_task_id: 'task2' }]);
  });

  test('Not yet means it didn’t work', () => {
    expect(run('not_yet')).toEqual([{ fixEventId: 'fix1', outcome: 'not_worked', outcome_task_id: 'task2' }]);
  });

  test('a task that started before the fix was shown changes nothing', () => {
    expect(run('done', { start_at: '2026-10-28T21:30:00Z' })).toEqual([]);
  });

  test('no check-in within 3 days: the outcome stays empty', () => {
    expect(run('done', { now: new Date('2026-11-01T03:00:00Z') })).toEqual([]);
  });

  test('a dismissed fix never gets an outcome', () => {
    expect(run('done', { events: [event({ choice: 'dismissed' })] })).toEqual([]);
    expect(run('done', { events: [event({ choice: 'other' })] })).toEqual([]);
    expect(run('done', { events: [event({ choice: null })] })).toEqual([]);
  });
});

describe('outcomeUpdates: only the task the fix created counts (DECISIONS.md, Nov 3)', () => {
  test('a task with no fix behind it changes nothing', () => {
    expect(run('done', { from_fix_event: null })).toEqual([]);
  });

  test('other fixes waiting for an outcome are left alone', () => {
    const other = event({ id: 'fix0', created_at: '2026-10-28T12:00:00Z' });
    expect(run('done', { events: [other, event()] })).toEqual([
      { fixEventId: 'fix1', outcome: 'worked', outcome_task_id: 'task2' },
    ]);
  });

  test('"Make my own plan" is judged the same way', () => {
    expect(run('not_yet', { events: [event({ choice: 'own_plan' })] })).toEqual([
      { fixEventId: 'fix1', outcome: 'not_worked', outcome_task_id: 'task2' },
    ]);
  });

  test('an outcome is only set once', () => {
    expect(run('not_yet', { events: [event({ outcome: 'worked' })] })).toEqual([]);
  });
});
