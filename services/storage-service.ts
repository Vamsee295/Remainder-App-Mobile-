import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, TodoItem, TaskSuggestion } from '@/types';

const TASKS_STORAGE_KEY = '@remainder_tasks';
const TODOS_STORAGE_KEY = '@remainder_todos';
const SUGGESTIONS_STORAGE_KEY = '@remainder_task_suggestions';

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

    // ===== TO-DO ITEMS =====

    /**
     * Save to-do items to AsyncStorage
     */
    static async saveTodos(todos: TodoItem[]): Promise<void> {
        try {
            const jsonValue = JSON.stringify(todos);
            await AsyncStorage.setItem(TODOS_STORAGE_KEY, jsonValue);
        } catch (error) {
            console.error('Error saving todos:', error);
            throw new Error('Failed to save todos');
        }
    }

    /**
     * Load to-do items from AsyncStorage
     */
    static async loadTodos(): Promise<TodoItem[]> {
        try {
            const jsonValue = await AsyncStorage.getItem(TODOS_STORAGE_KEY);

            if (jsonValue === null) {
                return [];
            }

            const todos: TodoItem[] = JSON.parse(jsonValue);
            return todos;
        } catch (error) {
            console.error('Error loading todos:', error);
            return [];
        }
    }

    /**
     * Add a new to-do item
     */
    static async addTodo(todo: TodoItem): Promise<void> {
        try {
            const todos = await this.loadTodos();
            todos.push(todo);
            await this.saveTodos(todos);
        } catch (error) {
            console.error('Error adding todo:', error);
            throw new Error('Failed to add todo');
        }
    }

    /**
     * Update an existing to-do item
     */
    static async updateTodo(updatedTodo: TodoItem): Promise<void> {
        try {
            const todos = await this.loadTodos();
            const todoIndex = todos.findIndex(todo => todo.id === updatedTodo.id);

            if (todoIndex === -1) {
                throw new Error('Todo not found');
            }

            todos[todoIndex] = updatedTodo;
            await this.saveTodos(todos);
        } catch (error) {
            console.error('Error updating todo:', error);
            throw new Error('Failed to update todo');
        }
    }

    /**
     * Delete a to-do item by ID
     */
    static async deleteTodo(todoId: string): Promise<void> {
        try {
            const todos = await this.loadTodos();
            const filteredTodos = todos.filter(todo => todo.id !== todoId);
            await this.saveTodos(filteredTodos);
        } catch (error) {
            console.error('Error deleting todo:', error);
            throw new Error('Failed to delete todo');
        }
    }

    // ===== TASK SUGGESTIONS =====

    /**
     * Load task suggestions from AsyncStorage
     */
    static async loadTaskSuggestions(): Promise<TaskSuggestion[]> {
        try {
            const jsonValue = await AsyncStorage.getItem(SUGGESTIONS_STORAGE_KEY);

            if (jsonValue === null) {
                return [];
            }

            const suggestions: TaskSuggestion[] = JSON.parse(jsonValue);
            return suggestions;
        } catch (error) {
            console.error('Error loading task suggestions:', error);
            return [];
        }
    }

    /**
     * Save task suggestions to AsyncStorage
     */
    static async saveTaskSuggestions(suggestions: TaskSuggestion[]): Promise<void> {
        try {
            const jsonValue = JSON.stringify(suggestions);
            await AsyncStorage.setItem(SUGGESTIONS_STORAGE_KEY, jsonValue);
        } catch (error) {
            console.error('Error saving task suggestions:', error);
            throw new Error('Failed to save task suggestions');
        }
    }

    /**
     * Add a task suggestion from a task
     */
    static async addTaskSuggestion(task: Task): Promise<void> {
        try {
            const suggestions = await this.loadTaskSuggestions();
            const taskDate = new Date(task.dateTime);
            const hour = taskDate.getHours();
            const minute = taskDate.getMinutes();

            // Check if a similar suggestion exists (same title and time)
            const existingIndex = suggestions.findIndex(
                s => s.title.toLowerCase() === task.title.toLowerCase() &&
                    s.hour === hour &&
                    s.minute === minute
            );

            if (existingIndex !== -1) {
                // Update existing suggestion
                suggestions[existingIndex] = {
                    ...suggestions[existingIndex],
                    description: task.description,
                    usageCount: suggestions[existingIndex].usageCount + 1,
                    lastUsed: new Date().toISOString(),
                };
            } else {
                // Create new suggestion
                const newSuggestion: TaskSuggestion = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    title: task.title,
                    description: task.description,
                    hour,
                    minute,
                    usageCount: 1,
                    lastUsed: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                };
                suggestions.push(newSuggestion);
            }

            await this.saveTaskSuggestions(suggestions);
        } catch (error) {
            console.error('Error adding task suggestion:', error);
            throw new Error('Failed to add task suggestion');
        }
    }

    /**
     * Update suggestion usage count
     */
    static async updateSuggestionUsage(suggestionId: string): Promise<void> {
        try {
            const suggestions = await this.loadTaskSuggestions();
            const suggestionIndex = suggestions.findIndex(s => s.id === suggestionId);

            if (suggestionIndex !== -1) {
                suggestions[suggestionIndex] = {
                    ...suggestions[suggestionIndex],
                    usageCount: suggestions[suggestionIndex].usageCount + 1,
                    lastUsed: new Date().toISOString(),
                };
                await this.saveTaskSuggestions(suggestions);
            }
        } catch (error) {
            console.error('Error updating suggestion usage:', error);
            throw new Error('Failed to update suggestion usage');
        }
    }
}
