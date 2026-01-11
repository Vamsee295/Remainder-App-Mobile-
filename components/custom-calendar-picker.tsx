import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

interface CustomCalendarPickerProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    minimumDate?: Date;
}

export function CustomCalendarPicker({
    selectedDate,
    onDateChange,
    minimumDate = new Date()
}: CustomCalendarPickerProps) {
    const [currentMonth, setCurrentMonth] = useState(selectedDate);

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

    const isPastDate = (date: Date): boolean => {
        if (date.getTime() === 0) return true;
        const minDate = new Date(minimumDate);
        minDate.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate < minDate;
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

    const handleDateSelect = (date: Date) => {
        if (date.getTime() !== 0 && !isPastDate(date)) {
            onDateChange(date);
        }
    };

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
                    const isSelected = isSameDay(date, selectedDate);
                    const isCurrentDay = isToday(date);
                    const isPlaceholder = date.getTime() === 0;
                    const isPast = isPastDate(date);
                    const isHighlighted = isSelected || isCurrentDay;

                    return (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.dayCell,
                                isHighlighted && styles.dayCellHighlighted,
                            ]}
                            onPress={() => handleDateSelect(date)}
                            disabled={isPlaceholder || isPast}
                        >
                            {!isPlaceholder && (
                                <Text
                                    style={[
                                        styles.dayText,
                                        isHighlighted && styles.dayTextHighlighted,
                                        isPast && styles.dayTextDisabled,
                                    ]}
                                >
                                    {date.getDate()}
                                </Text>
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
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
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
        fontSize: 16,
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
        gap: 6,
    },
    dayCell: {
        width: `${(100 / 7) - 1}%`,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
    },
    dayCellHighlighted: {
        backgroundColor: Colors.primary,
        borderRadius: 8,
    },
    dayText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
    },
    dayTextHighlighted: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    dayTextDisabled: {
        color: Colors.textDisabled,
    },
});
