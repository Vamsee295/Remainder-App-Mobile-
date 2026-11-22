export type TaskCategory = 'work' | 'personal' | 'health' | 'shopping' | 'other';
export type TaskPriority = 'high' | 'medium' | 'low';
// 'weekly' / 'monthly' are legacy names for "daily for 7 / 30 days". Rules live in services/repeat-rules.ts.
export type RecurrenceType = 'none' | 'daily' | 'weekdays' | 'days' | 'monthDay' | 'weekly' | 'monthly';

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
  repeatDays?: number[]; // 'days': picked weekdays (0 = Sun); 'monthDay': [day of month]
  subTasks?: SubTask[]; // Array of sub-tasks/checklist items
  deadlineDate?: string | null; // null for Daily mode, ISO date for Weekly/Monthly
  isExpired?: boolean; // Track if alarm deadline has passed
  alarmSnoozedCount?: number; // Track how many times alarm was snoozed
  alarmEnabled?: boolean; // false = quiet notification only, no ringing alarm (default true)
  earlyMinutes?: number; // heads-up this many minutes before each reminder (0 / undefined = none)
  place?: TaskPlace; // also remind when arriving at / leaving this place
}

export interface TaskPlace {
  name: string;
  lat: number;
  lng: number;
  on: 'arrive' | 'leave';
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
  repeatDays?: number[];
  earlyMinutes?: number;
  subTasks?: SubTask[];
  place?: TaskPlace;
  enableAlarm?: boolean; // Toggle to enable/disable alarm functionality
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

export interface SnoozeOption {
  label: string;
  minutes: number;
}

export const SNOOZE_OPTIONS: SnoozeOption[] = [
  { label: '5 minutes', minutes: 5 },
  { label: '10 minutes', minutes: 10 },
  { label: '15 minutes', minutes: 15 },
  { label: '30 minutes', minutes: 30 },
];

export interface AlarmSound {
  id: string;
  name: string;
  description: string;
  soundFile?: any; // For custom sounds - require() reference
  isDefault: boolean;
  isCustom: boolean;
}

// Default alarm sounds (uses system notification sound)
export const DEFAULT_ALARM_SOUNDS: AlarmSound[] = [
  {
    id: 'default',
    name: 'Default Notification',
    description: 'System notification sound',
    isDefault: true,
    isCustom: false,
  },
  {
    id: 'classic_alarm',
    name: 'Classic Alarm',
    description: 'Traditional alarm beep',
    isDefault: true,
    isCustom: false,
  },
  {
    id: 'gentle_wake',
    name: 'Gentle Wake',
    description: 'Soft rising tone',
    isDefault: true,
    isCustom: false,
  },
  {
    id: 'urgent_beep',
    name: 'Urgent Beep',
    description: 'Fast beeping sound',
    isDefault: true,
    isCustom: false,
  },
  {
    id: 'morning_chime',
    name: 'Morning Chime',
    description: 'Pleasant chime melody',
    isDefault: true,
    isCustom: false,
  },
  {
    id: 'custom_1',
    name: 'Custom Sound 1',
    description: 'Add your own: custom_alarm_1.mp3',
    isDefault: false,
    isCustom: true,
  },
  {
    id: 'custom_2',
    name: 'Custom Sound 2',
    description: 'Add your own: custom_alarm_2.mp3',
    isDefault: false,
    isCustom: true,
  },
  {
    id: 'custom_3',
    name: 'Custom Sound 3',
    description: 'Add your own: custom_alarm_3.mp3',
    isDefault: false,
    isCustom: true,
  },
  {
    id: 'custom_4',
    name: 'Custom Sound 4',
    description: 'Add your own: custom_alarm_4.mp3',
    isDefault: false,
    isCustom: true,
  },
  {
    id: 'custom_5',
    name: 'Custom Sound 5',
    description: 'Add your own: custom_alarm_5.mp3',
    isDefault: false,
    isCustom: true,
  },
];

