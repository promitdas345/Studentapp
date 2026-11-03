// The root of the app: who's signed in decides which screens exist (Expo Router protected routes,
// docs: router/advanced/protected and authentication). When the status changes, the router moves
// to the first screen that's allowed, so no screen has to navigate by hand after sign-up or setup.
// It also opens the screen a tapped nudge points to, and keeps the phone's nudges up to date.
import { router, Stack, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ConfigProblem } from '../components/ConfigProblem';
import type { Profile } from '../data/types';
import { devWarn } from '../lib/devLog';
import { track } from '../lib/events';
import * as Notifications from '../lib/expoNotifications';
import {
  cancelAllNudges,
  nudgeFromResponse,
  showNudgesInApp,
  syncNotifications,
  type NudgeData,
} from '../lib/notifications';
import { SessionProvider, useSession, type AppStatus } from '../lib/session';
import { supabaseConfig } from '../lib/supabase';

// Keep the splash screen up until we know who's signed in.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

// A nudge that arrives while the app is open still shows (TECH.md §6).
showNudgesInApp();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {supabaseConfig.ok ? (
        <SessionProvider>
          <SplashScreenController />
          <RootNavigator />
        </SessionProvider>
      ) : (
        <ConfigProblemWithSplash problem={supabaseConfig.problem} />
      )}
    </SafeAreaProvider>
  );
}

function SplashScreenController() {
  const { status } = useSession();
  useEffect(() => {
    if (status !== 'loading') SplashScreen.hideAsync().catch(() => undefined);
  }, [status]);
  return null;
}

function ConfigProblemWithSplash({ problem }: { problem: 'missing' | 'bad_url' | 'secret_key' }) {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);
  return <ConfigProblem problem={problem} />;
}

// A tap on a nudge opens its screen (TECH.md §6; expo-notifications docs, "Handle push notifications
// with navigation"). When the tap started the app, we don't know yet who's signed in, so the screen
// opens once Today and the rest exist. That's also why this layout never returns null: a tap
// would be lost.
function useNudgeTaps(status: AppStatus) {
  const pending = useRef<NudgeData | null>(null);
  const ready = useRef(false);

  // A tap from before the student was in opens as soon as they are.
  useEffect(() => {
    ready.current = status === 'ready';
    if (!ready.current || !pending.current) return;
    const nudge = pending.current;
    pending.current = null;
    openNudge(nudge);
  }, [status]);

  useEffect(() => {
    let lastId: string | null = null;
    const open = (response: Notifications.NotificationResponse) => {
      // The tap that started the app can arrive both ways below; open it once.
      const id = response.notification.request.identifier;
      if (id === lastId) return;
      lastId = id;
      const nudge = nudgeFromResponse(response);
      if (!nudge) return;
      if (ready.current) openNudge(nudge);
      else pending.current = nudge;
    };
    try {
      const launch = Notifications.getLastNotificationResponse();
      if (launch) {
        open(launch);
        Notifications.clearLastNotificationResponse();
      }
    } catch (error) {
      devWarn('notifications: launch tap', error);
    }
    try {
      const subscription = Notifications.addNotificationResponseReceivedListener(open);
      return () => subscription.remove();
    } catch (error) {
      devWarn('notifications: taps', error);
      return undefined;
    }
  }, []);
}

function openNudge(nudge: NudgeData) {
  track('nudge_opened', { kind: nudge.kind });
  router.push(nudge.url as Href);
}

// Keeps the phone's nudges matching the plan: once the student is in, whenever the profile changes
// (Settings, fixes), and when the app comes back to the foreground, since the day may have changed.
// Screens that save tasks sync too.
function useNudgeSync(status: AppStatus, profile: Profile | null) {
  useEffect(() => {
    if (status === 'ready' && profile) syncNotifications(profile);
    if (status === 'signedOut') cancelAllNudges();
  }, [status, profile]);

  useEffect(() => {
    if (status !== 'ready' || !profile) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncNotifications(profile);
    });
    return () => subscription.remove();
  }, [status, profile]);
}

function RootNavigator() {
  const { status, profile } = useSession();
  useNudgeTaps(status);
  useNudgeSync(status, profile);
  // Order matters: when the current screen stops being allowed, the router goes to the first allowed one.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === 'loading'}>
        <Stack.Screen name="loading" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'loadFailed'}>
        <Stack.Screen name="offline" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="onboarding/welcome" />
        <Stack.Screen name="onboarding/collect" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'needsSetup'}>
        <Stack.Screen name="onboarding/setup" />
        <Stack.Screen name="onboarding/reminders" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'ready'}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="plan" />
        <Stack.Screen name="start/[taskId]" />
        <Stack.Screen name="timer/[taskId]" />
        <Stack.Screen name="checkin/[taskId]" />
        <Stack.Screen name="fix/[taskId]" />
        <Stack.Screen name="collect-info" />
      </Stack.Protected>
      {/* Support is always reachable (PRODUCT.md S13). */}
      <Stack.Screen name="support" />
    </Stack>
  );
}
