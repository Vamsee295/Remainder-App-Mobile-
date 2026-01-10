import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '@/types';
import { Colors } from '@/constants/theme';

interface CalendarViewProps {
    tasks: Task[];
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
}

export function CalendarView({ tasks, selectedDate, onDateSelect }: CalendarViewProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const getDaysInMonth = (date: Date): Date[] => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days: Date[] = [];

        // Add empty days for padding before first day
        const firstDayOfWeek = firstDay.getDay();
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(new Date(0)); // Placeholder
        }

        // Add all days in month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    const getTasksForDate = (date: Date): Task[] => {
        if (date.getTime() === 0) return []; // Skip placeholder days

        return tasks.filter(task => {
            const taskDate = new Date(task.dateTime);
            return (
                taskDate.getDate() === date.getDate() &&
                taskDate.getMonth() === date.getMonth() &&
                taskDate.getFullYear() === date.getFullYear()
            );
        });
    };

    const isSameDay = (date1: Date, date2: Date): boolean => {
        if (date1.getTime() === 0 || date2.getTime() === 0) return false;
        return (
            date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear()
        );
    };

    const isToday = (date: Date): boolean => {
        if (date.getTime() === 0) return false;
        return isSameDay(date, new Date());
    };

    const goToPreviousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const days = getDaysInMonth(currentMonth);
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const monthName = currentMonth.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
    });

    return (
        <View style={styles.container}>
            {/* Month Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthButton}>
                    <Ionicons name="chevron-back" size={24} color={Colors.text} />
                </TouchableOpacity>

                <Text style={styles.monthText}>{monthName}</Text>

                <TouchableOpacity onPress={goToNextMonth} style={styles.monthButton}>
                    <Ionicons name="chevron-forward" size={24} color={Colors.text} />
                </TouchableOpacity>
            </View>

            {/* Week Day Headers */}
            <View style={styles.weekDaysContainer}>
                {weekDays.map((day, index) => (
                    <View key={index} style={styles.weekDayCell}>
                        <Text style={styles.weekDayText}>{day}</Text>
                    </View>
                ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
                {days.map((date, index) => {
                    const dayTasks = getTasksForDate(date);
                    const isSelected = isSameDay(date, selectedDate);
                    const isCurrentDay = isToday(date);
                    const isPlaceholder = date.getTime() === 0;
                    const hasActiveTasks = dayTasks.some(t => !t.completed);

                    return (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.dayCell,
                                isSelected && styles.dayCellSelected,
                                isCurrentDay && styles.dayCellToday,
                            ]}
                            onPress={() => !isPlaceholder && onDateSelect(date)}
                            disabled={isPlaceholder}
                        >
                            {!isPlaceholder && (
                                <>
                                    <Text
                                        style={[
                                            styles.dayText,
                                            isSelected && styles.dayTextSelected,
                                            isCurrentDay && styles.dayTextToday,
                                        ]}
                                    >
                                        {date.getDate()}
                                    </Text>
                                    {dayTasks.length > 0 && (
                                        <View style={styles.taskIndicatorsContainer}>
                                            {dayTasks.slice(0, 3).map((task, idx) => (
                                                <View
                                                    key={idx}
                                                    style={[
                                                        styles.taskIndicator,
                                                        { backgroundColor: task.completed ? Colors.success : Colors.primary },
                                                    ]}
                                                />
                                            ))}
                                        </View>
                                    )}
                                </>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    monthButton: {
        padding: 8,
    },
    monthText: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    weekDaysContainer: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    weekDayCell: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    weekDayText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: `${100 / 7}%`,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
        marginBottom: 8,
    },
    dayCellSelected: {
        backgroundColor: Colors.primary,
        borderRadius: 8,
    },
    dayCellToday: {
        borderWidth: 2,
        borderColor: Colors.secondary,
        borderRadius: 8,
    },
    dayText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    dayTextSelected: {
        color: Colors.background,
    },
    dayTextToday: {
        color: Colors.secondary,
    },
    taskIndicatorsContainer: {
        flexDirection: 'row',
        gap: 2,
        marginTop: 2,
    },
    taskIndicator: {
        width: 4,
        height: 4,
        borderRadius: 2,
    },
});
