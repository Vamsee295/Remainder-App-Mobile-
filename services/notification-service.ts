import * as Notifications from 'expo-notifications';
import { Platform, NativeModules } from 'react-native';
import { Task } from '@/types';
import { AlarmService } from './alarm-service';

// Get native alarm module (Android only)
const { AlarmModule } = NativeModules;

// Configure how notifications should be handled when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export class NotificationService {
    /**
   * Request notification permissions
   */
    static async requestPermissions(): Promise<boolean> {
        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.warn('Notification permissions not granted');
                return false;
            }

            // Configure notification channel for Android
            if (Platform.OS === 'android') {
                try {
                    await Notifications.setNotificationChannelAsync('default', {
                        name: 'Task Reminders',
                        importance: Notifications.AndroidImportance.MAX,
                        vibrationPattern: [0, 250, 250, 250],
                        lightColor: '#4FC3F7',
                    });
                } catch (channelError) {
                    // Channel creation might fail in Expo Go, but local notifications should still work
                    console.log('Note: Running in Expo Go - some notification features limited');
                }
            }

            return true;
        } catch (error) {
            console.log('Notification setup note:', error);
            // Return true anyway - local notifications should still work in Expo Go
            return true;
        }
    }

    /**
     * Schedule a notification for a task (with auto-snooze)
     * Schedules 3 notifications: main + 2 auto-snoozes (5 and 10 mins later)
     * Also validates alarm deadlines before scheduling
     */
    static async scheduleNotification(task: Task): Promise<string[] | null> {
        try {
            const hasPermission = await this.requestPermissions();

            if (!hasPermission) {
                console.warn('Cannot schedule notification without permissions');
                return null;
            }

            // Check if alarm is valid (not expired)
            if (!AlarmService.isAlarmValid(task)) {
                console.warn('Task alarm has expired, skipping notification');
                return null;
            }

            const taskDate = new Date(task.dateTime);
            const now = new Date();

            // Don't schedule if the time has already passed
            if (taskDate <= now) {
                console.warn('Task time is in the past, skipping notification');
                return null;
            }

            // Android: our native scheduler handles both modes. Ring = full-screen ringing alarm,
            // Notify = normal notification. Both get Done / Snooze buttons that work with the app closed
            // (applied by applyNativeEvents in use-tasks), plus daily repeats and reboot restore.
            if (Platform.OS === 'android' && AlarmModule) {
                try {
                    const { StorageService } = require('./storage-service');
                    const soundUri = await StorageService.loadSelectedAlarmSound();
                    const repeats = Boolean(task.recurrence && task.recurrence !== 'none');

                    await AlarmModule.setAlarm(
                        task.id,
                        taskDate.getTime(),
                        soundUri && soundUri.startsWith('content://') ? soundUri : 'default',
                        task.title,
                        task.description || '',
                        repeats, // every repeat type rings daily; weekly / monthly just stop at the deadline
                        task.deadlineDate ? new Date(task.deadlineDate).getTime() : 0,
                        task.alarmEnabled !== false ? 'ring' : 'notify'
                    );
                    return [task.id];
                } catch (error) {
                    console.error('Native alarm failed, falling back to a notification:', error);
                }
            }

            // **FALLBACK: Use expo-notifications (iOS, web, or if native fails)**
            const notificationIds: string[] = [];

            // Build notification body with deadline info if applicable
            let notificationBody = task.description || 'Your reminder is due';
            const deadlineInfo = AlarmService.formatDeadlineInfo(task);
            if (deadlineInfo && task.recurrence !== 'daily') {
                notificationBody += ` • ${deadlineInfo}`;
            }

            // Main notification, once per day for repeating tasks (up to the deadline).
            // ponytail: "Daily" is scheduled 14 days ahead and topped up when the app opens (rollRepeats in use-tasks).
            const repeatDays = !task.recurrence || task.recurrence === 'none' ? 1 : task.recurrence === 'weekly' ? 7 : task.recurrence === 'monthly' ? 30 : 14;
            const until = task.deadlineDate ? new Date(task.deadlineDate).getTime() : Infinity;
            for (let day = 0; day < repeatDays; day++) {
                const date = new Date(taskDate);
                date.setDate(date.getDate() + day);
                if (date.getTime() > until) break;
                const id = await Notifications.scheduleNotificationAsync({
                    content: {
                        title: `🔔 ${task.title}`,
                        body: notificationBody,
                        data: { taskId: task.id, isAlarm: true, hasDeadline: Boolean(task.deadlineDate) },
                        sound: true,
                        priority: Notifications.AndroidNotificationPriority.MAX,
                    },
                    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
                });
                notificationIds.push(id);
            }

            // Schedule 1st auto-snooze (+5 minutes)
            const snooze1Date = new Date(taskDate.getTime() + 5 * 60000);
            const snooze1Id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: `⏰ ${task.title}`,
                    body: task.description || 'Reminder (Auto-Snoozed)',
                    data: { taskId: task.id },
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: snooze1Date,
                },
            });
            notificationIds.push(snooze1Id);

            // Schedule 2nd auto-snooze (+10 minutes)
            const snooze2Date = new Date(taskDate.getTime() + 10 * 60000);
            const snooze2Id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: `⏰⏰ ${task.title}`,
                    body: task.description || 'Reminder (Auto-Snoozed)',
                    data: { taskId: task.id },
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: snooze2Date,
                },
            });
            notificationIds.push(snooze2Id);

            console.log(`Scheduled ${notificationIds.length} notifications for task: ${task.title}`);
            return notificationIds;
        } catch (error) {
            console.error('Error scheduling notification:', error);
            return null;
        }
    }

    /** Done / Snooze taps made from notifications or the alarm screen since the last call (Android only). */
    static async consumeNativeEvents(): Promise<{ id: string; type: 'done' | 'snooze'; time: number }[]> {
        if (Platform.OS !== 'android' || !AlarmModule?.consumeEvents) return [];
        try {
            return JSON.parse(await AlarmModule.consumeEvents());
        } catch {
            return [];
        }
    }

    /** True when this device can ring real alarms (Android build with the native module). */
    static canRing(): boolean {
        return Platform.OS === 'android' && Boolean(AlarmModule);
    }

    /** Ring a test alarm a few seconds from now, to check sound and the full-screen alarm. */
    static async ringTestAlarm(seconds = 10): Promise<void> {
        const { StorageService } = require('./storage-service');
        const soundUri = await StorageService.loadSelectedAlarmSound();
        await AlarmModule.setAlarm(
            'test-alarm',
            Date.now() + seconds * 1000,
            soundUri && soundUri.startsWith('content://') ? soundUri : 'default',
            'Test alarm',
            'If you can hear this, alarms work.',
            false,
            0,
            'ring'
        );
    }

    /**
     * Cancel a scheduled notification
     */
    static async cancelNotification(notificationId: string): Promise<void> {
        try {
            await Notifications.cancelScheduledNotificationAsync(notificationId);
            console.log(`Notification cancelled: ${notificationId}`);
        } catch (error) {
            console.error('Error cancelling notification:', error);
        }
    }

    /**
     * Cancel multiple scheduled notifications
     */
    static async cancelMultipleNotifications(notificationIds: string[]): Promise<void> {
        try {
            await Promise.all(
                notificationIds.map(async id => {
                    // An id can be a native alarm (the task id) or an expo notification id: cancel both ways.
                    if (Platform.OS === 'android' && AlarmModule) {
                        await AlarmModule.cancelAlarm(id).catch(() => {});
                    }
                    await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
                })
            );
            console.log(`Cancelled ${notificationIds.length} notifications`);
        } catch (error) {
            console.error('Error cancelling notifications:', error);
        }
    }

    /**
     * Cancel all scheduled notifications
     */
    static async cancelAllNotifications(): Promise<void> {
        try {
            await Notifications.cancelAllScheduledNotificationsAsync();
            console.log('All notifications cancelled');
        } catch (error) {
            console.error('Error cancelling all notifications:', error);
        }
    }

    /**
     * Get all scheduled notifications (for debugging)
     */
    static async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
        try {
            return await Notifications.getAllScheduledNotificationsAsync();
        } catch (error) {
            console.error('Error getting scheduled notifications:', error);
            return [];
        }
    }

    /**
     * Setup notification listeners
     */
    static setupNotificationListeners(
        onNotificationReceived?: (notification: Notifications.Notification) => void,
        onNotificationTapped?: (response: Notifications.NotificationResponse) => void
    ) {
        // Listen for notifications received while app is in foreground
        const receivedSubscription = Notifications.addNotificationReceivedListener(
            (notification) => {
                console.log('Notification received:', notification);
                onNotificationReceived?.(notification);
            }
        );

        // Listen for user interactions with notifications
        const responseSubscription = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                console.log('Notification tapped:', response);
                onNotificationTapped?.(response);
            }
        );

        // Return cleanup function
        return () => {
            receivedSubscription.remove();
            responseSubscription.remove();
        };
    }
}
