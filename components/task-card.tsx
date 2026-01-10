import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Task } from '@/types';
import { Colors } from '@/constants/theme';

interface TaskCardProps {
    task: Task;
    onToggleComplete: (taskId: string) => void;
    onDelete: (taskId: string) => void;
    onEdit?: (task: Task) => void;
}

export function TaskCard({ task, onToggleComplete, onDelete, onEdit }: TaskCardProps) {
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        onToggleComplete(task.id);
    };

    const handleDelete = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onDelete(task.id);
    };

    const handleEdit = () => {
        if (onEdit) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onEdit(task);
        }
    };

    const formatDateTime = (dateTime: string) => {
        const date = new Date(dateTime);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const isTomorrow = date.toDateString() === tomorrow.toDateString();

        const timeStr = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });

        if (isToday) {
            return `Today at ${timeStr}`;
        } else if (isTomorrow) {
            return `Tomorrow at ${timeStr}`;
        } else {
            return `${date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            })} at ${timeStr}`;
        }
    };

    const isPastDue = new Date(task.dateTime) < new Date() && !task.completed;

    return (
        <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity
                style={[
                    styles.card,
                    task.completed && styles.cardCompleted,
                    isPastDue && styles.cardPastDue,
                ]}
                onPress={handleEdit}
                activeOpacity={0.8}
            >
                <View style={styles.content}>
                    <TouchableOpacity
                        style={styles.checkbox}
                        onPress={handlePress}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <View style={[styles.checkboxCircle, task.completed && styles.checkboxCircleCompleted]}>
                            {task.completed && (
                                <Ionicons name="checkmark" size={18} color={Colors.background} />
                            )}
                        </View>
                    </TouchableOpacity>

                    <View style={styles.textContainer}>
                        <Text
                            style={[
                                styles.title,
                                task.completed && styles.titleCompleted,
                            ]}
                            numberOfLines={2}
                        >
                            {task.title}
                        </Text>

                        {task.description ? (
                            <Text
                                style={[
                                    styles.description,
                                    task.completed && styles.descriptionCompleted,
                                ]}
                                numberOfLines={2}
                            >
                                {task.description}
                            </Text>
                        ) : null}

                        <View style={styles.dateTimeContainer}>
                            <Ionicons
                                name={isPastDue ? 'alert-circle' : 'time-outline'}
                                size={14}
                                color={isPastDue ? Colors.error : Colors.textSecondary}
                            />
                            <Text
                                style={[
                                    styles.dateTime,
                                    isPastDue && styles.dateTimePastDue,
                                    task.completed && styles.dateTimeCompleted,
                                ]}
                            >
                                {formatDateTime(task.dateTime)}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={handleDelete}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="trash-outline" size={20} color={Colors.error} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
    },
    card: {
        backgroundColor: Colors.cardBackground,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        overflow: 'hidden',
    },
    cardCompleted: {
        opacity: 0.7,
        borderColor: Colors.success + '40',
    },
    cardPastDue: {
        borderColor: Colors.error + '60',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    checkbox: {
        marginRight: 12,
    },
    checkboxCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxCircleCompleted: {
        backgroundColor: Colors.success,
        borderColor: Colors.success,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    titleCompleted: {
        textDecorationLine: 'line-through',
        color: Colors.textSecondary,
    },
    description: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 6,
    },
    descriptionCompleted: {
        textDecorationLine: 'line-through',
        color: Colors.textDisabled,
    },
    dateTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dateTime: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    dateTimePastDue: {
        color: Colors.error,
        fontWeight: '600',
    },
    dateTimeCompleted: {
        textDecorationLine: 'line-through',
        color: Colors.textDisabled,
    },
    deleteButton: {
        padding: 8,
        marginLeft: 8,
    },
});
