import { Settings } from 'luxon';

import {
  addDays,
  formatTime,
  isBefore,
  isValidTimeZone,
  localDate,
  localDateOf,
  localTimeOf,
  nextHalfHour,
  toInstant,
  weekDates,
  weekStart,
} from './time';

// Newfoundland: UTC−2:30 in summer, UTC−3:30 in winter. In 2026 the clocks
// go forward on Sun Mar 8 at 2:00 am and back on Sun Nov 1 at 2:00 am.
const NL = 'America/St_Johns';
const TORONTO = 'America/Toronto';

// Builds a UTC instant from an ISO string, so every test states the exact moment it means.
const utc = (iso: string) => new Date(iso);

describe('localDate', () => {
  test('St John’s is still on yesterday when UTC has already moved on', () => {
    // 02:00 UTC = 23:30 the evening before in St John's (UTC−2:30).
    expect(localDate(utc('2026-10-21T02:00:00Z'), NL)).toBe('2026-10-20');
    expect(localDate(utc('2026-10-21T02:00:00Z'), 'UTC')).toBe('2026-10-21');
  });

  test('the local day changes at local midnight, not UTC midnight (summer)', () => {
    expect(localDate(utc('2026-10-21T02:29:59.999Z'), NL)).toBe('2026-10-20');
    expect(localDate(utc('2026-10-21T02:30:00Z'), NL)).toBe('2026-10-21');
  });

  test('the local day changes at local midnight, not UTC midnight (winter)', () => {
    expect(localDate(utc('2026-12-01T03:29:00Z'), NL)).toBe('2026-11-30');
    expect(localDate(utc('2026-12-01T03:30:00Z'), NL)).toBe('2026-12-01');
  });

  test('throws on an unknown time zone or an invalid Date', () => {
    expect(() => localDate(utc('2026-10-21T12:00:00Z'), 'Not/AZone')).toThrow(RangeError);
    expect(() => localDate(utc('2026-10-21T12:00:00Z'), 'system')).toThrow(RangeError);
    expect(() => localDate(new Date('nope'), NL)).toThrow(RangeError);
  });
});

describe('addDays', () => {
  test('moves by calendar days across months, years and leap days', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-11-01', -1)).toBe('2026-10-31');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-10-21', 0)).toBe('2026-10-21');
    expect(addDays('2026-10-26', 7)).toBe('2026-11-02');
  });

  test('throws on malformed dates, impossible dates and part days', () => {
    expect(() => addDays('2026-02-30', 1)).toThrow(RangeError);
    expect(() => addDays('2026-1-5', 1)).toThrow(RangeError);
    expect(() => addDays('2026-11-01T00:00', 1)).toThrow(RangeError);
    expect(() => addDays('2026-11-01', 1.5)).toThrow(RangeError);
  });
});

