// The parts of expo-notifications we use, imported file by file instead of from 'expo-notifications'.
// Why: in Expo Go on Android (SDK 57), importing 'expo-notifications' itself crashes the app with
// "Cannot find native module 'ExpoTopicSubscriptionModule'". The package's main file loads its push
// topic module, which Expo Go on Android leaves out (push isn't available there since SDK 53).
// Even 57.0.23's "fix importing expo-notifications crashing the app in Expo Go" still loads it.
// These files only use native modules Expo Go has (channels, permissions, the scheduler, the
// tap listener and the foreground handler).
// Need another function? Add it here the same way, from expo-notifications/build/.
// Once the app only runs in development builds, importing 'expo-notifications' works again.
export { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
export { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
export {
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-notifications/build/NotificationPermissions';
export { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
export { cancelAllScheduledNotificationsAsync } from 'expo-notifications/build/cancelAllScheduledNotificationsAsync';
export { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
export type { NotificationResponse } from 'expo-notifications/build/Notifications.types';
export {
  addNotificationResponseReceivedListener,
  clearLastNotificationResponse,
  getLastNotificationResponse,
} from 'expo-notifications/build/NotificationsEmitter';
export { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
