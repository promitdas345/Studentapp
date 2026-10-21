// S2 What we collect: the plain list, the 18+ checkbox and the tester code (PRODUCT.md S2).
// Nothing is saved anywhere until Start: then we sign in anonymously and create the profile.
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Body, Button, Checkbox, Gap, Notice, Screen, Title, colors } from '../../components/ui';
import { en } from '../../copy/en';
import { toDataError } from '../../data/errors';
import { CONSENT_VERSION, createProfile, fetchMyProfile } from '../../data/profile';
import type { Profile } from '../../data/types';
import { deviceTimeZone } from '../../lib/device';
import { useSession } from '../../lib/session';
import { getSupabase } from '../../lib/supabase';
import { normalizeTesterCode } from '../../rules/plan';

const copy = en.collect;

export default function Collect() {
  const { signedUp } = useSession();
  const [adult, setAdult] = useState(false);
  const [code, setCode] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const start = async () => {
    const testerCode = normalizeTesterCode(code);
    if (!testerCode) {
      setProblem(copy.codeError);
      return;
    }
    setBusy(true);
    setProblem(null);
    try {
      const supabase = getSupabase();
      // Reuse the anonymous account if an earlier Start signed in but couldn't save the profile.
      let session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error || !data.session) throw toDataError(error ?? new Error('No session'));
        session = data.session;
      }
      let profile: Profile;
      try {
        profile = await createProfile({
          tester_code: testerCode,
          timezone: deviceTimeZone(),
          consent_version: CONSENT_VERSION,
          consented_at: new Date().toISOString(),
          age_confirmed: true,
        });
      } catch (error) {
        // 23505 = the profile already exists (the first try saved it but the answer got lost).
        if (toDataError(error).code !== '23505') throw error;
        const existing = await fetchMyProfile();
        if (!existing) throw error;
        profile = existing;
      }
      signedUp(session.user.id, profile);
    } catch (error) {
      setProblem(toDataError(error).kind === 'network' ? en.errors.saveFailed : en.errors.server);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Title>{copy.title}</Title>
      <View style={styles.list}>
        {copy.collected.map((line) => (
          <Text key={line} style={styles.bullet}>
            {`•  ${line}`}
          </Text>
        ))}
      </View>
      <Body>{copy.notCollected}</Body>
      <Body>{copy.notCounselling}</Body>
      <Gap size={4} />
      <Checkbox label={copy.ageCheckbox} checked={adult} onToggle={() => setAdult((v) => !v)} />
      <Text style={styles.label}>{copy.codeLabel}</Text>
      <TextInput
        value={code}
        onChangeText={(text) => {
          setCode(text);
          setProblem(null);
        }}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={8}
        accessibilityLabel={copy.codeLabel}
        style={styles.input}
      />
      {problem ? <Notice>{problem}</Notice> : null}
      <Button
        label={copy.start}
        onPress={start}
        disabled={!adult || code.trim().length === 0 || busy}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 6 },
  bullet: { fontSize: 17, lineHeight: 24, color: colors.text },
  label: { fontSize: 17, fontWeight: '600', color: colors.text },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 20,
    letterSpacing: 2,
    color: colors.text,
  },
});
