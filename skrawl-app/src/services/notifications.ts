/**
 * Local notifications for Skrawl — reminders and daily briefings.
 * Uses expo-notifications for on-device scheduled notifications.
 * No push entitlement needed — these are local only.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

let _permissionGranted = false;

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') {
    _permissionGranted = true;
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  _permissionGranted = status === 'granted';
  return _permissionGranted;
}

/**
 * Configure notification handler — show even when app is foreground
 */
export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Schedule a reminder notification
 */
export async function scheduleReminder(
  noteId: string,
  title: string,
  remindAt: Date,
): Promise<string | null> {
  if (!_permissionGranted) {
    const granted = await requestNotificationPermissions();
    if (!granted) return null;
  }

  const secondsUntil = Math.max(1, Math.round((remindAt.getTime() - Date.now()) / 1000));

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Skrawl Reminder',
        body: title || 'You have a reminder',
        data: { noteId },
        sound: 'default',
      },
      trigger: secondsUntil <= 3
        ? null  // Fire immediately if less than 3 seconds
        : {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: secondsUntil,
          },
    });
    return id;
  } catch (e) {
    console.warn('Notification schedule failed:', e);
    return null;
  }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Notification may already have fired
  }
}

/**
 * Schedule daily briefing notification
 */
export async function scheduleDailyBriefing(
  hour: number = 9,
  minute: number = 0,
): Promise<string | null> {
  if (!_permissionGranted) {
    const granted = await requestNotificationPermissions();
    if (!granted) return null;
  }

  // Cancel existing daily briefing
  await Notifications.cancelAllScheduledNotificationsAsync();

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Skrawl',
        body: 'Check your tasks for today',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    return id;
  } catch {
    return null;
  }
}

/**
 * Get count of pending scheduled notifications
 */
export async function getPendingCount(): Promise<number> {
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  return pending.length;
}
