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
import { TodoItem } from '@/types';
import { Colors } from '@/constants/theme';

interface TodoItemCardProps {
    todo: TodoItem;
    onToggleComplete: (todoId: string) => void;
    onDelete: (todoId: string) => void;
}

export function TodoItemCard({ todo, onToggleComplete, onDelete }: TodoItemCardProps) {
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.98,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        onToggleComplete(todo.id);
    };

    const handleDelete = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onDelete(todo.id);
    };

    const formatDeadline = () => {
        if (!todo.deadline) return null;

        const deadlineDate = new Date(todo.deadline);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const deadline = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());

        const daysDiff = Math.floor((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff < 0) {
            return { text: 'Overdue', color: Colors.error, icon: 'alert-circle' as const };
        } else if (daysDiff === 0) {
            return { text: 'Today', color: Colors.warning, icon: 'today' as const };
        } else if (daysDiff === 1) {
            return { text: 'Tomorrow', color: Colors.primary, icon: 'calendar' as const };
        } else {
            const formatted = deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return { text: formatted, color: Colors.textSecondary, icon: 'calendar-outline' as const };
        }
    };

    const deadlineInfo = formatDeadline();

    return (
        <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
            <View style={[styles.card, todo.completed && styles.cardCompleted]}>
                <TouchableOpacity
                    style={styles.checkbox}
                    onPress={handlePress}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <View style={[styles.checkboxCircle, todo.completed && styles.checkboxCircleCompleted]}>
                        {todo.completed && (
                            <Ionicons name="checkmark" size={18} color={Colors.background} />
                        )}
                    </View>
                </TouchableOpacity>

                <View style={styles.content}>
                    <Text
                        style={[
                            styles.text,
                            todo.completed && styles.textCompleted,
                        ]}
                        numberOfLines={2}
                    >
                        {todo.text}
                    </Text>

                    {deadlineInfo && (
                        <View style={styles.deadlineContainer}>
                            <Ionicons name={deadlineInfo.icon} size={12} color={deadlineInfo.color} />
                            <Text style={[styles.deadlineText, { color: deadlineInfo.color }]}>
                                {deadlineInfo.text}
                            </Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDelete}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="trash-outline" size={20} color={Colors.error} />
                </TouchableOpacity>
            </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    cardCompleted: {
        opacity: 0.6,
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
    content: {
        flex: 1,
        marginRight: 8,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 4,
    },
    textCompleted: {
        textDecorationLine: 'line-through',
        color: Colors.textSecondary,
    },
    deadlineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    deadlineText: {
        fontSize: 12,
        fontWeight: '600',
    },
    deleteButton: {
        padding: 8,
        marginLeft: 8,
    },
});
