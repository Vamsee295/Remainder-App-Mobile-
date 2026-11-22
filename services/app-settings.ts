import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

/** User preferences. snooze / followUps / ringMinutes are also sent to the native alarm code. */
export type AppSettings = {
  defaultRing: boolean; // new reminders (sheet and quick add) ring like an alarm instead of a notification
  snooze: number; // minutes
  followUps: number; // "still to do" notifications after a Notify reminder, 5 min apart
  ringMinutes: number; // how long an alarm rings before it stops
  showCalendar: boolean; // show the phone's calendar events in the Calendar tab
};

export const DEFAULT_SETTINGS: AppSettings = { defaultRing: false, snooze: 10, followUps: 2, ringMinutes: 2, showCalendar: false };
const KEY = '@remainder_settings';

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
  if (Platform.OS === 'android') NativeModules.AlarmModule?.setSettings?.(settings.snooze, settings.followUps, settings.ringMinutes);
}
