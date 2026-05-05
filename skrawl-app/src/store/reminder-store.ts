import { create } from 'zustand';
import type { Reminder } from '@/src/models';
import * as db from '@/src/services/database';
import { createCalendarEvent, deleteCalendarEvent } from '@/src/services/calendar-sync';
import { scheduleReminder as scheduleNotif, cancelNotification } from '@/src/services/notifications';

interface ReminderState {
  reminders: Reminder[];
  loadReminders: () => Promise<void>;
  addReminder: (reminder: Reminder, noteTitle?: string) => Promise<void>;
  dismissReminder: (id: string) => Promise<void>;
  getRemindersForNote: (noteId: string) => Reminder[];
}

export const useReminderStore = create<ReminderState>((set, get) => ({
  reminders: [],

  loadReminders: async () => {
    try {
      const d = db.getDb();
      const rows = await d.getAllAsync<any>(
        "SELECT * FROM reminders WHERE status = 'pending' ORDER BY remind_at ASC"
      );
      set({
        reminders: rows.map((r: any) => ({
          id: r.id,
          noteId: r.note_id,
          remindAt: r.remind_at,
          calendarEventId: r.calendar_event_id,
          status: r.status,
          aiSuggested: !!r.ai_suggested,
          autoSet: !!r.auto_set,
          createdAt: r.created_at,
          isDirty: !!r.is_dirty,
        })),
      });
    } catch {
      // reminders table might not have data yet
    }
  },

  addReminder: async (reminder, noteTitle) => {
    const d = db.getDb();
    await d.runAsync(
      'INSERT INTO reminders (id, note_id, remind_at, status, ai_suggested, auto_set) VALUES (?, ?, ?, ?, ?, ?)',
      [reminder.id, reminder.noteId, reminder.remindAt, reminder.status, reminder.aiSuggested ? 1 : 0, reminder.autoSet ? 1 : 0]
    );

    // Schedule local notification
    await scheduleNotif(reminder.noteId, noteTitle || 'Reminder', new Date(reminder.remindAt));

    // Create calendar event
    const eventId = await createCalendarEvent(
      noteTitle || 'Skrawl Reminder',
      new Date(reminder.remindAt),
      reminder.noteId,
    );
    if (eventId) {
      await d.runAsync('UPDATE reminders SET calendar_event_id = ? WHERE id = ?', [eventId, reminder.id]);
      reminder = { ...reminder, calendarEventId: eventId };
    }

    set((s) => ({ reminders: [...s.reminders, reminder] }));
  },

  dismissReminder: async (id) => {
    const reminder = get().reminders.find((r) => r.id === id);
    const d = db.getDb();
    await d.runAsync("UPDATE reminders SET status = 'dismissed' WHERE id = ?", [id]);

    // Delete calendar event if exists
    if (reminder?.calendarEventId) {
      await deleteCalendarEvent(reminder.calendarEventId);
    }

    set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) }));
  },

  getRemindersForNote: (noteId) => get().reminders.filter((r) => r.noteId === noteId),
}));
