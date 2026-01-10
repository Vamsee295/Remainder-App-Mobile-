import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Task, TaskFilter, TaskFormData } from '@/types';
import { StorageService } from '@/services/storage-service';
import { NotificationService } from '@/services/notification-service';
import { TaskList } from '@/components/task-list';
import { AddTaskModal } from '@/components/add-task-modal';
import { FloatingActionButton } from '@/components/floating-action-button';
import { Colors } from '@/constants/theme';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>('active');
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
        };

        // Cancel old notification
        if (editingTask.notificationId) {
          await NotificationService.cancelNotification(editingTask.notificationId);
        }

        // Schedule new notification
        const notificationId = await NotificationService.scheduleNotification(updatedTask);
        if (notificationId) {
          updatedTask.notificationId = notificationId;
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
        };

        // Schedule notification
        const notificationId = await NotificationService.scheduleNotification(newTask);
        if (notificationId) {
          newTask.notificationId = notificationId;
        }

        await StorageService.addTask(newTask);
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

      // Cancel notification if completing task
      if (updatedTask.completed && task.notificationId) {
        await NotificationService.cancelNotification(task.notificationId);
      }
      // Reschedule notification if uncompleting task
      else if (!updatedTask.completed) {
        const notificationId = await NotificationService.scheduleNotification(updatedTask);
        if (notificationId) {
          updatedTask.notificationId = notificationId;
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

      // Cancel notification
      if (task.notificationId) {
        await NotificationService.cancelNotification(task.notificationId);
      }

      await StorageService.deleteTask(taskId);
      setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const activeTasks = tasks.filter(t => !t.completed).length;
  const completedTasks = tasks.filter(t => t.completed).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Tasks</Text>
            <Text style={styles.headerSubtitle}>
              {activeTasks} active • {completedTasks} completed
            </Text>
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
          tasks={tasks}
          filter={filter}
          onToggleComplete={handleToggleComplete}
          onDelete={handleDeleteTask}
          onEdit={handleEditTask}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48, // Increased from 16 to avoid status bar overlap
    paddingBottom: 12,
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

