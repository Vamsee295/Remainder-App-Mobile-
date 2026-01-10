export interface Task {
  id: string;
  title: string;
  description?: string;
  dateTime: string; // ISO 8601 format
  completed: boolean;
  notificationId?: string;
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
