// The side-effect half of notifications (TECH.md §6): permission and the Android channel.
// Scheduling arrives in Milestone 2 (src/lib/schedule.ts decides what, this file does it).
import { Linking, Platform } from 'react-native';

import { en } from '../copy/en';
import { devWarn } from './devLog';
import { track } from './events';
import * as Notifications from './expoNotifications';

// A permission answer this fast means the phone didn't show a prompt at all: Android answers
// "no" by itself once the student has said no before. A person can't read a prompt and tap
// that quickly, so a real "Don't allow" always takes longer.
const NO_PROMPT_MS = 500;

// Android 13+ only shows the permission prompt once a channel exists, so create it first
// (expo-notifications docs, SDK 57). Our reminders use one high-importance channel.
export async function ensureReminderChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('reminders', {
    name: en.reminders.channelName,
    importance: Notifications.AndroidImportance.HIGH,
  });
}

export async function remindersAllowed(): Promise<boolean> {
  try {
    return (await Notifications.getPermissionsAsync()).granted;
  } catch (error) {
    devWarn('reminders: check', error);
    return false;
  }
}

// The "Turn on" button. It must always do something the student can see: show the phone's
// prompt, or open the app's settings when the phone won't show one (after a "no" on iOS, after
// repeated no's on Android, or when asking fails), because only Settings can change it then.
// A real "Don't allow" in the prompt is respected: the banner just stays.
export async function askForReminders(): Promise<boolean> {
  // A failed channel must not stop us asking (it only hides the prompt on some Android phones).
  await ensureReminderChannel().catch((error) => devWarn('reminders: channel', error));
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (current.canAskAgain) {
      const askedAt = Date.now();
      const answer = await Notifications.requestPermissionsAsync();
      track('notification_permission', { granted: answer.granted });
      if (answer.granted) return true;
      const promptShown = Date.now() - askedAt >= NO_PROMPT_MS;
      if (promptShown || answer.canAskAgain) return false;
    }
  } catch (error) {
    devWarn('reminders: ask', error);
  }
  await Linking.openSettings().catch((error) => devWarn('reminders: settings', error));
  return false;
}
