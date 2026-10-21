// Shown instead of the app when .env is missing or wrong, so the fix is spelled out on the phone.
import { StyleSheet, View } from 'react-native';

import { en } from '../copy/en';
import type { SupabaseConfig } from '../lib/env';
import { Body, Screen, Title } from './ui';

type Problem = Extract<SupabaseConfig, { ok: false }>['problem'];

const MESSAGES: Record<Problem, string> = {
  missing: en.configProblem.missingEnv,
  bad_url: en.configProblem.badUrl,
  secret_key: en.configProblem.secretKey,
};

export function ConfigProblem({ problem }: { problem: Problem }) {
  return (
    <Screen scroll={false}>
      <Title>{en.appName}</Title>
      <View style={styles.middle}>
        <Body>{MESSAGES[problem]}</Body>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  middle: { flex: 1, justifyContent: 'center' },
});
