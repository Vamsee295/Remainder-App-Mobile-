import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, TaskFilter, TaskFormData, TaskCategory, TaskPriority } from '@/types';
import { StorageService } from '@/services/storage-service';
import { NotificationService } from '@/services/notification-service';
import { RecurrenceService } from '@/services/recurrence-service';
import { TaskList } from '@/components/task-list';
import { AddTaskModal } from '@/components/add-task-modal';
import { FloatingActionButton } from '@/components/floating-action-button';
import { FilterDropdown } from '@/components/filter-dropdown';
import { Colors } from '@/constants/theme';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>('active');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | 'all'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load tasks on mount
  useEffect(() => {
    loadTasks();
    requestNotificationPermissions();
    setupNotificationListeners();
  }, []);

  const requestNotificationPermissions = async () => {
    const granted = await NotificationService.requestPermissions();
    if (!granted) {
      console.warn('Notification permissions not granted');
    }
  };

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
        // Optionally navigate to specific task or highlight it
      }
    );
  };

  const loadTasks = async () => {
    try {
      const loadedTasks = await StorageService.loadTasks();
      setTasks(loadedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadTasks();
  }, []);

  const handleAddTask = () => {
    setEditingTask(null);
    setModalVisible(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setModalVisible(true);
  };

  const handleSaveTask = async (taskData: TaskFormData) => {
    try {
      // Combine date and time
      const combinedDateTime = new Date(taskData.date);
      combinedDateTime.setHours(taskData.time.getHours());
      combinedDateTime.setMinutes(taskData.time.getMinutes());

      if (editingTask) {
        // Update existing task
        const updatedTask: Task = {
          ...editingTask,
          title: taskData.title,
          description: taskData.description,
          dateTime: combinedDateTime.toISOString(),
          category: taskData.category,
          priority: taskData.priority,
          recurrence: taskData.recurrence,
          recurrenceInterval: taskData.recurrenceInterval,
        };

        // Cancel old notifications
        if (editingTask.notificationIds) {
          await NotificationService.cancelMultipleNotifications(editingTask.notificationIds);
        }

        // Schedule new notifications (3 total)
        const notificationIds = await NotificationService.scheduleNotification(updatedTask);
        if (notificationIds) {
          updatedTask.notificationIds = notificationIds;
        }

        await StorageService.updateTask(updatedTask);
        setTasks(prevTasks =>
          prevTasks.map(t => (t.id === updatedTask.id ? updatedTask : t))
        );
      } else {
        // Create new task
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

        // Schedule notifications (3 total)
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
      }

      setModalVisible(false);
      setEditingTask(null);
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

      // Cancel notifications if completing task
      if (updatedTask.completed && task.notificationIds) {
        await NotificationService.cancelMultipleNotifications(task.notificationIds);

        // If task is recurring and being completed, create next occurrence
        if (RecurrenceService.isRecurringTask(task)) {
          const nextTask = RecurrenceService.createNextOccurrence(task);
          if (nextTask) {
            // Schedule notifications for the next occurrence
            const notificationIds = await NotificationService.scheduleNotification(nextTask);
            if (notificationIds) {
              nextTask.notificationIds = notificationIds;
            }

            // Save the next occurrence
            await StorageService.addTask(nextTask);
            setTasks(prevTasks => [...prevTasks, nextTask]);
          }
        }
      }
      // Reschedule notifications if uncompleting task
      else if (!updatedTask.completed) {
        const notificationIds = await NotificationService.scheduleNotification(updatedTask);
        if (notificationIds) {
          updatedTask.notificationIds = notificationIds;
        }
      }

      await StorageService.updateTask(updatedTask);
      setTasks(prevTasks =>
        prevTasks.map(t => (t.id === taskId ? updatedTask : t))
      );
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // Cancel notifications
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

      // Cancel old notifications
      if (task.notificationIds) {
        await NotificationService.cancelMultipleNotifications(task.notificationIds);
      }

      // Schedule new notifications
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

  // Apply category and priority filters
  const getFilteredAndSortedTasks = (): Task[] => {
    let filtered = [...tasks];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Sort by priority
    if (selectedPriority !== 'all') {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      filtered = filtered.sort((a, b) => {
        const aPriority = a.priority || 'low';
        const bPriority = b.priority || 'low';

        if (selectedPriority === aPriority && selectedPriority !== bPriority) {
          return -1;
        }
        if (selectedPriority === bPriority && selectedPriority !== aPriority) {
          return 1;
        }

        return priorityOrder[aPriority] - priorityOrder[bPriority];
      });
    }

    return filtered;
  };

  const filteredTasks = getFilteredAndSortedTasks();
  const activeTasks = filteredTasks.filter(t => !t.completed).length;
  const completedTasks = filteredTasks.filter(t => t.completed).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerContent}>
              <Ionicons name="list" size={32} color={Colors.primary} />
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>My Tasks</Text>
                <Text style={styles.headerSubtitle}>
                  {activeTasks} active • {completedTasks} completed
                </Text>
              </View>
            </View>
            <FilterDropdown
              selectedCategory={selectedCategory}
              selectedPriority={selectedPriority}
              onCategoryChange={setSelectedCategory}
              onPriorityChange={setSelectedPriority}
            />
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'active' && styles.filterTabActive]}
            onPress={() => setFilter('active')}
          >
            <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
              Active
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, filter === 'completed' && styles.filterTabActive]}
            onPress={() => setFilter('completed')}
          >
            <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>
              Completed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>
        </View>

        {/* Task List */}
        <TaskList
          tasks={filteredTasks}
          filter={filter}
          onToggleComplete={handleToggleComplete}
          onDelete={handleDeleteTask}
          onEdit={handleEditTask}
          onSnooze={handleSnoozeTask}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />

        {/* FAB */}
        <FloatingActionButton onPress={handleAddTask} />

        {/* Add/Edit Task Modal */}
        <AddTaskModal
          visible={modalVisible}
          task={editingTask}
          onSave={handleSaveTask}
          onCancel={() => {
            setModalVisible(false);
            setEditingTask(null);
          }}
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
    gap: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceVariant,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.background,
  },
});

