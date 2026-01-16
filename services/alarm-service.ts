import { Task, RecurrenceType } from '@/types';

/**
 * AlarmService handles the core alarm logic for deadline calculation and validation.
 * 
 * Key Logic Rules:
 * - Daily Mode: deadlineDate = null (rings indefinitely until manually stopped)
 * - Weekly Mode: deadlineDate = createdAt + 7 days (rings daily for 7 days)
 * - Monthly Mode: deadlineDate = createdAt + 30 days (rings daily for 30 days)
 */
export class AlarmService {
    /**
     * Calculate the deadline date based on recurrence type
     * @param createdAt ISO string of task creation date
     * @param recurrence Recurrence type (daily, weekly, monthly)
     * @returns ISO string for deadline date, or null for daily (no expiry)
     */
    static calculateDeadlineDate(
        createdAt: string,
        recurrence?: RecurrenceType
    ): string | null {
        // No recurrence or 'none' means no alarm functionality
        if (!recurrence || recurrence === 'none') {
            return null;
        }

        // Daily mode: no expiry, rings indefinitely
        if (recurrence === 'daily') {
            return null;
        }

        const creationDate = new Date(createdAt);

        // Weekly mode: expires after 7 days
        if (recurrence === 'weekly') {
            const deadline = new Date(creationDate);
            deadline.setDate(deadline.getDate() + 7);
            return deadline.toISOString();
        }

        // Monthly mode: expires after 30 days
        if (recurrence === 'monthly') {
            const deadline = new Date(creationDate);
            deadline.setDate(deadline.getDate() + 30);
            return deadline.toISOString();
        }

        return null;
    }

    /**
     * Check if an alarm is still valid (hasn't exceeded its deadline)
     * @param task The task to check
     * @returns true if alarm should still trigger, false if expired
     */
    static isAlarmValid(task: Task): boolean {
        // If already marked as expired, it's not valid
        if (task.isExpired) {
            return false;
        }

        // If no deadline (daily mode), it's always valid
        if (!task.deadlineDate) {
            return true;
        }

        // Check if current date is within deadline
        const currentDate = new Date();
        const deadline = new Date(task.deadlineDate);

        return currentDate <= deadline;
    }

    /**
     * Check if alarm should trigger based on current time and deadline
     * Also checks if the scheduled time has arrived
     * @param task The task to check
     * @returns true if alarm should trigger now
     */
    static shouldTriggerAlarm(task: Task): boolean {
        // Don't trigger if completed
        if (task.completed) {
            return false;
        }

        // Don't trigger if expired
        if (!this.isAlarmValid(task)) {
            return false;
        }

        // Check if the scheduled time has arrived
        const currentDate = new Date();
        const scheduledDate = new Date(task.dateTime);

        // Alarm should trigger if current time is at or past scheduled time
        return currentDate >= scheduledDate;
    }

    /**
     * Mark a task as expired
     * @param task The task to mark as expired
     * @returns Updated task with isExpired flag set
     */
    static markTaskAsExpired(task: Task): Task {
        return {
            ...task,
            isExpired: true,
        };
    }

    /**
     * Get all expired tasks from a list
     * @param tasks Array of tasks to filter
     * @returns Array of expired tasks
     */
    static getExpiredTasks(tasks: Task[]): Task[] {
        const currentDate = new Date();

        return tasks.filter(task => {
            // Skip if already marked as expired
            if (task.isExpired) {
                return true;
            }

            // Skip if no deadline (daily mode - never expires)
            if (!task.deadlineDate) {
                return false;
            }

            // Check if deadline has passed
            const deadline = new Date(task.deadlineDate);
            return currentDate > deadline;
        });
    }

    /**
     * Get all active (non-expired, non-completed) alarms
     * @param tasks Array of tasks to filter
     * @returns Array of active alarm tasks
     */
    static getActiveAlarms(tasks: Task[]): Task[] {
        return tasks.filter(task => {
            return !task.completed && this.isAlarmValid(task);
        });
    }

    /**
     * Format deadline information for display
     * @param task The task with deadline information
     * @returns Human-readable deadline string
     */
    static formatDeadlineInfo(task: Task): string {
        if (!task.recurrence || task.recurrence === 'none') {
            return '';
        }

        if (task.recurrence === 'daily') {
            return 'Rings indefinitely';
        }

        if (!task.deadlineDate) {
            return '';
        }

        const deadline = new Date(task.deadlineDate);
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        };

        const formattedDate = deadline.toLocaleDateString('en-US', options);

        if (task.recurrence === 'weekly') {
            return `Expires on ${formattedDate} (7 days)`;
        }

        if (task.recurrence === 'monthly') {
            return `Expires on ${formattedDate} (30 days)`;
        }

        return '';
    }

    /**
     * Calculate days remaining until deadline
     * @param task The task to check
     * @returns Number of days remaining, or null if no deadline
     */
    static getDaysUntilDeadline(task: Task): number | null {
        if (!task.deadlineDate) {
            return null;
        }

        const currentDate = new Date();
        const deadline = new Date(task.deadlineDate);
        const diffTime = deadline.getTime() - currentDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    }

    /**
     * Check if a task has an alarm enabled
     * @param task The task to check
     * @returns true if task has alarm functionality
     */
    static hasAlarm(task: Task): boolean {
        return Boolean(
            task.recurrence &&
            task.recurrence !== 'none' &&
            !task.completed
        );
    }
}
