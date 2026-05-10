/**
 * Reminder scheduler — checks for overdue/upcoming items and schedules
 * notifications based on the Reminder Intensity setting.
 *
 * Zen Mode: daily digest only
 * Smart Nudge: P0 every 4h, P1 morning+evening, overdue daily
 * War Room: P0 every 2h, P1 every 4h, overdue every hour
 */

import { scheduleReminder } from './notifications';
import * as Notifications from 'expo-notifications';
import type { ReminderIntensity } from '@/src/store/ui-store';

// Track what we've already scheduled to avoid duplicates
const _scheduled = new Set<string>();

interface NoteWithReminder {
  id: string;
  title: string;
  priority: number | null;
  remindAt: string;
}

/**
 * Run the scheduler — call this on app launch and periodically
 */
export async function runReminderScheduler(
  notes: NoteWithReminder[],
  intensity: ReminderIntensity,
): Promise<void> {
  const now = Date.now();
  // Clear all existing scheduled notifications to avoid duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();
  _scheduled.clear();

  for (const note of notes) {
    // Skip if already scheduled this session
    if (_scheduled.has(note.id)) continue;
    _scheduled.add(note.id);
    const remindTime = new Date(note.remindAt).getTime();
    const isOverdue = remindTime < now;
    const hoursUntilDue = (remindTime - now) / (1000 * 60 * 60);

    if (intensity === 'gentle') {
      // Zen: only notify if overdue and hasn't been notified today
      if (isOverdue) {
        const tomorrow9am = new Date();
        tomorrow9am.setDate(tomorrow9am.getDate() + 1);
        tomorrow9am.setHours(9, 0, 0, 0);
        await scheduleReminder(note.id, `⏰ Overdue: ${note.title}`, tomorrow9am);
      }
    } else if (intensity === 'balanced') {
      if (isOverdue) {
        // Overdue: nudge in 1 hour
        await scheduleReminder(note.id, `⏰ Overdue: ${note.title}`, new Date(now + 60 * 60 * 1000));
      } else if (note.priority === 0 && hoursUntilDue <= 24) {
        // P0 due within 24h: remind in 4 hours
        await scheduleReminder(note.id, `🔴 P0 due soon: ${note.title}`, new Date(now + 4 * 60 * 60 * 1000));
      } else if (note.priority === 1 && hoursUntilDue <= 72) {
        // P1 due within 3 days: remind tomorrow morning
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        await scheduleReminder(note.id, `🟠 P1 upcoming: ${note.title}`, tomorrow);
      }
    } else if (intensity === 'aggressive') {
      if (isOverdue) {
        // Overdue: every hour
        await scheduleReminder(note.id, `🚨 OVERDUE: ${note.title}`, new Date(now + 60 * 60 * 1000));
      } else if (note.priority === 0) {
        // P0: every 2 hours
        await scheduleReminder(note.id, `🔴 P0: ${note.title}`, new Date(now + 2 * 60 * 60 * 1000));
      } else if (note.priority === 1 && hoursUntilDue <= 72) {
        // P1: every 4 hours
        await scheduleReminder(note.id, `🟠 P1: ${note.title}`, new Date(now + 4 * 60 * 60 * 1000));
      } else if (hoursUntilDue <= 48) {
        // Anything due within 2 days: remind in 6 hours
        await scheduleReminder(note.id, `⚡ Due soon: ${note.title}`, new Date(now + 6 * 60 * 60 * 1000));
      }
    }
  }
}
