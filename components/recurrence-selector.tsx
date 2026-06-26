import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecurrenceType } from '@/types';
import { Colors } from '@/constants/theme';

interface RecurrenceSelectorProps {
    selectedRecurrence: RecurrenceType;
    onSelectRecurrence: (recurrence: RecurrenceType) => void;
}

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string; icon: string }[] = [
    { value: 'none', label: 'None', icon: 'close-circle-outline' },
    { value: 'daily', label: 'Daily', icon: 'today-outline' },
    { value: 'weekly', label: 'Weekly', icon: 'calendar-outline' },
    { value: 'monthly', label: 'Monthly', icon: 'calendar' },
];

export function RecurrenceSelector({ selectedRecurrence, onSelectRecurrence }: RecurrenceSelectorProps) {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="repeat" size={16} color={Colors.textSecondary} />
                <Text style={styles.label}>Repeat</Text>
            </View>
            <View style={styles.optionsContainer}>
                {RECURRENCE_OPTIONS.map((option) => {
                    const isSelected = selectedRecurrence === option.value;
                    return (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.optionChip,
                                isSelected && styles.optionChipSelected,
                            ]}
                            onPress={() => onSelectRecurrence(option.value)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={option.icon as any}
                                size={16}
                                color={isSelected ? Colors.primary : Colors.textSecondary}
                            />
                            <Text style={[
                                styles.optionText,
                                isSelected && styles.optionTextSelected,
                            ]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.surfaceVariant,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    optionChipSelected: {
        backgroundColor: Colors.primary + '20',
        borderColor: Colors.primary,
    },
    optionText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    optionTextSelected: {
        color: Colors.primary,
        fontWeight: '700',
    },
});
