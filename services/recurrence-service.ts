import { Task, RecurrenceType } from '@/types';
import { AlarmService } from './alarm-service';

export class RecurrenceService {
    /**
     * Calculate the next occurrence date for a recurring task
     */
    static getNextOccurrence(task: Task): Date | null {
        if (!task.recurrence || task.recurrence === 'none') {
            return null;
        }

        const currentDate = new Date(task.dateTime);
        const interval = task.recurrenceInterval || 1;

        switch (task.recurrence) {
            case 'daily':
                currentDate.setDate(currentDate.getDate() + interval);
                break;
            case 'weekly':
                currentDate.setDate(currentDate.getDate() + (7 * interval));
                break;
            case 'monthly':
                currentDate.setMonth(currentDate.getMonth() + interval);
                break;
        }

        return currentDate;
    }

    /**
     * Create the next occurrence of a recurring task
     * Respects alarm deadlines - won't create new occurrence if deadline passed
     */
    static createNextOccurrence(completedTask: Task): Task | null {
        // Don't create next occurrence if the task deadline has passed
        if (!AlarmService.isAlarmValid(completedTask)) {
            console.log('Task deadline passed, not creating next occurrence');
            return null;
        }

        const nextDate = this.getNextOccurrence(completedTask);
        if (!nextDate) {
            return null;
        }

        // If next occurrence would be beyond deadline, don't create it
        if (completedTask.deadlineDate) {
            const deadline = new Date(completedTask.deadlineDate);
            if (nextDate > deadline) {
                console.log('Next occurrence would exceed deadline, not creating');
                return null;
            }
        }

        const newTask: Task = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            title: completedTask.title,
            description: completedTask.description,
            dateTime: nextDate.toISOString(),
            completed: false,
            createdAt: new Date().toISOString(),
            category: completedTask.category,
            priority: completedTask.priority,
            recurrence: completedTask.recurrence,
            recurrenceInterval: completedTask.recurrenceInterval,
            recurrenceParentId: completedTask.recurrenceParentId || completedTask.id,
            // Inherit deadline from parent task
            deadlineDate: completedTask.deadlineDate,
            isExpired: false,
            alarmSnoozedCount: 0,
        };

        return newTask;
    }

    /**
     * Format recurrence info for display
     */
    static formatRecurrence(recurrence?: RecurrenceType, interval?: number): string {
        if (!recurrence || recurrence === 'none') {
            return '';
        }

        const intervalText = interval && interval > 1 ? `every ${interval} ` : '';

        switch (recurrence) {
            case 'daily':
                return `Repeats ${intervalText}${interval && interval > 1 ? 'days' : 'daily'}`;
            case 'weekly':
                return `Repeats ${intervalText}${interval && interval > 1 ? 'weeks' : 'weekly'}`;
            case 'monthly':
                return `Repeats ${intervalText}${interval && interval > 1 ? 'months' : 'monthly'}`;
            default:
                return '';
        }
    }

    /**
     * Check if a task is part of a recurring series
     */
    static isRecurringTask(task: Task): boolean {
        return Boolean(task.recurrence && task.recurrence !== 'none');
    }
}
