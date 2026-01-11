import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar, ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, TaskFormData } from '@/types';
import { StorageService } from '@/services/storage-service';
import { NotificationService } from '@/services/notification-service';
import { RecurrenceService } from '@/services/recurrence-service';
import { CalendarView } from '@/components/calendar-view';
import { TaskCard } from '@/components/task-card';
import { AddTaskModal } from '@/components/add-task-modal';
import { EmptyState } from '@/components/empty-state';
import { Colors } from '@/constants/theme';

export default function CalendarScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadTasks();
    setupNotificationListeners();
  }, []);

  const setupNotificationListeners = () => {
    return NotificationService.setupNotificationListeners(
      (notification) => {
        console.log('Received notification:', notification);

        // Auto-snooze logic: if task is still incomplete after 30 seconds, snooze it
        const taskId = notification.request.content.data?.taskId as string;
        if (taskId) {
          setTimeout(async () => {
            // Reload tasks to get latest state
            const currentTasks = await StorageService.loadTasks();
            const task = currentTasks.find(t => t.id === taskId);

            // If task exists and is not completed, auto-snooze it
            if (task && !task.completed) {
              console.log('Auto-snoozing task:', task.title);
              handleSnoozeTask(taskId);
            }
          }, 30000); // 30 seconds delay
        }
      },
      (response) => {
        console.log('User tapped notification:', response);
      }
    );
  };

  const loadTasks = async () => {
    try {
      const loadedTasks = await StorageService.loadTasks();
      setTasks(loadedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const getTasksForSelectedDate = (): Task[] => {
    return tasks.filter(task => {
      const taskDate = new Date(task.dateTime);
      return (
        taskDate.getDate() === selectedDate.getDate() &&
        taskDate.getMonth() === selectedDate.getMonth() &&
        taskDate.getFullYear() === selectedDate.getFullYear()
      );
    }).sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  };

  const handleSaveTask = async (taskData: TaskFormData) => {
    try {
      const combinedDateTime = new Date(taskData.date);
      combinedDateTime.setHours(taskData.time.getHours());
      combinedDateTime.setMinutes(taskData.time.getMinutes());

      const newTask: Task = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        title: taskData.title,
        description: taskData.description,
        dateTime: combinedDateTime.toISOString(),
        completed: false,
        createdAt: new Date().toISOString(),
        category: taskData.category,
        priority: taskData.priority,
        recurrence: taskData.recurrence,
        recurrenceInterval: taskData.recurrenceInterval,
      };

      const notificationIds = await NotificationService.scheduleNotification(newTask);
      if (notificationIds) {
        newTask.notificationIds = notificationIds;
      }

      await StorageService.addTask(newTask);

      // Save task as a suggestion for future use
      console.log('Saving task as suggestion:', newTask);
      await StorageService.addTaskSuggestion(newTask);
      console.log('Task suggestion saved successfully');

      setTasks(prevTasks => [...prevTasks, newTask]);
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleToggleComplete = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const updatedTask: Task = {
        ...task,
        completed: !task.completed,
      };

      if (updatedTask.completed && task.notificationIds) {
        await NotificationService.cancelMultipleNotifications(task.notificationIds);
      } else if (!updatedTask.completed) {
        const notificationIds = await NotificationService.scheduleNotification(updatedTask);
        if (notificationIds) {
          updatedTask.notificationIds = notificationIds;
        }
      }

      await StorageService.updateTask(updatedTask);
      setTasks(prevTasks =>
        prevTasks.map(t => (t.id === taskId ? updatedTask : t))
      );

      // If marking as complete and task is recurring, create next occurrence
      if (updatedTask.completed && RecurrenceService.isRecurringTask(task)) {
        const nextTask = RecurrenceService.createNextOccurrence(task);
        if (nextTask) {
          const notificationIds = await NotificationService.scheduleNotification(nextTask);
          if (notificationIds) {
            nextTask.notificationIds = notificationIds;
          }
          await StorageService.addTask(nextTask);
          setTasks(prevTasks => [...prevTasks, nextTask]);
        }
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      if (task.notificationIds) {
        await NotificationService.cancelMultipleNotifications(task.notificationIds);
      }

      await StorageService.deleteTask(taskId);
      setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleSnoozeTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const now = new Date();
      const snoozeTime = new Date(now.getTime() + 5 * 60000); // 5 minutes from now

      const updatedTask: Task = {
        ...task,
        dateTime: snoozeTime.toISOString(),
      };

      if (task.notificationIds) {
        await NotificationService.cancelMultipleNotifications(task.notificationIds);
      }

      const notificationIds = await NotificationService.scheduleNotification(updatedTask);
      if (notificationIds) {
        updatedTask.notificationIds = notificationIds;
      }

      await StorageService.updateTask(updatedTask);
      setTasks(prevTasks =>
        prevTasks.map(t => (t.id === taskId ? updatedTask : t))
      );
    } catch (error) {
      console.error('Error snoozing task:', error);
    }
  };

  const tasksForDate = getTasksForSelectedDate();
  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="calendar" size={32} color={Colors.primary} />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Calendar</Text>
            </View>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Calendar */}
          <CalendarView
            tasks={tasks}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />

          {/* Selected Date Section */}
          <View style={styles.selectedDateSection}>
            <View style={styles.selectedDateHeader}>
              <Text style={styles.selectedDateText}>{formattedDate}</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setModalVisible(true)}
              >
                <Ionicons name="add-circle" size={24} color={Colors.primary} />
                <Text style={styles.addButtonText}>Add Task</Text>
              </TouchableOpacity>
            </View>

            {/* Tasks for Selected Date */}
            <View style={styles.tasksContainer}>
              {tasksForDate.length > 0 ? (
                tasksForDate.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={handleToggleComplete}
                    onDelete={handleDeleteTask}
                    onSnooze={handleSnoozeTask}
                  />
                ))
              ) : (
                <EmptyState
                  icon="calendar-outline"
                  message="No tasks for this date"
                  submessage="Tap the Add Task button to create one"
                />
              )}
            </View>
          </View>
        </ScrollView>

        {/* Add Task Modal */}
        <AddTaskModal
          visible={modalVisible}
          prefilledDate={selectedDate}
          onSave={handleSaveTask}
          onCancel={() => setModalVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
  },
  selectedDateSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  selectedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  tasksContainer: {
    paddingBottom: 100,
  },
});
