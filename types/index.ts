export type TaskCategory = 'work' | 'personal' | 'health' | 'shopping' | 'other';
export type TaskPriority = 'high' | 'medium' | 'low';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dateTime: string; // ISO 8601 format
  completed: boolean;
  notificationIds?: string[]; // Array to store multiple notification IDs
  createdAt: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  recurrence?: RecurrenceType;
  recurrenceInterval?: number; // e.g., every 2 days, every 3 weeks
  recurrenceParentId?: string; // Links to original recurring task
  subTasks?: SubTask[]; // Array of sub-tasks/checklist items
}

export interface TaskFormData {
  title: string;
  description?: string;
  date: Date;
  time: Date;
  category?: TaskCategory;
  priority?: TaskPriority;
  recurrence?: RecurrenceType;
  recurrenceInterval?: number;
}

export type TaskFilter = 'active' | 'completed' | 'all';

export interface TaskSection {
  title: string;
  data: Task[];
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  deadline?: string; // Optional deadline in ISO 8601 format
}

export interface TodoFormData {
  text: string;
  deadline?: Date;
}

export interface TaskSuggestion {
  id: string;
  title: string;
  description?: string;
  hour: number;  // 0-23
  minute: number; // 0-59
  usageCount: number; // How many times this suggestion was used
  lastUsed: string; // ISO timestamp
  createdAt: string; // ISO timestamp
}
