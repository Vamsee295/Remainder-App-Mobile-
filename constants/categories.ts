import { C } from '@/constants/theme';
import { RecurrenceType, TaskCategory, TaskPriority } from '@/types';

/** color = text/dot color, tint = soft badge background */
export const CATEGORIES: { value: TaskCategory; label: string; color: string; tint: string }[] = [
    { value: 'work', label: 'Work', color: C.accent, tint: C.accentLight },
    { value: 'personal', label: 'Personal', color: C.teal, tint: '#cfe6df' },
    { value: 'health', label: 'Health', color: '#2f7d68', tint: '#d5efe7' },
    { value: 'shopping', label: 'Shopping', color: '#a87512', tint: '#f7e4b5' },
    { value: 'other', label: 'Other', color: C.ink, tint: C.paper2 },
];

export const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'high', label: 'High', color: C.accentD },
    { value: 'medium', label: 'Medium', color: C.gold },
    { value: 'low', label: 'Low', color: C.teal },
];

export const RECURRENCES: { value: RecurrenceType; label: string; note: string }[] = [
    { value: 'none', label: 'Once', note: 'Rings one time.' },
    { value: 'daily', label: 'Daily', note: 'Rings every day until you stop it.' },
    { value: 'weekly', label: '7 days', note: 'Rings daily for 7 days, then stops by itself.' },
    { value: 'monthly', label: '30 days', note: 'Rings daily for 30 days, then stops by itself.' },
];

export const getCategoryConfig = (category?: TaskCategory) =>
    CATEGORIES.find(c => c.value === category) || CATEGORIES[4];

export const getPriorityConfig = (priority?: TaskPriority) =>
    PRIORITIES.find(p => p.value === priority) || PRIORITIES[2];
