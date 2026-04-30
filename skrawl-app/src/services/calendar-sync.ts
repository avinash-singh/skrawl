/**
 * Calendar sync — creates calendar events for reminders using expo-calendar.
 */
import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

let _calendarId: string | null = null;

/**
 * Request calendar permissions and find or create the Skrawl calendar
 */
export async function ensureCalendarAccess(): Promise<string | null> {
  if (_calendarId) return _calendarId;

  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') return null;

  // Look for existing Skrawl calendar
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const existing = calendars.find((c) => c.title === 'Skrawl');
  if (existing) {
    _calendarId = existing.id;
    return _calendarId;
  }

  // Create a new calendar for Skrawl
  if (Platform.OS === 'ios') {
    const defaultSource = calendars.find((c) => c.source?.isLocalAccount)?.source;
    if (!defaultSource) return null;
    _calendarId = await Calendar.createCalendarAsync({
      title: 'Skrawl',
      color: '#7C6AFF',
      entityType: Calendar.EntityTypes.EVENT,
      sourceId: defaultSource.id,
      source: defaultSource,
      name: 'Skrawl',
      ownerAccount: 'personal',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });
  } else {
    _calendarId = await Calendar.createCalendarAsync({
      title: 'Skrawl',
      color: '#7C6AFF',
      entityType: Calendar.EntityTypes.EVENT,
      source: { isLocalAccount: true, name: 'Skrawl', type: Calendar.SourceType.LOCAL as any },
      name: 'Skrawl',
      ownerAccount: 'personal',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });
  }

  return _calendarId;
}

/**
 * Create a calendar event for a reminder
 */
export async function createCalendarEvent(
  title: string,
  remindAt: Date,
  noteId: string,
): Promise<string | null> {
  try {
    const calId = await ensureCalendarAccess();
    if (!calId) return null;

    const eventId = await Calendar.createEventAsync(calId, {
      title: title || 'Skrawl Reminder',
      startDate: remindAt,
      endDate: new Date(remindAt.getTime() + 30 * 60 * 1000), // 30 min duration
      alarms: [{ relativeOffset: 0 }], // alert at event time
      notes: `Skrawl note: ${noteId}`,
    });

    return eventId;
  } catch {
    return null;
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  try {
    await Calendar.deleteEventAsync(eventId);
  } catch {
    // Event may already be deleted
  }
}
