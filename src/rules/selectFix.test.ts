import type { MissReason } from '../data/types';
import { nextFix, selectFix, type PastFixEvent, type PastMiss } from './selectFix';

// Wed Oct 28, 7:00 pm in St John's.
const NOW = new Date('2026-10-28T21:30:00Z');
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

const miss = (reason: MissReason, days: number): PastMiss => ({ reason, at: daysAgo(days) });
const fixEvent = (
  fix_id: string,
  days: number,
  changes: Partial<PastFixEvent> = {},
): PastFixEvent => ({
  fix_id,
  reason: 'too_big',
  choice: 'used',
  outcome: null,
  created_at: daysAgo(days),
  ...changes,
});

// The miss being fixed now is always in the list (it was just saved).
const pick = (reason: MissReason, misses: PastMiss[] = [], fixEvents: PastFixEvent[] = []) =>
  selectFix({ reason, now: NOW, misses: [miss(reason, 0), ...misses], fixEvents });

describe('selectFix: the RULES.md §4.3 tests', () => {
  test('1. the first too_big gives too_big_1', () => {
    expect(pick('too_big')).toEqual({ fixId: 'too_big_1', workedBefore: false });
  });

  test('2. a second too_big within 14 days gives too_big_2', () => {
    expect(pick('too_big', [miss('too_big', 5)])).toEqual({ fixId: 'too_big_2', workedBefore: false });
  });

  test('3. a third too_big within 14 days gives the if-then builder', () => {
    expect(pick('too_big', [miss('too_big', 5), miss('too_big', 10)]).fixId).toBe('if_then');
  });

  test('4. a too_big 20 days ago doesn’t count (the 14-day window)', () => {
    expect(pick('too_big', [miss('too_big', 20)]).fixId).toBe('too_big_1');
  });

  test('5. a fix that worked comes back with the badge, until it doesn’t work', () => {
    const worked = fixEvent('too_big_1', 6, { outcome: 'worked' });
    expect(pick('too_big', [miss('too_big', 6)], [worked])).toEqual({ fixId: 'too_big_1', workedBefore: true });
    const thenNot = fixEvent('too_big_1', 3, { outcome: 'not_worked' });
    expect(pick('too_big', [miss('too_big', 6)], [worked, thenNot])).toEqual({
      fixId: 'too_big_2', // the normal ladder again: this is the second miss
      workedBefore: false,
    });
  });

  test('6. too_big_1 turned down twice: the first too_big gives too_big_2', () => {
    const turnedDown = [
      fixEvent('too_big_1', 30, { choice: 'dismissed' }),
      fixEvent('too_big_1', 25, { choice: 'other' }),
    ];
    expect(pick('too_big', [], turnedDown).fixId).toBe('too_big_2');
  });

  test('7. both too_big fixes turned down twice gives the if-then builder', () => {
    const turnedDown = ['too_big_1', 'too_big_2'].flatMap((fixId) => [
      fixEvent(fixId, 30, { choice: 'dismissed' }),
      fixEvent(fixId, 25, { choice: 'dismissed' }),
    ]);
    expect(pick('too_big', [], turnedDown).fixId).toBe('if_then');
  });

  test('8. "Something else" gives the if-then builder', () => {
    expect(pick('other')).toEqual({ fixId: 'if_then', workedBefore: false });
  });

  test('9. "Try something else" goes too_big_1 → too_big_2 → if-then → too_big_1', () => {
    expect(nextFix('too_big', 'too_big_1')).toBe('too_big_2');
    expect(nextFix('too_big', 'too_big_2')).toBe('if_then');
    expect(nextFix('too_big', 'if_then')).toBe('too_big_1');
  });
});

describe('selectFix: more cases', () => {
  test('every reason starts at its own step 1', () => {
    expect(pick('forgot').fixId).toBe('forgot_1');
    expect(pick('distracted').fixId).toBe('distracted_1');
    expect(pick('tired').fixId).toBe('tired_1');
    expect(pick('out_of_time').fixId).toBe('out_of_time_1');
  });

  test('misses with other reasons don’t count', () => {
    expect(pick('forgot', [miss('too_big', 2), miss('tired', 3)]).fixId).toBe('forgot_1');
  });

  test('turning a fix down once is not enough to drop it', () => {
    expect(pick('too_big', [], [fixEvent('too_big_1', 10, { choice: 'dismissed' })]).fixId).toBe('too_big_1');
  });

  test('turning it down for another reason doesn’t count', () => {
    const elsewhere = [
      fixEvent('too_big_1', 30, { choice: 'dismissed', reason: 'tired' }),
      fixEvent('too_big_1', 25, { choice: 'dismissed', reason: 'tired' }),
    ];
    expect(pick('too_big', [], elsewhere).fixId).toBe('too_big_1');
  });

  test('with one fix left, a second miss gives the if-then builder', () => {
    const turnedDown = [
      fixEvent('too_big_1', 30, { choice: 'dismissed' }),
      fixEvent('too_big_1', 25, { choice: 'dismissed' }),
    ];
    expect(pick('too_big', [miss('too_big', 4)], turnedDown).fixId).toBe('if_then');
  });

  test('when both fixes worked, the one that worked most recently', () => {
    const events = [
      fixEvent('too_big_1', 9, { outcome: 'worked' }),
      fixEvent('too_big_2', 4, { outcome: 'worked' }),
    ];
    expect(pick('too_big', [], events)).toEqual({ fixId: 'too_big_2', workedBefore: true });
  });

  test('a fix that worked for another reason gets no badge here', () => {
    expect(pick('too_big', [], [fixEvent('too_big_1', 5, { outcome: 'worked', reason: 'tired' })])).toEqual({
      fixId: 'too_big_1',
      workedBefore: false,
    });
  });

  test('a turned-down-twice fix stays dropped, even if it once worked', () => {
    const events = [
      fixEvent('too_big_1', 20, { outcome: 'worked' }),
      fixEvent('too_big_1', 10, { choice: 'dismissed' }),
      fixEvent('too_big_1', 8, { choice: 'other' }),
    ];
    expect(pick('too_big', [], events).fixId).toBe('too_big_2');
  });

  test('"Try something else" for "Something else" stays on the if-then builder', () => {
    expect(nextFix('other', 'if_then')).toBe('if_then');
  });
});