describe('toInstant in St John’s', () => {
  test('uses UTC−2:30 before the Nov 1 clock change and UTC−3:30 after', () => {
    expect(toInstant('2026-10-31', '19:00', NL).toISOString()).toBe('2026-10-31T21:30:00.000Z');
    expect(toInstant('2026-11-01', '19:00', NL).toISOString()).toBe('2026-11-01T22:30:00.000Z');
    expect(toInstant('2026-11-02', '12:00', NL).toISOString()).toBe('2026-11-02T15:30:00.000Z');
  });

  test('planning on Oct 31 for Nov 1 at 7 pm gives the right instant', () => {
    const now = utc('2026-10-31T23:30:00Z'); // Sat Oct 31, 9:00 pm in St John's
    const tomorrow = addDays(localDate(now, NL), 1);
    expect(tomorrow).toBe('2026-11-01');
    const startAt = toInstant(tomorrow, '19:00', NL);
    expect(startAt.toISOString()).toBe('2026-11-01T22:30:00.000Z');
    // And it reads back as 7 pm on Nov 1, not 6 pm or 8 pm.
    expect(localTimeOf(startAt, NL)).toBe('19:00');
    expect(localDateOf(startAt, NL)).toBe('2026-11-01');
  });

  test('fall back, Nov 1: 1:30 am happens twice, and we return the earlier one', () => {
    // Both of these moments show 1:30 am on a St John's clock.
    expect(localTimeOf(utc('2026-11-01T04:00:00Z'), NL)).toBe('01:30'); // first time, UTC−2:30
    expect(localTimeOf(utc('2026-11-01T05:00:00Z'), NL)).toBe('01:30'); // second time, UTC−3:30
    expect(toInstant('2026-11-01', '01:30', NL).toISOString()).toBe('2026-11-01T04:00:00.000Z');
    expect(toInstant('2026-11-01', '01:00', NL).toISOString()).toBe('2026-11-01T03:30:00.000Z');
  });

  test('fall back, Nov 1: times just before and after the repeated hour happen once', () => {
    expect(toInstant('2026-11-01', '00:59', NL).toISOString()).toBe('2026-11-01T03:29:00.000Z');
    expect(toInstant('2026-11-01', '02:00', NL).toISOString()).toBe('2026-11-01T05:30:00.000Z');
  });

  test('spring forward, Mar 8: times in the skipped hour move forward by the gap', () => {
    expect(toInstant('2026-03-08', '01:59', NL).toISOString()).toBe('2026-03-08T05:29:00.000Z');
    // 2:00 to 2:59 don't exist that night: 2:30 becomes 3:30, and 2:00 becomes 3:00.
    expect(toInstant('2026-03-08', '02:30', NL).toISOString()).toBe('2026-03-08T06:00:00.000Z');
    expect(toInstant('2026-03-08', '02:00', NL).toISOString()).toBe('2026-03-08T05:30:00.000Z');
    expect(toInstant('2026-03-08', '03:00', NL).toISOString()).toBe('2026-03-08T05:30:00.000Z');
    expect(localTimeOf(toInstant('2026-03-08', '02:30', NL), NL)).toBe('03:30');
  });

  test('accepts Postgres-style HH:mm:ss and ignores the seconds', () => {
    expect(toInstant('2026-10-31', '20:30:00', NL).toISOString()).toBe('2026-10-31T23:00:00.000Z');
  });

  test('throws on bad input', () => {
    expect(() => toInstant('2026-02-30', '19:00', NL)).toThrow(RangeError);
    expect(() => toInstant('2026-10-31', '24:00', NL)).toThrow(RangeError);
    expect(() => toInstant('2026-10-31', '7:00', NL)).toThrow(RangeError);
    expect(() => toInstant('2026-10-31', '19:00', 'Mars/Base')).toThrow(RangeError);
  });
});

describe('localTimeOf and localDateOf', () => {
  test('read ISO strings from Supabase, with or without an offset (no offset = UTC)', () => {
    expect(localTimeOf('2026-11-01T22:30:00+00:00', NL)).toBe('19:00');
    expect(localTimeOf('2026-11-01T22:30:00.000Z', NL)).toBe('19:00');
    expect(localTimeOf('2026-11-01T19:00:00-03:30', NL)).toBe('19:00');
    expect(localTimeOf('2026-11-01T22:30:00', NL)).toBe('19:00');
  });

  test('a late-evening instant belongs to the local day, not the UTC day', () => {
    // Sun Nov 1, 11:00 pm in St John's is already Monday in UTC.
    expect(localDateOf('2026-11-02T02:30:00Z', NL)).toBe('2026-11-01');
    expect(localTimeOf('2026-11-02T02:30:00Z', NL)).toBe('23:00');
  });

  test('throw on a string that is not an instant', () => {
    expect(() => localTimeOf('tomorrow at 7', NL)).toThrow(RangeError);
    expect(() => localDateOf('', NL)).toThrow(RangeError);
  });
});

