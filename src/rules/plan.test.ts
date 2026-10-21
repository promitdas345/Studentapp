import {
  ALL_LENGTHS,
  DEFAULT_LENGTH,
  MAX_TASKS_PER_DAY,
  PLAN_LENGTHS,
  PLAN_TOMORROW_FROM,
  TITLE_MAX,
  dailyCap,
  defaultPlanDay,
  defaultStartTime,
  isTeamCode,
  normalizeTesterCode,
  shouldShowTitleTip,
  showPlanTomorrowButton,
  slotsLeft,
  validateTitle,
} from './plan';

// Newfoundland: UTC−2:30 until Sun Nov 1 2026, then UTC−3:30.
const NL = 'America/St_Johns';
const TORONTO = 'America/Toronto';

// Builds a UTC instant from an ISO string, so every test states the exact moment it means.
const utc = (iso: string) => new Date(iso);

// Wed Oct 21 2026 in St John's (UTC−2:30).
const NL_1410 = utc('2026-10-21T16:40:00Z');
const NL_1430 = utc('2026-10-21T17:00:00Z');
const NL_1659 = utc('2026-10-21T19:29:00Z');
const NL_1700 = utc('2026-10-21T19:30:00Z');
const NL_1900 = utc('2026-10-21T21:30:00Z');
const NL_2010 = utc('2026-10-21T22:40:00Z');
const NL_2329 = utc('2026-10-22T01:59:00Z');
const NL_2345 = utc('2026-10-22T02:15:00Z');

describe('constants', () => {
  test('match PRODUCT.md S6 and the database checks', () => {
    expect(MAX_TASKS_PER_DAY).toBe(3);
    expect(PLAN_LENGTHS).toEqual([10, 25, 50]);
    expect(ALL_LENGTHS).toEqual([5, 10, 25, 50, 90]);
    expect(DEFAULT_LENGTH).toBe(25);
    expect(TITLE_MAX).toBe(80);
    expect(PLAN_TOMORROW_FROM).toBe('17:00');
  });

  test('every Plan screen length, and the default, is one the database allows', () => {
    for (const length of PLAN_LENGTHS) expect(ALL_LENGTHS).toContain(length);
    expect(PLAN_LENGTHS).toContain(DEFAULT_LENGTH);
  });
});

describe('dailyCap', () => {
  test('is 3 with no hint', () => {
    expect(dailyCap(null, '2026-11-04')).toBe(3);
  });

  test('is 2 only on the date the "Plan fewer" fix chose', () => {
    const hint = { cap: 2, for_date: '2026-11-04' };
    expect(dailyCap(hint, '2026-11-04')).toBe(2);
    expect(dailyCap(hint, '2026-11-03')).toBe(3);
    expect(dailyCap(hint, '2026-11-05')).toBe(3);
  });

  test('a "Give it more time" hint does not change the cap', () => {
    expect(dailyCap({ double: true, for_date: '2026-11-04' }, '2026-11-04')).toBe(3);
  });

  test('any other cap value is ignored', () => {
    expect(dailyCap({ cap: 1, for_date: '2026-11-04' }, '2026-11-04')).toBe(3);
    expect(dailyCap({ cap: 5, for_date: '2026-11-04' }, '2026-11-04')).toBe(3);
  });
});

describe('slotsLeft', () => {
  test('counts down to 0, so a 4th task is refused', () => {
    expect(slotsLeft(0, 3)).toBe(3);
    expect(slotsLeft(2, 3)).toBe(1);
    expect(slotsLeft(3, 3)).toBe(0);
  });

  test('a lighter day of 2 is full at 2', () => {
    expect(slotsLeft(1, 2)).toBe(1);
    expect(slotsLeft(2, 2)).toBe(0);
  });

  test('is never negative, e.g. 3 tasks already planned on a day capped at 2', () => {
    expect(slotsLeft(3, 2)).toBe(0);
    expect(slotsLeft(5, 3)).toBe(0);
  });
});

describe('defaultPlanDay', () => {
  test('is Today at 4:59 pm and Tomorrow at 5:00 pm in St John’s (summer time)', () => {
    expect(defaultPlanDay(NL_1659, NL)).toBe('today');
    expect(defaultPlanDay(NL_1700, NL)).toBe('tomorrow');
  });

  test('uses the half-hour winter offset after the clocks go back', () => {
    // Tue Dec 1 2026, St John's is UTC−3:30.
    expect(defaultPlanDay(utc('2026-12-01T20:29:00Z'), NL)).toBe('today');
    expect(defaultPlanDay(utc('2026-12-01T20:30:00Z'), NL)).toBe('tomorrow');
  });

  test('goes by the student’s clock, not UTC', () => {
    // The same moment is 5:00 pm in St John's but 3:30 pm in Toronto.
    expect(defaultPlanDay(NL_1700, TORONTO)).toBe('today');
  });

  test('is Today again just after midnight', () => {
    expect(defaultPlanDay(utc('2026-10-22T03:00:00Z'), NL)).toBe('today'); // 12:30 am
  });
});

