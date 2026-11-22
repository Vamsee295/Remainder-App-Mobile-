import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

/**
 * Read-only view of the phone's calendars (Google Calendar included, when it syncs to the phone).
 * Nothing is written to the calendar, so no account sign-in is needed.
 */
export type PhoneEvent = { id: string; title: string; start: Date; end: Date; allDay: boolean };

export const canUseCalendar = Platform.OS !== 'web';

export async function askCalendarPermission(): Promise<boolean> {
  if (!canUseCalendar) return false;
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

/** Events that touch the given day, earliest first. Empty if permission is missing. */
export async function eventsOn(day: Date): Promise<PhoneEvent[]> {
  if (!canUseCalendar) return [];
  const { status } = await Calendar.getCalendarPermissionsAsync();
  if (status !== 'granted') return [];

  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  if (!calendars.length) return [];
  const events = await Calendar.getEventsAsync(calendars.map((c) => c.id), start, end);
  return events
    .map((e) => ({ id: e.id, title: e.title || 'Untitled event', start: new Date(e.startDate), end: new Date(e.endDate), allDay: Boolean(e.allDay) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}
