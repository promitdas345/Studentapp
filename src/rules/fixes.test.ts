import {
  FIXES,
  FIX_IDS,
  LADDERS,
  doubledLength,
  isFixId,
  planHintFor,
  prefixedTitle,
  rescheduleFor,
  withoutPrefixes,
} from './fixes';

describe('the fix ladders (RULES.md §3)', () => {
  test('every reason except "Something else" has two fixes, in order', () => {
    expect(LADDERS).toEqual({
      too_big: ['too_big_1', 'too_big_2'],
      forgot: ['forgot_1', 'forgot_2'],
      distracted: ['distracted_1', 'distracted_2'],
      tired: ['tired_1', 'tired_2'],
      out_of_time: ['out_of_time_1', 'out_of_time_2'],
    });
  });

  test('there are the 10 fixes plus the if-then builder', () => {
    expect(FIX_IDS).toHaveLength(11);
    expect(isFixId('too_big_1')).toBe(true);
    expect(isFixId('if_then')).toBe(true);
    expect(isFixId('nap')).toBe(false);
  });

  test('each main button changes what RULES.md §3 says', () => {
    expect(FIXES.too_big_1).toEqual({ title: 'first_10', length: 10 });
    expect(FIXES.too_big_2).toEqual({ title: 'just_open', length: 5 });
    expect(FIXES.forgot_1).toEqual({ extraReminders: true });
    expect(FIXES.forgot_2).toEqual({ asks: 'routine' });
    expect(FIXES.distracted_1).toEqual({ tip: 'phone_away' });
    expect(FIXES.distracted_2).toEqual({ tip: 'focus_or_move' });
    expect(FIXES.tired_1).toEqual({ asks: 'time' });
    expect(FIXES.tired_2).toEqual({ length: 10 });
    expect(FIXES.out_of_time_1).toEqual({ planHint: 'cap' });
    expect(FIXES.out_of_time_2).toEqual({ length: 'double', planHint: 'double' });
    expect(FIXES.if_then).toEqual({ asks: 'if_then' });
  });
});

describe('doubledLength ("Give it more time")', () => {
  test('10→25, 25→50, 50→90, and 90 stays 90', () => {
    expect(doubledLength(10)).toBe(25);
    expect(doubledLength(25)).toBe(50);
    expect(doubledLength(50)).toBe(90);
    expect(doubledLength(90)).toBe(90);
  });

  test('a 5-minute task doubles to 10', () => {
    expect(doubledLength(5)).toBe(10);
  });
});

describe('fix titles', () => {
  test('a prefix goes on the original title', () => {
    expect(prefixedTitle('First 10 min: ', 'Essay intro')).toBe('First 10 min: Essay intro');
  });

  test('an earlier prefix comes off first', () => {
    expect(prefixedTitle('Just open it: ', 'First 10 min: Essay intro')).toBe('Just open it: Essay intro');
    expect(withoutPrefixes('Rest of: Just open it: Essay')).toBe('Essay');
  });

  test('still fits 80 characters, shortening the old title with "…"', () => {
    const long = 'Ten practice questions from chapter three of the organic chemistry textbook';
    const title = prefixedTitle('First 10 min: ', long);
    expect(Array.from(title)).toHaveLength(80);
    expect(title.startsWith('First 10 min: Ten practice')).toBe(true);
    expect(title.endsWith('…')).toBe(true);
  });

  test('counts emoji as one character, like the database', () => {
    const title = prefixedTitle('Just open it: ', `${'📚'.repeat(66)}`);
    expect(Array.from(title)).toHaveLength(80);
  });
});

describe('rescheduleFor: what Plan opens with (RULES.md §3)', () => {
  const NL = 'America/St_Johns';
  // Missed: "Essay intro", Wed Oct 28 at 7:00 pm for 25 minutes.
  const missed = { title: 'Essay intro', start_at: '2026-10-28T21:30:00Z', duration_min: 25, tip: null };

  test('same title, length and start time for fixes that change none of them', () => {
    for (const fixId of ['forgot_1', 'forgot_2', 'out_of_time_1', 'if_then'] as const) {
      expect(rescheduleFor(fixId, missed, NL)).toEqual({
        title: 'Essay intro',
        time: '19:00',
        length: 25,
        tip: null,
        pickTime: false,
      });
    }
  });

  test('Shrink it and Make it tiny change the title and length', () => {
    expect(rescheduleFor('too_big_1', missed, NL)).toMatchObject({ title: 'First 10 min: Essay intro', length: 10 });
    expect(rescheduleFor('too_big_2', missed, NL)).toMatchObject({ title: 'Just open it: Essay intro', length: 5 });
  });

  test('the distraction fixes set the tip', () => {
    expect(rescheduleFor('distracted_1', missed, NL).tip).toBe('phone_away');
    expect(rescheduleFor('distracted_2', { ...missed, tip: 'phone_away' }, NL).tip).toBe('focus_or_move');
  });

  test('a tip the task already had stays when the fix sets none', () => {
    expect(rescheduleFor('tired_2', { ...missed, tip: 'phone_away' }, NL).tip).toBe('phone_away');
  });

  test('Try a better time opens the time picker; Go shorter makes it 10 minutes', () => {
    expect(rescheduleFor('tired_1', missed, NL).pickTime).toBe(true);
    expect(rescheduleFor('tired_2', missed, NL).length).toBe(10);
  });

  test('Give it more time doubles the length', () => {
    expect(rescheduleFor('out_of_time_2', missed, NL).length).toBe(50);
  });

  test('keeps the start time on the student’s clock across the clock change', () => {
    // Sat Oct 31, 9:00 am summer time → tomorrow (winter time) is still planned for 09:00.
    expect(rescheduleFor('forgot_1', { ...missed, start_at: '2026-10-31T11:30:00Z' }, NL).time).toBe('09:00');
  });
});

describe('planHintFor', () => {
  test('Plan fewer caps tomorrow at 2, Give it more time adds the tip', () => {
    expect(planHintFor('out_of_time_1', '2026-10-29')).toEqual({ cap: 2, for_date: '2026-10-29' });
    expect(planHintFor('out_of_time_2', '2026-10-29')).toEqual({ double: true, for_date: '2026-10-29' });
  });

  test('other fixes leave the hint alone', () => {
    expect(planHintFor('too_big_1', '2026-10-29')).toBeNull();
  });
});
