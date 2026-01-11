export interface Task {
  id: string;
  title: string;
  description?: string;
  dateTime: string; // ISO 8601 format
  completed: boolean;
  notificationIds?: string[]; // Array to store multiple notification IDs
  createdAt: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  date: Date;
  time: Date;
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
}

export interface TodoFormData {
  text: string;
}
