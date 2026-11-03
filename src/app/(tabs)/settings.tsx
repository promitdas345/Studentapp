// S12 Settings (PRODUCT.md S12). Every change saves right away and updates the profile, which
// re-syncs the nudges (src/app/_layout.tsx). The event says which setting changed, never its value.
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, StyleSheet, Switch, Text, View } from 'react-native';

import { TimeField } from '../../components/TimeField';
import { Body, Button, Chip, Heading, Notice, Row, Screen, Title, colors } from '../../components/ui';
import { en, fill } from '../../copy/en';
import { deleteMyData } from '../../data/account';
import { saveProblem } from '../../data/errors';
import { updateMyProfile } from '../../data/profile';
import type { HardThing, ProfileChanges } from '../../data/types';
import { devWarn } from '../../lib/devLog';
import { track, type SettingKey } from '../../lib/events';
import { forgetThisPhone } from '../../lib/flags';
import { FEEDBACK_EMAIL, PRIVACY_URL } from '../../lib/links';
import { cancelAllNudges } from '../../lib/notifications';
import { outsideQuietHours } from '../../lib/quietHours';
import { onBreak } from '../../lib/schedule';
import { useSession } from '../../lib/session';
import { getSupabase } from '../../lib/supabase';
import { addDays, formatDate, localDate } from '../../lib/time';

const copy = en.settings;
const HARD_THINGS: HardThing[] = ['starting', 'time', 'forgetting', 'distraction'];
const GOALS = [3, 4, 5, 7];
const BREAK_DAYS = [1, 3, 7] as const;
// Same defaults as Setup (PRODUCT.md S3).
const PLAN_TIME = { evening: '20:30', morning: '08:00' } as const;

