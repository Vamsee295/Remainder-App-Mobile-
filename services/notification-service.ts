import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Task } from '@/types';

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
     */
    static async scheduleNotification(task: Task): Promise<string[] | null> {
        try {
            const hasPermission = await this.requestPermissions();

            if (!hasPermission) {
                console.warn('Cannot schedule notification without permissions');
                return null;
            }

            const taskDate = new Date(task.dateTime);
            const now = new Date();

            // Don't schedule if the time has already passed
            if (taskDate <= now) {
                console.warn('Task time is in the past, skipping notification');
                return null;
            }

            const notificationIds: string[] = [];

            // Schedule main notification
            const mainId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: task.title,
                    body: task.description || 'Your reminder is due',
                    data: { taskId: task.id },
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: taskDate,
                },
            });
            notificationIds.push(mainId);

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

            console.log(`Scheduled 3 notifications for task: ${task.title}`);
            return notificationIds;
        } catch (error) {
            console.error('Error scheduling notification:', error);
            return null;
        }
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
                notificationIds.map(id => Notifications.cancelScheduledNotificationAsync(id))
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
