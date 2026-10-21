// The side-effect half of notifications (TECH.md §6): permission and the Android channel.
// Scheduling arrives in Milestone 2 (src/lib/schedule.ts decides what, this file does it).
import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import { en } from '../copy/en';

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
  } catch {
    return false;
  }
}

// The "Turn on" button: ask again if the phone still lets us, otherwise open the app's settings,
// because after a "no" (always on iOS, and after repeated no's on Android) only Settings can change it.
export async function askForReminders(): Promise<boolean> {
  await ensureReminderChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (current.canAskAgain) {
    return (await Notifications.requestPermissionsAsync()).granted;
  }
  await Linking.openSettings();
  return false;
}
