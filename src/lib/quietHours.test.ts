import { isInQuietHours, outsideQuietHours } from './quietHours';

describe('isInQuietHours (default 23:00–08:00)', () => {
  test('includes the start and excludes the end', () => {
    expect(isInQuietHours('23:00', '23:00', '08:00')).toBe(true);
    expect(isInQuietHours('08:00', '23:00', '08:00')).toBe(false);
  });

  test('covers the hours after midnight', () => {
    expect(isInQuietHours('00:30', '23:00', '08:00')).toBe(true);
    expect(isInQuietHours('07:59', '23:00', '08:00')).toBe(true);
  });

  test('daytime and evening are outside', () => {
    expect(isInQuietHours('20:30', '23:00', '08:00')).toBe(false);
    expect(isInQuietHours('22:59', '23:00', '08:00')).toBe(false);
  });

  test('works for quiet hours that do not cross midnight', () => {
    expect(isInQuietHours('13:00', '12:00', '14:00')).toBe(true);
    expect(isInQuietHours('14:00', '12:00', '14:00')).toBe(false);
  });

  test('equal start and end means no quiet hours', () => {
    expect(isInQuietHours('03:00', '08:00', '08:00')).toBe(false);
  });
});

describe('outsideQuietHours', () => {
  test('keeps allowed times', () => {
    expect(outsideQuietHours('20:30', '23:00', '08:00')).toBe('20:30');
    expect(outsideQuietHours('08:00', '23:00', '08:00')).toBe('08:00');
  });

  test('moves late-evening times back before quiet hours', () => {
    expect(outsideQuietHours('23:30', '23:00', '08:00')).toBe('22:30');
    expect(outsideQuietHours('23:00', '23:00', '08:00')).toBe('22:30');
  });

  test('moves after-midnight times forward to the end of quiet hours', () => {
    expect(outsideQuietHours('06:00', '23:00', '08:00')).toBe('08:00');
    expect(outsideQuietHours('00:15', '23:00', '08:00')).toBe('08:00');
  });
});
