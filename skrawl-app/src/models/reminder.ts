export type ReminderStatus = 'pending' | 'fired' | 'dismissed';

export interface Reminder {
  id: string;
  noteId: string;
  remindAt: string;
  calendarEventId: string | null;
  status: ReminderStatus;
  aiSuggested: boolean;
  autoSet: boolean;
  createdAt: string;
  isDirty: boolean;
}
