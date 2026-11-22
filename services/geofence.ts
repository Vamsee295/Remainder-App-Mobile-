import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { NativeModules, Platform } from 'react-native';

import { Task } from '@/types';
import { StorageService } from './storage-service';

/**
 * Place reminders: "remind me when I arrive / leave here".
 * The phone watches each saved place (a geofence) and wakes this task when you cross it, even with the app closed.
 * Imported once at start-up (app/_layout.tsx) so the background task is defined before Android calls it.
 */
const TASK = 'remainder-places';
export const PLACE_RADIUS_M = 150;
export const canUsePlaces = Platform.OS !== 'web';

if (canUsePlaces) TaskManager.defineTask(TASK, async ({ data, error }) => {
  if (error || !data) return;
  const { eventType, region } = data as { eventType: Location.GeofencingEventType; region: Location.LocationRegion };
  const task = (await StorageService.loadTasks()).find((t) => t.id === region.identifier);
  if (!task?.place || task.completed) return;

  const arrived = eventType === Location.GeofencingEventType.Enter;
  if (arrived !== (task.place.on === 'arrive')) return;

  const title = `${arrived ? 'You’re at' : 'You left'} ${task.place.name}: ${task.title}`;
  if (Platform.OS === 'android' && NativeModules.AlarmModule?.notifyNow) {
    NativeModules.AlarmModule.notifyNow(task.id, title, task.description || ''); // with Done / Snooze buttons
  } else {
    await Notifications.scheduleNotificationAsync({ content: { title, body: task.description || '', data: { taskId: task.id } }, trigger: null });
  }
});

/** Saves where you are now as the task's place. Throws a readable message if location isn't allowed. */
export async function captureHere(): Promise<{ name: string; lat: number; lng: number }> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') throw new Error('Allow location for Remainder to use place reminders.');
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  let name = 'this place';
  try {
    const [a] = await Location.reverseGeocodeAsync(pos.coords);
    name = a?.name || a?.street || a?.district || a?.city || name;
  } catch {
    // no address: keep "this place"
  }
  return { name, lat: pos.coords.latitude, lng: pos.coords.longitude };
}

/** "Allow all the time" is what lets the phone fire place reminders while the app is closed. */
export async function askBackgroundLocation(): Promise<boolean> {
  const bg = await Location.requestBackgroundPermissionsAsync();
  return bg.status === 'granted';
}

/** Watch every open task that has a place; stop watching when there are none. */
export async function syncGeofences(tasks: Task[]): Promise<void> {
  if (!canUsePlaces) return;
  try {
    const regions: Location.LocationRegion[] = tasks
      .filter((t) => t.place && !t.completed)
      .map((t) => ({
        identifier: t.id,
        latitude: t.place!.lat,
        longitude: t.place!.lng,
        radius: PLACE_RADIUS_M,
        notifyOnEnter: t.place!.on === 'arrive',
        notifyOnExit: t.place!.on === 'leave',
      }));
    const running = await TaskManager.isTaskRegisteredAsync(TASK);
    if (!regions.length) {
      if (running) await Location.stopGeofencingAsync(TASK);
      return;
    }
    const { status } = await Location.getBackgroundPermissionsAsync();
    if (status !== 'granted') return; // the sheet asked; without it the phone can't watch places
    await Location.startGeofencingAsync(TASK, regions); // replaces the previous set
  } catch (e) {
    console.warn('Could not update place reminders:', e);
  }
}
