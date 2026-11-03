// The side-effect half of notifications (TECH.md §6): permission, the Android channel, and putting
// what src/lib/schedule.ts decides onto the phone.
import { Linking, Platform } from 'react-native';

import { en } from '../copy/en';
import { fetchTasksOnDates } from '../data/tasks';
import type { Profile } from '../data/types';
import { devWarn } from './devLog';
import { track } from './events';
import * as Notifications from './expoNotifications';
import { buildSchedule, type NudgeKind } from './schedule';
import { addDays, localDate } from './time';

const CHANNEL_ID = 'reminders';

// What each notification carries, so a tap knows which screen to open (TECH.md §6 "Taps").
export type NudgeData = { url: string; kind: NudgeKind };

// A permission answer this fast means the phone didn't show a prompt at all: Android answers
// "no" by itself once the student has said no before. A person can't read a prompt and tap
// that quickly, so a real "Don't allow" always takes longer.
const NO_PROMPT_MS = 500;

// Android 13+ only shows the permission prompt once a channel exists, so create it first
// (expo-notifications docs, SDK 57). Our reminders use one high-importance channel.
export async function ensureReminderChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
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

// A nudge that arrives while the app is open still shows as a banner. Called once at launch.
export function showNudgesInApp(): void {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (error) {
    devWarn('notifications: in-app', error);
  }
}

// Syncs run one at a time, in order, so two quick saves can't mix up cancelling and scheduling.
let queue: Promise<void> = Promise.resolve();

// Cancels every scheduled notification and schedules a fresh set (TECH.md §6). Safe to call any
// number of times: on launch, when the app comes back to the foreground, and after every save
// (plan, settings, start, check-in, fix). Never throws; a failed sync leaves the last set in place.
export function syncNotifications(profile: Profile): Promise<void> {
  queue = queue.then(() => sync(profile)).catch((error) => devWarn('notifications: sync', error));
  return queue;
}

async function sync(profile: Profile): Promise<void> {
  // Without permission nothing can show, so there's nothing to schedule yet.
  if (!(await remindersAllowed())) return;
  const now = new Date();
  const today = localDate(now, profile.timezone);
  // Tasks can only be planned for today and tomorrow, and a late task from yesterday can still
  // have its check-in or timer to come. The day after tomorrow is there for a fix's reschedule.
  const tasks = await fetchTasksOnDates([addDays(today, -1), today, addDays(today, 1), addDays(today, 2)]);
  const planned = buildSchedule(now, profile, tasks);
  // Only clear the old set once the new one is ready: if loading failed (no internet), the
  // nudges already scheduled stay and still fire (PRODUCT.md §9).
  await ensureReminderChannel().catch((error) => devWarn('notifications: channel', error));
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const nudge of planned) {
    const data: NudgeData = { url: nudge.url, kind: nudge.kind };
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title: nudge.title, body: nudge.body, data },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: nudge.at,
          channelId: CHANNEL_ID,
        },
      });
    } catch (error) {
      // One that fails (for example its time passed a moment ago) mustn't stop the rest.
      devWarn('notifications: schedule', error);
    }
  }
}

// After signing out or deleting everything: no nudges about a plan that's gone.
export function cancelAllNudges(): Promise<void> {
  queue = queue
    .then(() => Notifications.cancelAllScheduledNotificationsAsync())
    .catch((error) => devWarn('notifications: cancel', error));
  return queue;
}

const NUDGE_KINDS: readonly string[] = ['plan', 'heads_up', 'start', 'follow_up', 'checkin', 'timer'];

// The screen a tapped notification should open, or null if it isn't one of ours.
export function nudgeFromResponse(response: Notifications.NotificationResponse): NudgeData | null {
  const data = response.notification.request.content.data ?? {};
  const url = data.url;
  const kind = data.kind;
  if (typeof url !== 'string' || !url.startsWith('/')) return null;
  if (typeof kind !== 'string' || !NUDGE_KINDS.includes(kind)) return null;
  return { url, kind: kind as NudgeKind };
}
