// Small things remembered on this phone only (never synced), using expo-sqlite's localStorage,
// which is already installed for the Supabase session. Every read can come back empty.
import 'expo-sqlite/localStorage/install';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Losing a convenience flag is fine; the app falls back to defaults.
  }
}

// Per user, so a new anonymous account (after "Delete my data") goes through setup again.
export function hasFinishedOnboarding(userId: string): boolean {
  return read(`ft.onboarded.${userId}`) === '1';
}

export function markOnboardingFinished(userId: string): void {
  write(`ft.onboarded.${userId}`, '1');
}

// The start time the student picked last time (PRODUCT.md S6 default), 'HH:mm'.
export function lastStartTime(): string | null {
  const value = read('ft.lastStartTime');
  return value && /^\d{2}:\d{2}$/.test(value) ? value : null;
}

export function rememberStartTime(time: string): void {
  write('ft.lastStartTime', time);
}

// Once a day at most, "Welcome back" counts as shown (for the welcome_back_shown event).
export function shownToday(key: string, date: string): boolean {
  return read(`ft.shown.${key}`) === date;
}

export function markShownToday(key: string, date: string): void {
  write(`ft.shown.${key}`, date);
}

// After "Delete my data": nothing from the old account stays on the phone.
export function forgetThisPhone(): void {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith('ft.')) localStorage.removeItem(key);
    }
  } catch {
    // Nothing important is lost: these are conveniences only.
  }
}
