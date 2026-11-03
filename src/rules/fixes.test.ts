import { FIXES, FIX_IDS, LADDERS, doubledLength, isFixId, prefixedTitle, withoutPrefixes } from './fixes';

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
