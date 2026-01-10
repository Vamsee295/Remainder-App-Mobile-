import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '@/types';

const TASKS_STORAGE_KEY = '@remainder_tasks';

export class StorageService {
    /**
     * Save tasks to AsyncStorage
     */
    static async saveTasks(tasks: Task[]): Promise<void> {
        try {
            const jsonValue = JSON.stringify(tasks);
            await AsyncStorage.setItem(TASKS_STORAGE_KEY, jsonValue);
        } catch (error) {
            console.error('Error saving tasks:', error);
            throw new Error('Failed to save tasks');
        }
    }

    /**
     * Load tasks from AsyncStorage
     */
    static async loadTasks(): Promise<Task[]> {
        try {
            const jsonValue = await AsyncStorage.getItem(TASKS_STORAGE_KEY);

            if (jsonValue === null) {
                return [];
            }

            const tasks: Task[] = JSON.parse(jsonValue);
            return tasks;
        } catch (error) {
            console.error('Error loading tasks:', error);
            return [];
        }
    }

    /**
     * Delete a task by ID
     */
    static async deleteTask(taskId: string): Promise<void> {
        try {
            const tasks = await this.loadTasks();
            const filteredTasks = tasks.filter(task => task.id !== taskId);
            await this.saveTasks(filteredTasks);
        } catch (error) {
            console.error('Error deleting task:', error);
            throw new Error('Failed to delete task');
        }
    }

    /**
     * Update an existing task
     */
    static async updateTask(updatedTask: Task): Promise<void> {
        try {
            const tasks = await this.loadTasks();
            const taskIndex = tasks.findIndex(task => task.id === updatedTask.id);

            if (taskIndex === -1) {
                throw new Error('Task not found');
            }

            tasks[taskIndex] = updatedTask;
            await this.saveTasks(tasks);
        } catch (error) {
            console.error('Error updating task:', error);
            throw new Error('Failed to update task');
        }
    }

    /**
     * Add a new task
     */
    static async addTask(task: Task): Promise<void> {
        try {
            const tasks = await this.loadTasks();
            tasks.push(task);
            await this.saveTasks(tasks);
        } catch (error) {
            console.error('Error adding task:', error);
            throw new Error('Failed to add task');
        }
    }

    /**
     * Clear all tasks (for debugging/testing)
     */
    static async clearAllTasks(): Promise<void> {
        try {
            await AsyncStorage.removeItem(TASKS_STORAGE_KEY);
        } catch (error) {
            console.error('Error clearing tasks:', error);
            throw new Error('Failed to clear tasks');
        }
    }
}