describe('formatTime', () => {
  test('uses a 12-hour clock with lower-case am/pm and no leading zero', () => {
    expect(formatTime('19:00')).toBe('7:00 pm');
    expect(formatTime('00:30')).toBe('12:30 am');
    expect(formatTime('12:00')).toBe('12:00 pm');
    expect(formatTime('00:00')).toBe('12:00 am');
    expect(formatTime('11:59')).toBe('11:59 am');
    expect(formatTime('12:01')).toBe('12:01 pm');
    expect(formatTime('23:59')).toBe('11:59 pm');
    expect(formatTime('08:05')).toBe('8:05 am');
    expect(formatTime('20:30:00')).toBe('8:30 pm');
  });

  test('throws on anything that is not HH:mm', () => {
    for (const bad of ['24:00', '19:60', '7:00', '7 pm', '', '19:00 ']) {
      expect(() => formatTime(bad)).toThrow(RangeError);
    }
  });
});

describe('nextHalfHour', () => {
  // Wed Oct 21 2026 in St John's (UTC−2:30): local 19:00 = 21:30 UTC.
  test.each([
    ['18:59', '2026-10-21T21:29:00Z', '19:00'],
    ['18:59:59', '2026-10-21T21:29:59.999Z', '19:00'],
    ['19:00 exactly', '2026-10-21T21:30:00Z', '19:30'],
    ['19:15', '2026-10-21T21:45:00Z', '19:30'],
    ['19:29', '2026-10-21T21:59:00Z', '19:30'],
    ['19:30', '2026-10-21T22:00:00Z', '20:00'],
    ['23:45 (wraps past midnight)', '2026-10-22T02:15:00Z', '00:00'],
  ])('at %s local it is the next boundary strictly after now', (_label, iso, expected) => {
    expect(nextHalfHour(utc(iso), NL)).toBe(expected);
  });

  test('works on local time, not UTC time', () => {
    // 21:45 UTC is 19:15 in St John's but 17:45 in Toronto.
    expect(nextHalfHour(utc('2026-10-21T21:45:00Z'), TORONTO)).toBe('18:00');
  });
});

describe('isBefore', () => {
  // Wed Oct 21 2026 in St John's: local 17:00 = 19:30 UTC.
  test('compares the local clock with a time', () => {
    expect(isBefore(utc('2026-10-21T19:29:00Z'), NL, '17:00')).toBe(true); // 16:59
    expect(isBefore(utc('2026-10-21T19:29:59Z'), NL, '17:00')).toBe(true); // 16:59:59
    expect(isBefore(utc('2026-10-21T19:30:00Z'), NL, '17:00')).toBe(false); // 17:00
    expect(isBefore(utc('2026-10-21T19:31:00Z'), NL, '17:00')).toBe(false); // 17:01
  });

  test('just after local midnight is before everything except 00:00', () => {
    const justAfterMidnight = utc('2026-10-22T02:30:30Z'); // 00:00:30 in St John's
    expect(isBefore(justAfterMidnight, NL, '00:01')).toBe(true);
    expect(isBefore(justAfterMidnight, NL, '00:00')).toBe(false);
  });
});

