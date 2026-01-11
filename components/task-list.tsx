import React from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    SectionList,
    RefreshControl,
    Text,
} from 'react-native';
import { Task, TaskFilter } from '@/types';
import { TaskCard } from './task-card';
import { EmptyState } from './empty-state';
import { Colors } from '@/constants/theme';

interface TaskListProps {
    tasks: Task[];
    filter: TaskFilter;
    onToggleComplete: (taskId: string) => void;
    onDelete: (taskId: string) => void;
    onEdit: (task: Task) => void;
    onSnooze: (taskId: string) => void;
    onRefresh: () => void;
    refreshing?: boolean;
}

interface TaskSection {
    title: string;
    data: Task[];
}

export function TaskList({
    tasks,
    filter,
    onToggleComplete,
    onDelete,
    onEdit,
    onSnooze,
    onRefresh,
    refreshing = false,
}: TaskListProps) {
    const getFilteredTasks = (): Task[] => {
        let filtered: Task[];

        switch (filter) {
            case 'active':
                filtered = tasks.filter(task => !task.completed);
                break;
            case 'completed':
                filtered = tasks.filter(task => task.completed);
                break;
            default:
                filtered = tasks;
        }

        return filtered;
    };

    const getSortedTasks = (tasksToSort: Task[]): Task[] => {
        return [...tasksToSort].sort((a, b) => {
            const dateA = new Date(a.dateTime).getTime();
            const dateB = new Date(b.dateTime).getTime();
            return dateA - dateB;
        });
    };

    const groupTasksByDate = (tasksToGroup: Task[]): TaskSection[] => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const weekFromNow = new Date(now);
        weekFromNow.setDate(weekFromNow.getDate() + 7);

        const sections: TaskSection[] = [];

        // Past Due (only for active tasks)
        if (filter === 'active' || filter === 'all') {
            const pastDue = tasksToGroup.filter(task => {
                const taskDate = new Date(task.dateTime);
                return taskDate < now && !task.completed;
            });
            if (pastDue.length > 0) {
                sections.push({ title: 'Past Due', data: pastDue });
            }
        }

        // Today
        const today = tasksToGroup.filter(task => {
            const taskDate = new Date(task.dateTime);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate.getTime() === now.getTime();
        });
        if (today.length > 0) {
            sections.push({ title: 'Today', data: today });
        }

        // Tomorrow
        const tomorrowTasks = tasksToGroup.filter(task => {
            const taskDate = new Date(task.dateTime);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate.getTime() === tomorrow.getTime();
        });
        if (tomorrowTasks.length > 0) {
            sections.push({ title: 'Tomorrow', data: tomorrowTasks });
        }

        // This Week
        const thisWeek = tasksToGroup.filter(task => {
            const taskDate = new Date(task.dateTime);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate > tomorrow && taskDate < weekFromNow;
        });
        if (thisWeek.length > 0) {
            sections.push({ title: 'This Week', data: thisWeek });
        }

        // Later
        const later = tasksToGroup.filter(task => {
            const taskDate = new Date(task.dateTime);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate >= weekFromNow;
        });
        if (later.length > 0) {
            sections.push({ title: 'Later', data: later });
        }

        return sections;
    };

    const filteredTasks = getFilteredTasks();
    const sortedTasks = getSortedTasks(filteredTasks);
    const sections = groupTasksByDate(sortedTasks);

    if (filteredTasks.length === 0) {
        const emptyMessages = {
            active: {
                icon: 'checkmark-done-circle-outline' as const,
                message: 'No active tasks',
                submessage: 'Tap the + button to create a new task',
            },
            completed: {
                icon: 'checkbox-outline' as const,
                message: 'No completed tasks yet',
                submessage: 'Complete tasks will appear here',
            },
            all: {
                icon: 'list-outline' as const,
                message: 'No tasks yet',
                submessage: 'Start by creating your first task',
            },
        };

        const emptyConfig = emptyMessages[filter];

        return (
            <View style={styles.container}>
                <EmptyState
                    icon={emptyConfig.icon}
                    message={emptyConfig.message}
                    submessage={emptyConfig.submessage}
                />
            </View>
        );
    }

    return (
        <SectionList
            sections={sections}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
                <TaskCard
                    task={item}
                    onToggleComplete={onToggleComplete}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onSnooze={onSnooze}
                />
            )}
            renderSectionHeader={({ section: { title } }) => (
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderLine} />
                    <View style={styles.sectionHeaderTextContainer}>
                        <Text style={styles.sectionHeaderText}>
                            {title}
                        </Text>
                    </View>
                    <View style={styles.sectionHeaderLine} />
                </View>
            )}
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={Colors.primary}
                    colors={[Colors.primary]}
                />
            }
        />
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 12,
    },
    sectionHeaderLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.divider,
    },
    sectionHeaderTextContainer: {
        paddingHorizontal: 12,
    },
    sectionHeaderText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
