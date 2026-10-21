// Who's using the app and how far through onboarding they are. The root layout uses `status`
// to decide which screens exist (Expo Router protected routes, docs: router/advanced/protected).
//   signedOut  → Welcome, What we collect
//   needsSetup → Setup, Reminders
//   ready      → Today, Plan
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { fetchMyProfile, updateMyProfile } from '../data/profile';
import type { Profile } from '../data/types';
import { deviceTimeZone } from './device';
import { track } from './events';
import { hasFinishedOnboarding, markOnboardingFinished } from './flags';
import { getSupabase } from './supabase';

export type AppStatus = 'loading' | 'loadFailed' | 'signedOut' | 'needsSetup' | 'ready';

type Session = {
  status: AppStatus;
  userId: string | null;
  profile: Profile | null;
  // Called by "What we collect" once the anonymous sign-in and the profile row both worked.
  signedUp: (userId: string, profile: Profile) => void;
  setProfile: (profile: Profile) => void;
  finishOnboarding: () => void;
  retry: () => void;
  // A one-off message for Today, like "You're set. We'll nudge you at 7:00 pm."
  flash: string | null;
  showFlash: (text: string) => void;
  clearFlash: () => void;
};

const SessionContext = createContext<Session | null>(null);

export function useSession(): Session {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AppStatus>('loading');
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const profileRef = useRef<Profile | null>(null);

  const setProfile = useCallback((next: Profile) => {
    profileRef.current = next;
    setProfileState(next);
  }, []);

  // Stable functions, because screens use them in effect dependencies.
  const clearFlash = useCallback(() => setFlash(null), []);

  // Keep the profile's time zone matching the phone (PRODUCT.md §9: travel).
  const syncTimeZone = useCallback(
    async (current: Profile) => {
      const tz = deviceTimeZone();
      if (tz === current.timezone) return;
      try {
        setProfile(await updateMyProfile(current.user_id, { timezone: tz }));
      } catch {
        // Try again next time the app opens.
      }
    },
    [setProfile],
  );

  // Work out where the user is when the app starts (and after "Try again").
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await getSupabase().auth.getSession();
        const session = data.session;
        if (!session) {
          if (active) setStatus('signedOut');
          return;
        }
        const loaded = await fetchMyProfile();
        if (!active) return;
        setUserId(session.user.id);
        if (!loaded) {
          // Signed in, but the profile was never saved: show "What we collect" again.
          setStatus('signedOut');
          return;
        }
        setProfile(loaded);
        setStatus(hasFinishedOnboarding(session.user.id) ? 'ready' : 'needsSetup');
        track('app_open');
        syncTimeZone(loaded);
      } catch {
        if (active) setStatus('loadFailed');
      }
    })();
    return () => {
      active = false;
    };
  }, [attempt, setProfile, syncTimeZone]);

  // Signing out (Delete my data, in Milestone 4) sends the user back to Welcome.
  useEffect(() => {
    const { data } = getSupabase().auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        profileRef.current = null;
        setProfileState(null);
        setUserId(null);
        setStatus('signedOut');
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Re-check the time zone whenever the app comes back to the foreground.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && profileRef.current) syncTimeZone(profileRef.current);
    });
    return () => subscription.remove();
  }, [syncTimeZone]);

  const value = useMemo<Session>(
    () => ({
      status,
      userId,
      profile,
      signedUp: (id, created) => {
        setUserId(id);
        setProfile(created);
        setStatus('needsSetup');
      },
      setProfile,
      finishOnboarding: () => {
        if (!userId) return;
        markOnboardingFinished(userId);
        track('onboarding_done');
        setStatus('ready');
      },
      retry: () => {
        setStatus('loading');
        setAttempt((n) => n + 1);
      },
      flash,
      showFlash: setFlash,
      clearFlash,
    }),
    [status, userId, profile, setProfile, flash, clearFlash],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
