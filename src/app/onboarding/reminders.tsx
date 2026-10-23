// S4 Reminders: one screen saying why reminders matter, then the system prompt (PRODUCT.md S4).
// If the student says no, the app still works and Today shows a "Reminders are off" banner.
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Body, Button, Screen, Title } from '../../components/ui';
import { en } from '../../copy/en';
import { track } from '../../lib/events';
import * as Notifications from '../../lib/expoNotifications';
import { ensureReminderChannel } from '../../lib/notifications';
import { useSession } from '../../lib/session';

const copy = en.reminders;

export default function Reminders() {
  const { finishOnboarding } = useSession();
  const [asking, setAsking] = useState(false);

  const turnOn = async () => {
    setAsking(true);
    try {
      await ensureReminderChannel();
      const result = await Notifications.requestPermissionsAsync();
      track('notification_permission', { granted: result.granted });
    } catch {
      // If asking fails, carry on: Today shows the "Reminders are off" banner with a button.
    } finally {
      setAsking(false);
      finishOnboarding();
    }
  };

  return (
    <Screen scroll={false}>
      <View style={styles.middle}>
        <Title>{copy.title}</Title>
        <Body>{copy.body}</Body>
      </View>
      <Button label={copy.turnOn} onPress={turnOn} disabled={asking} />
      <Button label={copy.notNow} kind="quiet" onPress={finishOnboarding} disabled={asking} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  middle: { flex: 1, justifyContent: 'center', gap: 16 },
});
