// The root of the app: who's signed in decides which screens exist (Expo Router protected routes,
// docs: router/advanced/protected and authentication). When the status changes, the router moves
// to the first screen that's allowed, so no screen has to navigate by hand after sign-up or setup.
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ConfigProblem } from '../components/ConfigProblem';
import { SessionProvider, useSession } from '../lib/session';
import { supabaseConfig } from '../lib/supabase';

// Keep the splash screen up until we know who's signed in.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

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

function RootNavigator() {
  const { status } = useSession();
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
        <Stack.Screen name="index" />
        <Stack.Screen name="plan" />
      </Stack.Protected>
      {/* Support is always reachable (PRODUCT.md S13). */}
      <Stack.Screen name="support" />
    </Stack>
  );
}
