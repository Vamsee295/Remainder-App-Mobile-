import { TaskCategory, TaskPriority } from '@/types';

export const CATEGORIES: { value: TaskCategory; label: string; color: string; icon: string }[] = [
    { value: 'work', label: 'Work', color: '#3b82f6', icon: 'briefcase' },
    { value: 'personal', label: 'Personal', color: '#8b5cf6', icon: 'person' },
    { value: 'health', label: 'Health', color: '#10b981', icon: 'fitness' },
    { value: 'shopping', label: 'Shopping', color: '#f59e0b', icon: 'cart' },
    { value: 'other', label: 'Other', color: '#6b7280', icon: 'ellipsis-horizontal' },
];

export const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'high', label: 'High', color: '#ef4444' },
    { value: 'medium', label: 'Medium', color: '#f59e0b' },
    { value: 'low', label: 'Low', color: '#6b7280' },
];

export const getCategoryConfig = (category?: TaskCategory) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[4]; // default to 'other'
};

export const getPriorityConfig = (priority?: TaskPriority) => {
    return PRIORITIES.find(p => p.value === priority) || PRIORITIES[2]; // default to 'low'
};