export default function Settings() {
  const { profile, setProfile } = useSession();
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  if (!profile) return null;

  const today = localDate(new Date(), profile.timezone);
  const privacyUrl = PRIVACY_URL;
  const feedbackEmail = FEEDBACK_EMAIL;
  const morning = profile.plan_time < '12:00';
  const breakOn = onBreak(today, profile.paused_until);

  const save = async (key: SettingKey, changes: ProfileChanges) => {
    setSaving(true);
    setProblem(null);
    try {
      setProfile(await updateMyProfile(profile.user_id, changes));
      track('settings_changed', { key });
    } catch (error) {
      setProblem(saveProblem(error));
    } finally {
      setSaving(false);
    }
  };

  const toggleHard = (thing: HardThing) => {
    const adding = !profile.hard_things.includes(thing);
    const next = adding ? [...profile.hard_things, thing] : profile.hard_things.filter((t) => t !== thing);
    // Picking "Forgetting what I planned" turns on the extra reminders (RULES.md §5.1).
    save('hard_things', { hard_things: next, ...(adding && thing === 'forgetting' ? { extra_reminders: true } : {}) });
  };

  // The plan reminder never goes inside quiet hours (TECH.md §4), so new quiet hours can move it.
  const saveQuietHours = (start: string, end: string) =>
    save('quiet_hours', {
      quiet_start: start,
      quiet_end: end,
      plan_time: outsideQuietHours(profile.plan_time, start, end),
    });

  const deleteEverything = async () => {
    setSaving(true);
    setProblem(null);
    try {
      await cancelAllNudges();
      await deleteMyData(profile.user_id);
      forgetThisPhone();
      Alert.alert(copy.deleted, undefined, [{ text: copy.ok, onPress: signOut }], { cancelable: false });
    } catch (error) {
      setProblem(saveProblem(error));
      setSaving(false);
    }
  };

  // Asks twice (PRODUCT.md S12).
  const confirmDelete = () =>
    Alert.alert(copy.deleteData, copy.deleteFirst, [
      { text: copy.deleteKeep, style: 'cancel' },
      {
        text: copy.deleteButton,
        style: 'destructive',
        onPress: () =>
          Alert.alert(copy.deleteSecond, undefined, [
            { text: copy.deleteKeep, style: 'cancel' },
            { text: copy.deleteButton, style: 'destructive', onPress: deleteEverything },
          ]),
      },
    ]);

  return (
    <Screen tab>
      <Title>{copy.title}</Title>
      {problem ? <Notice>{problem}</Notice> : null}

      <Heading>{copy.hardest}</Heading>
      <Row wrap>
        {HARD_THINGS.map((thing) => (
          <Chip
            key={thing}
            label={en.setup.hardest[thing]}
            selected={profile.hard_things.includes(thing)}
            onPress={() => toggleHard(thing)}
          />
        ))}
      </Row>

      <Heading>{copy.goal}</Heading>
      <Row>
        {GOALS.map((n) => (
          <Chip
            key={n}
            label={String(n)}
            selected={profile.weekly_goal === n}
            onPress={() => save('weekly_goal', { weekly_goal: n })}
          />
        ))}
      </Row>

      <Heading>{copy.planReminder}</Heading>
      <Row>
        <Chip
          label={en.setup.evening}
          selected={!morning}
          onPress={() => save('plan_time', { plan_time: outsideQuietHours(PLAN_TIME.evening, profile.quiet_start, profile.quiet_end) })}
        />
        <Chip
          label={en.setup.morning}
          selected={morning}
          onPress={() => save('plan_time', { plan_time: outsideQuietHours(PLAN_TIME.morning, profile.quiet_start, profile.quiet_end) })}
        />
      </Row>
      <TimeField
        value={profile.plan_time}
        accessibilityLabel={copy.planReminder}
        onChange={(time) => save('plan_time', { plan_time: outsideQuietHours(time, profile.quiet_start, profile.quiet_end) })}
      />

      <SwitchRow
        label={copy.startNudges}
        value={profile.start_nudges}
        disabled={saving}
        onChange={(on) => save('start_nudges', { start_nudges: on })}
      />
      <SwitchRow
        label={copy.extraReminders}
        hint={copy.extraRemindersHint}
        value={profile.extra_reminders}
        disabled={saving}
        onChange={(on) => save('extra_reminders', { extra_reminders: on })}
      />

      <Heading>{copy.quietHours}</Heading>
      <Row>
        <Text style={styles.label}>{copy.quietFrom}</Text>
        <TimeField
          value={profile.quiet_start}
          accessibilityLabel={`${copy.quietHours} ${copy.quietFrom}`}
          onChange={(time) => saveQuietHours(time, profile.quiet_end)}
        />
        <Text style={styles.label}>{copy.quietTo}</Text>
        <TimeField
          value={profile.quiet_end}
          accessibilityLabel={`${copy.quietHours} ${copy.quietTo}`}
          onChange={(time) => saveQuietHours(profile.quiet_start, time)}
        />
      </Row>

      <Heading>{copy.takeBreak}</Heading>
      {breakOn && profile.paused_until ? (
        <Notice
          action={
            <Button
              label={copy.endBreak}
              kind="secondary"
              disabled={saving}
              onPress={() => save('paused_until', { paused_until: null })}
            />
          }>
          {fill(copy.onBreak, { date: formatDate(profile.paused_until) })}
        </Notice>
      ) : (
        <Row>
          {BREAK_DAYS.map((days) => (
            <Chip
              key={days}
              label={copy.breakDays[days]}
              selected={false}
              onPress={() => save('paused_until', { paused_until: addDays(today, days) })}
            />
          ))}
        </Row>
      )}

      <Button label={copy.support} kind="secondary" onPress={() => router.push('/support')} />
      <Button label={copy.whatWeCollect} kind="secondary" onPress={() => router.push('/collect-info')} />
      {privacyUrl ? <Button label={copy.privacy} kind="secondary" onPress={() => openLink(privacyUrl)} /> : null}
      {feedbackEmail ? (
        <Button label={copy.feedback} kind="secondary" onPress={() => openLink(`mailto:${feedbackEmail}`)} />
      ) : null}
      <Button label={copy.deleteData} kind="quiet" onPress={confirmDelete} disabled={saving} />

      <Body muted>{`${copy.testerCode}: ${profile.tester_code}`}</Body>
      <Body muted>{`${copy.version}: ${Constants.expoConfig?.version ?? ''}`}</Body>
    </Screen>
  );
}

function SwitchRow({
  label,
  hint,
  value,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  disabled: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchText}>
        <Text style={styles.switchLabel}>{label}</Text>
        {hint ? <Body muted>{hint}</Body> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        accessibilityLabel={label}
        trackColor={{ true: colors.primary, false: colors.border }}
      />
    </View>
  );
}

// Signs out on this phone only: no internet is needed, and the data is already gone. The root
// layout then goes back to Welcome.
function signOut() {
  getSupabase()
    .auth.signOut({ scope: 'local' })
    .catch((error) => devWarn('settings: sign out', error));
}

function openLink(url: string) {
  Linking.openURL(url).catch((error) => devWarn('settings: link', error));
}

const styles = StyleSheet.create({
  label: { fontSize: 17, color: colors.text },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  switchText: { flex: 1, gap: 2 },
  switchLabel: { fontSize: 20, fontWeight: '600', color: colors.text },
});