describe('weekStart and weekDates', () => {
  test('Sunday 23:59 belongs to the week that started the Monday before; Monday 00:00 starts a new week', () => {
    // Sun Oct 25, 11:59 pm and Mon Oct 26, 12:00 am in St John's (UTC−2:30).
    expect(weekStart(utc('2026-10-26T02:29:00Z'), NL)).toBe('2026-10-19');
    expect(weekStart(utc('2026-10-26T02:30:00Z'), NL)).toBe('2026-10-26');
  });

  test('the week of the Nov 1 clock change runs Mon Oct 26 to Sun Nov 1', () => {
    // Sun Nov 1, 11:59 pm in St John's is after the change (UTC−3:30).
    const sundayNight = utc('2026-11-02T03:29:00Z');
    expect(weekStart(sundayNight, NL)).toBe('2026-10-26');
    expect(weekDates(sundayNight, NL)).toEqual([
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ]);
    // Mon Nov 2, 12:00 am starts the next week.
    expect(weekStart(utc('2026-11-02T03:30:00Z'), NL)).toBe('2026-11-02');
    // Just before and after the change itself, it's the same week.
    expect(weekStart(utc('2026-11-01T04:15:00Z'), NL)).toBe('2026-10-26'); // 1:45 am, first time
    expect(weekStart(utc('2026-11-01T05:15:00Z'), NL)).toBe('2026-10-26'); // 1:45 am, second time
  });

  test('uses the local weekday, not the UTC one', () => {
    // Mon Nov 2, 01:00 UTC is still Sunday evening in St John's.
    expect(weekStart(utc('2026-11-02T01:00:00Z'), NL)).toBe('2026-10-26');
    expect(weekStart(utc('2026-11-02T01:00:00Z'), 'UTC')).toBe('2026-11-02');
  });

  test('a week can cross the new year', () => {
    // Thu Dec 31 2026, noon in St John's.
    expect(weekDates(utc('2026-12-31T15:30:00Z'), NL)).toEqual([
      '2026-12-28',
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
    ]);
  });
});

describe('another time zone (Toronto, UTC−4 then UTC−5 from Nov 1)', () => {
  test('the same helpers work for any IANA zone', () => {
    expect(toInstant('2026-10-31', '19:00', TORONTO).toISOString()).toBe('2026-10-31T23:00:00.000Z');
    // 7 pm on Nov 1 in Toronto is already Nov 2 in UTC.
    const nov1At7pm = toInstant('2026-11-01', '19:00', TORONTO);
    expect(nov1At7pm.toISOString()).toBe('2026-11-02T00:00:00.000Z');
    expect(localDateOf(nov1At7pm, TORONTO)).toBe('2026-11-01');
    expect(localDate(nov1At7pm, TORONTO)).toBe('2026-11-01');
    // Toronto's repeated hour: the earlier 1:30 am (UTC−4).
    expect(toInstant('2026-11-01', '01:30', TORONTO).toISOString()).toBe('2026-11-01T05:30:00.000Z');
    // Sun Nov 1, 11:59 pm in Toronto is still the week of Oct 26.
    expect(weekStart(utc('2026-11-02T04:59:00Z'), TORONTO)).toBe('2026-10-26');
    expect(weekStart(utc('2026-11-02T05:00:00Z'), TORONTO)).toBe('2026-11-02');
  });
});

describe('isValidTimeZone', () => {
  test('accepts IANA names and refuses everything else', () => {
    expect(isValidTimeZone(NL)).toBe(true);
    expect(isValidTimeZone(TORONTO)).toBe(true);
    expect(isValidTimeZone('UTC')).toBe(true);
    expect(isValidTimeZone('Not/AZone')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
    // Luxon's words for "the phone's own zone" would make results depend on the phone.
    expect(isValidTimeZone('system')).toBe(false);
    expect(isValidTimeZone('local')).toBe(false);
  });
});

describe('purity', () => {
  const original = { zone: Settings.defaultZone, locale: Settings.defaultLocale };

  afterEach(() => {
    Settings.defaultZone = original.zone;
    Settings.defaultLocale = original.locale;
  });

  test('results don’t depend on the phone’s own time zone or language', () => {
    Settings.defaultZone = 'Asia/Kathmandu'; // UTC+5:45, far from St John's
    Settings.defaultLocale = 'ar-EG'; // uses non-Latin digits by default
    const now = utc('2026-11-02T03:29:00Z');
    expect(localDate(now, NL)).toBe('2026-11-01');
    expect(localTimeOf(now, NL)).toBe('23:59');
    expect(nextHalfHour(now, NL)).toBe('00:00');
    expect(weekStart(now, NL)).toBe('2026-10-26');
    expect(toInstant('2026-11-01', '19:00', NL).toISOString()).toBe('2026-11-01T22:30:00.000Z');
    expect(localTimeOf('2026-11-01T22:30:00', NL)).toBe('19:00');
  });
});
