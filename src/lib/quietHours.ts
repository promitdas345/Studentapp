// Quiet hours (default 23:00–08:00): no reminders inside them (PRODUCT.md §8, TECH.md §4).
// The start time is inside quiet hours and the end time isn't (23:00 ≤ t < 08:00).
// Pure: times are local 'HH:mm' strings, which compare correctly as text.

export function isInQuietHours(time: string, quietStart: string, quietEnd: string): boolean {
  if (quietStart === quietEnd) return false;
  if (quietStart < quietEnd) return time >= quietStart && time < quietEnd;
  // Quiet hours that cross midnight, like 23:00–08:00.
  return time >= quietStart || time < quietEnd;
}

// The plan-reminder picker may not choose a time inside quiet hours (TECH.md §4).
// Times in the evening part move back to 30 minutes before quiet hours start;
// times after midnight move forward to when quiet hours end.
export function outsideQuietHours(time: string, quietStart: string, quietEnd: string): string {
  if (!isInQuietHours(time, quietStart, quietEnd)) return time;
  const crossesMidnight = quietStart > quietEnd;
  if (crossesMidnight && time >= quietStart) return minusThirty(quietStart);
  return quietEnd;
}

function minusThirty(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const total = (hours * 60 + minutes - 30 + 24 * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
