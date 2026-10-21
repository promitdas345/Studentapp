// Milestone 0 setup check: reads the one test row from Supabase and shows it.
// This screen is replaced by onboarding and Today in Milestone 1.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { en } from '../copy/en';
import { getSupabase, supabaseConfig } from '../lib/supabase';

const copy = en.setupCheck;

type CheckState =
  | { kind: 'loading' }
  | { kind: 'connected'; message: string }
  | { kind: 'noRow' }
  | { kind: 'failed'; detail: string };

async function readHelloRow(): Promise<CheckState> {
  try {
    const { data, error } = await getSupabase().from('hello').select('message').limit(1);
    // PGRST205: the table doesn't exist yet, so the SQL file hasn't been run.
    if (error?.code === 'PGRST205') return { kind: 'noRow' };
    if (error) return { kind: 'failed', detail: error.message };
    if (!data || data.length === 0) return { kind: 'noRow' };
    return { kind: 'connected', message: String(data[0].message) };
  } catch (e) {
    return { kind: 'failed', detail: e instanceof Error ? e.message : String(e) };
  }
}

export default function SetupCheck() {
  const [state, setState] = useState<CheckState>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);

  // Reads the row when the screen opens, and again after each "Try again".
  useEffect(() => {
    if (!supabaseConfig.ok) return;
    let active = true;
    readHelloRow().then((result) => {
      if (active) setState(result);
    });
    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = () => {
    setState({ kind: 'loading' });
    setAttempt((n) => n + 1);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle}</Text>
      <View style={styles.body}>
        {!supabaseConfig.ok ? (
          <Text style={styles.text}>{configProblemText(supabaseConfig.problem)}</Text>
        ) : (
          <Result state={state} onRetry={retry} />
        )}
      </View>
    </SafeAreaView>
  );
}

function configProblemText(problem: 'missing' | 'bad_url' | 'secret_key'): string {
  if (problem === 'secret_key') return copy.secretKey;
  if (problem === 'bad_url') return copy.badUrl;
  return copy.missingEnv;
}

function Result({ state, onRetry }: { state: CheckState; onRetry: () => void }) {
  if (state.kind === 'loading') {
    return (
      <>
        <ActivityIndicator size="large" />
        <Text style={styles.text}>{copy.loading}</Text>
      </>
    );
  }
  if (state.kind === 'connected') {
    return (
      <>
        <Text style={styles.text}>{copy.connected}</Text>
        <Text style={styles.message}>{state.message}</Text>
      </>
    );
  }
  return (
    <>
      <Text style={styles.text}>
        {state.kind === 'noRow' ? copy.noRow : `${copy.readFailed} ${state.detail}`}
      </Text>
      <Pressable style={styles.button} onPress={onRetry} accessibilityRole="button">
        <Text style={styles.buttonText}>{copy.retry}</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, backgroundColor: '#FFFFFF' },
  title: { fontSize: 28, fontWeight: '700', color: '#111111' },
  subtitle: { fontSize: 16, color: '#555555', marginTop: 4 },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  text: { fontSize: 18, color: '#111111', textAlign: 'center' },
  message: { fontSize: 22, fontWeight: '600', color: '#1B6E3A', textAlign: 'center' },
  button: { backgroundColor: '#1F5FBF', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
});