describe('defaultStartTime', () => {
  describe('today', () => {
    test('uses the last-used time when it is still ahead', () => {
      expect(defaultStartTime({ day: 'today', now: NL_1410, tz: NL, lastUsed: '19:00' })).toBe('19:00');
    });

    test('skips a last-used time that has already gone by and uses the next half hour', () => {
      expect(defaultStartTime({ day: 'today', now: NL_2010, tz: NL, lastUsed: '19:00' })).toBe('20:30');
    });

    test('skips a last-used time equal to the current minute', () => {
      expect(defaultStartTime({ day: 'today', now: NL_1900, tz: NL, lastUsed: '19:00' })).toBe('19:30');
    });

    test('uses the next half hour with no last-used time', () => {
      expect(defaultStartTime({ day: 'today', now: NL_1410, tz: NL, lastUsed: null })).toBe('14:30');
      expect(defaultStartTime({ day: 'today', now: NL_1430, tz: NL, lastUsed: null })).toBe('15:00');
    });

    test('uses the student’s clock in winter too', () => {
      // 4:10 pm in St John's on Dec 1 (UTC−3:30).
      expect(defaultStartTime({ day: 'today', now: utc('2026-12-01T19:40:00Z'), tz: NL, lastUsed: null })).toBe(
        '16:30',
      );
    });

    test('stays on today at 11:30 pm instead of wrapping past midnight', () => {
      expect(defaultStartTime({ day: 'today', now: NL_2329, tz: NL, lastUsed: null })).toBe('23:30');
      expect(defaultStartTime({ day: 'today', now: NL_2345, tz: NL, lastUsed: null })).toBe('23:30');
      expect(defaultStartTime({ day: 'today', now: NL_2345, tz: NL, lastUsed: '19:00' })).toBe('23:30');
    });
  });

  describe('tomorrow', () => {
    test('uses the last-used time, even one earlier than now', () => {
      expect(defaultStartTime({ day: 'tomorrow', now: NL_2010, tz: NL, lastUsed: '08:30' })).toBe('08:30');
    });

    test('falls back to 7:00 pm with no last-used time', () => {
      expect(defaultStartTime({ day: 'tomorrow', now: NL_2010, tz: NL, lastUsed: null })).toBe('19:00');
    });
  });

  test('drops seconds from a time read back from Postgres', () => {
    expect(defaultStartTime({ day: 'tomorrow', now: NL_2010, tz: NL, lastUsed: '08:30:00' })).toBe('08:30');
    expect(defaultStartTime({ day: 'today', now: NL_1410, tz: NL, lastUsed: '19:00:00' })).toBe('19:00');
  });

  test('treats a malformed last-used time as not set', () => {
    expect(defaultStartTime({ day: 'tomorrow', now: NL_2010, tz: NL, lastUsed: '7pm' })).toBe('19:00');
    expect(defaultStartTime({ day: 'today', now: NL_1410, tz: NL, lastUsed: '25:00' })).toBe('14:30');
  });
});

describe('validateTitle', () => {
  test('trims and collapses spaces and line breaks', () => {
    expect(validateTitle('  10   practice\nquestions  ')).toEqual({ ok: true, title: '10 practice questions' });
  });

  test('refuses an empty or blank title', () => {
    expect(validateTitle('')).toEqual({ ok: false, problem: 'empty' });
    expect(validateTitle('   ')).toEqual({ ok: false, problem: 'empty' });
    expect(validateTitle('\n\t ')).toEqual({ ok: false, problem: 'empty' });
  });

  test('accepts 80 characters and refuses 81', () => {
    const eighty = 'a'.repeat(80);
    expect(validateTitle(eighty)).toEqual({ ok: true, title: eighty });
    expect(validateTitle('a'.repeat(81))).toEqual({ ok: false, problem: 'too_long' });
  });

  test('counts the length after trimming', () => {
    const eighty = 'a'.repeat(80);
    expect(validateTitle(`   ${eighty}   `)).toEqual({ ok: true, title: eighty });
  });

  test('counts characters like Postgres char_length, so an emoji counts as one', () => {
    const title = `${'a'.repeat(79)}📚`; // 81 in JavaScript's .length, 80 in Postgres
    expect(validateTitle(title)).toEqual({ ok: true, title });
    expect(validateTitle(`${title}a`)).toEqual({ ok: false, problem: 'too_long' });
  });

  test('a single character is enough', () => {
    expect(validateTitle(' x ')).toEqual({ ok: true, title: 'x' });
  });
});

