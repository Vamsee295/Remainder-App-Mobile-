/**
 * One shared task store for every tab. Storage is the source of truth:
 * each action re-reads it, changes it, writes it, then refreshes state.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { AlarmService } from '@/services/alarm-service';
import { NotificationService } from '@/services/notification-service';
import { RecurrenceService } from '@/services/recurrence-service';
import { StorageService } from '@/services/storage-service';
import { Task, TaskFormData } from '@/types';

type TasksCtx = {
  tasks: Task[];
  reload: () => Promise<void>;
  saveTask: (data: TaskFormData, editing?: Task | null) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  snoozeTask: (id: string, minutes?: number) => Promise<void>;
};

const Ctx = createContext<TasksCtx | null>(null);

const newId = () => Date.now().toString() + Math.random().toString(36).slice(2, 11);

async function schedule(task: Task) {
  const ids = await NotificationService.scheduleNotification(task);
  if (ids) task.notificationIds = ids;
}

async function cancel(task: Task) {
  if (task.notificationIds?.length) await NotificationService.cancelMultipleNotifications(task.notificationIds);
}

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);

  const reload = async () => setTasks(await StorageService.loadTasks());

  /** Run an action, then always refresh from storage so the UI never drifts from what was saved. */
  const run = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (error) {
      console.error('Task action failed:', error);
    }
    await reload();
  };

  const saveTask = (data: TaskFormData, editing?: Task | null) =>
    run(async () => {
      const when = new Date(data.date);
      when.setHours(data.time.getHours(), data.time.getMinutes(), 0, 0);

      const createdAt = editing?.createdAt ?? new Date().toISOString();
      const task: Task = {
        ...(editing ?? { id: newId(), completed: false, createdAt }),
        title: data.title,
        description: data.description,
        dateTime: when.toISOString(),
        category: data.category,
        priority: data.priority,
        recurrence: data.recurrence,
        recurrenceInterval: data.recurrenceInterval,
        alarmEnabled: data.enableAlarm !== false,
        deadlineDate: AlarmService.calculateDeadlineDate(createdAt, data.recurrence),
        isExpired: false,
        alarmSnoozedCount: 0,
      };

      if (editing) await cancel(editing);
      await schedule(task);

      if (editing) {
        await StorageService.updateTask(task);
      } else {
        await StorageService.addTask(task);
        await StorageService.addTaskSuggestion(task);
      }
    });

  const toggleTask = (id: string) =>
    run(async () => {
      const task = (await StorageService.loadTasks()).find((t) => t.id === id);
      if (!task) return;
      const updated: Task = { ...task, completed: !task.completed };

      if (updated.completed) {
        await cancel(task);
        // A finished recurring task spawns its next occurrence.
        if (RecurrenceService.isRecurringTask(task)) {
          const next = RecurrenceService.createNextOccurrence(task);
          if (next) {
            await schedule(next);
            await StorageService.addTask(next);
          }
        }
      } else {
        // Un-ticking a repeat: drop the next occurrence that ticking created, or there would be two.
        if (RecurrenceService.isRecurringTask(task)) {
          const series = task.recurrenceParentId || task.id;
          const spawned = (await StorageService.loadTasks()).filter(
            (t) => t.id !== task.id && !t.completed && (t.recurrenceParentId || t.id) === series && t.dateTime > task.dateTime,
          );
          for (const t of spawned) {
            await cancel(t);
            await StorageService.deleteTask(t.id);
          }
        }
        await schedule(updated);
      }
      await StorageService.updateTask(updated);
    });

  const deleteTask = (id: string) =>
    run(async () => {
      const task = (await StorageService.loadTasks()).find((t) => t.id === id);
      if (!task) return;
      await cancel(task);
      await StorageService.deleteTask(id);
    });

  const snoozeTask = (id: string, minutes = 5) =>
    run(async () => {
      const task = (await StorageService.loadTasks()).find((t) => t.id === id);
      if (!task || task.completed) return;
      const updated: Task = {
        ...task,
        dateTime: new Date(Date.now() + minutes * 60000).toISOString(),
        alarmSnoozedCount: (task.alarmSnoozedCount || 0) + 1,
      };
      await cancel(task);
      await schedule(updated);
      await StorageService.updateTask(updated);
    });

  /** Apply Done / Snooze taps made on notifications or the alarm screen while the app was closed. */
  const applyNativeEvents = async () => {
    const events = await NotificationService.consumeNativeEvents();
    for (const event of events) {
      const task = (await StorageService.loadTasks()).find((t) => t.id === event.id);
      if (!task || task.completed) continue;
      if (event.type === 'done') {
        await toggleTask(task.id); // completes it, stops its alarm, creates the next repeat
      } else if (event.type === 'snooze' && event.time) {
        // The phone already rescheduled it; just show the new time.
        await StorageService.updateTask({ ...task, dateTime: new Date(event.time).toISOString(), alarmSnoozedCount: (task.alarmSnoozedCount || 0) + 1 });
      }
    }
    if (events.length) await reload();
  };

  useEffect(() => {
    reload();

    // Weekly / monthly alarms stop after their deadline: mark them expired.
    const checkExpired = async () => {
      try {
        await applyNativeEvents(); // first, so a snoozed repeat isn't treated as overdue below
        const expired = AlarmService.getExpiredTasks(await StorageService.loadTasks());
        if (expired.length) await StorageService.updateExpiredTasks(expired.map((t) => t.id));

        // A repeating task whose time (and its 10-min follow-ups) has passed moves to its next day,
        // so the list shows the next reminder instead of "Late", and its reminders get topped up.
        const stale = (await StorageService.loadTasks()).filter(
          (t) => RecurrenceService.isRecurringTask(t) && !t.completed && !t.isExpired && new Date(t.dateTime).getTime() < Date.now() - 15 * 60000,
        );
        for (const task of stale) {
          const next = RecurrenceService.getNextOccurrence(task);
          await cancel(task);
          if (!next || (task.deadlineDate && next > new Date(task.deadlineDate))) {
            await StorageService.updateTask({ ...task, isExpired: true });
            continue;
          }
          const moved: Task = { ...task, dateTime: next.toISOString(), alarmSnoozedCount: 0 };
          await schedule(moved);
          await StorageService.updateTask(moved);
        }
        if (expired.length || stale.length) await reload();
      } catch (error) {
        console.error('Error checking expired alarms:', error);
      }
    };
    checkExpired();
    const interval = setInterval(checkExpired, 5 * 60 * 1000);
    // Coming back to the app (e.g. after tapping Done on a notification) applies those taps at once.
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkExpired();
    });

    return () => {
      clearInterval(interval);
      appState.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Ctx.Provider value={{ tasks, reload, saveTask, toggleTask, deleteTask, snoozeTask }}>{children}</Ctx.Provider>;
}

export function useTasks() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTasks must be used inside TasksProvider');
  return ctx;
}
