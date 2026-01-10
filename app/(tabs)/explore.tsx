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
  }, []);

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
      };

      const notificationId = await NotificationService.scheduleNotification(newTask);
      if (notificationId) {
        newTask.notificationId = notificationId;
      }

      await StorageService.addTask(newTask);
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

      if (updatedTask.completed && task.notificationId) {
        await NotificationService.cancelNotification(task.notificationId);
      } else if (!updatedTask.completed) {
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

      if (task.notificationId) {
        await NotificationService.cancelNotification(task.notificationId);
      }

      await StorageService.deleteTask(taskId);
      setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
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
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Calendar</Text>
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
    paddingTop: 48, // Increased from 16 to avoid status bar overlap
    paddingBottom: 12,
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
