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

                <Text
                    style={[
                        styles.text,
                        todo.completed && styles.textCompleted,
                    ]}
                    numberOfLines={2}
                >
                    {todo.text}
                </Text>

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
    text: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    textCompleted: {
        textDecorationLine: 'line-through',
        color: Colors.textSecondary,
    },
    deleteButton: {
        padding: 8,
        marginLeft: 8,
    },
});
