import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TaskPriority } from '@/types';
import { PRIORITIES } from '@/constants/categories';
import { Colors } from '@/constants/theme';

interface PrioritySelectorProps {
    selectedPriority?: TaskPriority;
    onSelectPriority: (priority: TaskPriority) => void;
}

export function PrioritySelector({ selectedPriority, onSelectPriority }: PrioritySelectorProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityContainer}>
                {PRIORITIES.map((priority) => {
                    const isSelected = selectedPriority === priority.value;
                    return (
                        <TouchableOpacity
                            key={priority.value}
                            style={[
                                styles.priorityChip,
                                isSelected && {
                                    backgroundColor: priority.color + '20',
                                    borderColor: priority.color,
                                }
                            ]}
                            onPress={() => onSelectPriority(priority.value)}
                            activeOpacity={0.7}
                        >
                            <View
                                style={[
                                    styles.priorityDot,
                                    { backgroundColor: priority.color }
                                ]}
                            />
                            <Text style={[
                                styles.priorityText,
                                isSelected && { color: priority.color, fontWeight: '700' }
                            ]}>
                                {priority.label}
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
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 8,
    },
    priorityContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    priorityChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: Colors.surfaceVariant,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    priorityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    priorityText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
});
