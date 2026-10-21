// Things we read from the phone itself. Not pure, so it's kept apart from src/lib/time.ts.
import { getCalendars } from 'expo-localization';
import { IANAZone } from 'luxon';

// Used only if the phone reports nothing usable. Our first users are in Newfoundland.
const FALLBACK_TIME_ZONE = 'America/St_Johns';

// The phone's IANA time zone, e.g. 'America/St_Johns'. expo-localization can return null
// (docs: SDK 57 localization), and on iOS the value stays the same while the app runs.
export function deviceTimeZone(): string {
  const fromCalendar = getCalendars()[0]?.timeZone ?? null;
  if (fromCalendar && IANAZone.isValidZone(fromCalendar)) return fromCalendar;
  const fromIntl = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (fromIntl && IANAZone.isValidZone(fromIntl)) return fromIntl;
  return FALLBACK_TIME_ZONE;
}