describe('shouldShowTitleTip', () => {
  test('shows for 1–2 word titles', () => {
    expect(shouldShowTitleTip('Study chem')).toBe(true);
    expect(shouldShowTitleTip('Chem')).toBe(true);
    expect(shouldShowTitleTip('  Study   chem  ')).toBe(true);
  });

  test('hides for 3 or more words', () => {
    expect(shouldShowTitleTip('10 practice questions')).toBe(false);
    expect(shouldShowTitleTip('Read chapter 3 notes')).toBe(false);
  });

  test('hides while the title is still empty', () => {
    expect(shouldShowTitleTip('')).toBe(false);
    expect(shouldShowTitleTip('   ')).toBe(false);
  });
});

describe('showPlanTomorrowButton', () => {
  test('shows from 5 pm whatever the tasks', () => {
    expect(showPlanTomorrowButton(NL_1700, NL, [])).toBe(true);
    expect(showPlanTomorrowButton(NL_1700, NL, ['planned'])).toBe(true);
  });

  test('4:59 pm vs 5:00 pm in St John’s with a task still to do', () => {
    expect(showPlanTomorrowButton(NL_1659, NL, ['planned'])).toBe(false);
    expect(showPlanTomorrowButton(NL_1700, NL, ['planned'])).toBe(true);
  });

  test('shows before 5 pm once every task today is checked in', () => {
    expect(showPlanTomorrowButton(NL_1410, NL, ['done', 'partly', 'not_yet'])).toBe(true);
    expect(showPlanTomorrowButton(NL_1410, NL, ['not_yet'])).toBe(true);
  });

  test('waits before 5 pm while any task is still planned or started', () => {
    expect(showPlanTomorrowButton(NL_1410, NL, ['done', 'planned'])).toBe(false);
    expect(showPlanTomorrowButton(NL_1410, NL, ['done', 'started'])).toBe(false);
  });

  test('stays hidden before 5 pm with no tasks today', () => {
    expect(showPlanTomorrowButton(NL_1410, NL, [])).toBe(false);
  });
});

describe('normalizeTesterCode', () => {
  test('trims and uppercases', () => {
    expect(normalizeTesterCode(' ft07 ')).toBe('FT07');
    expect(normalizeTesterCode(' team4 ')).toBe('TEAM4');
  });

  test('accepts FT01 to FT99', () => {
    expect(normalizeTesterCode('FT01')).toBe('FT01');
    expect(normalizeTesterCode('FT10')).toBe('FT10');
    expect(normalizeTesterCode('FT99')).toBe('FT99');
  });

  test('refuses FT00 and codes with the wrong number of digits', () => {
    expect(normalizeTesterCode('FT00')).toBeNull();
    expect(normalizeTesterCode('FT100')).toBeNull();
    expect(normalizeTesterCode('FT7')).toBeNull();
  });

  test('accepts TEAM1 to TEAM4 only', () => {
    expect(normalizeTesterCode('TEAM1')).toBe('TEAM1');
    expect(normalizeTesterCode('TEAM2')).toBe('TEAM2');
    expect(normalizeTesterCode('team5')).toBeNull();
    expect(normalizeTesterCode('TEAM0')).toBeNull();
  });

  test('refuses anything else', () => {
    expect(normalizeTesterCode('')).toBeNull();
    expect(normalizeTesterCode('   ')).toBeNull();
    expect(normalizeTesterCode('FT 07')).toBeNull();
    expect(normalizeTesterCode('XFT07')).toBeNull();
    expect(normalizeTesterCode('FT07X')).toBeNull();
    expect(normalizeTesterCode('TEAM')).toBeNull();
  });
});

describe('isTeamCode', () => {
  test('is true for TEAM1–TEAM4 in any case', () => {
    expect(isTeamCode('TEAM1')).toBe(true);
    expect(isTeamCode(' team3 ')).toBe(true);
  });

  test('is false for tester codes and unknown codes', () => {
    expect(isTeamCode('FT07')).toBe(false);
    expect(isTeamCode('TEAM5')).toBe(false);
    expect(isTeamCode('')).toBe(false);
  });
});
