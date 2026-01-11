import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SubTask } from '@/types';
import { Colors } from '@/constants/theme';

interface SubTaskListProps {
    subTasks: SubTask[];
    onToggleSubTask: (subTaskId: string) => void;
    onDeleteSubTask: (subTaskId: string) => void;
    onAddSubTask: (text: string) => void;
    editable?: boolean;
}

export function SubTaskList({
    subTasks,
    onToggleSubTask,
    onDeleteSubTask,
    onAddSubTask,
    editable = true,
}: SubTaskListProps) {
    const [newSubTaskText, setNewSubTaskText] = useState('');

    const handleAdd = () => {
        if (newSubTaskText.trim()) {
            onAddSubTask(newSubTaskText.trim());
            setNewSubTaskText('');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const handleToggle = (id: string) => {
        onToggleSubTask(id);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleDelete = (id: string) => {
        onDeleteSubTask(id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    };

    const completedCount = subTasks.filter(st => st.completed).length;
    const totalCount = subTasks.length;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
        <View style={styles.container}>
            {/* Progress Bar */}
            {totalCount > 0 && (
                <View style={styles.progressContainer}>
                    <View style={styles.progressInfo}>
                        <Text style={styles.progressText}>
                            {completedCount} of {totalCount} completed
                        </Text>
                        <Text style={styles.progressPercentage}>{progress.toFixed(0)}%</Text>
                    </View>
                    <View style={styles.progressBarBackground}>
                        <View
                            style={[
                                styles.progressBarFill,
                                { width: `${progress}%` },
                            ]}
                        />
                    </View>
                </View>
            )}

            {/* Sub-task List */}
            {subTasks.length > 0 && (
                <FlatList
                    data={subTasks}
                    keyExtractor={item => item.id}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                        <View style={styles.subTaskItem}>
                            <TouchableOpacity
                                style={styles.checkbox}
                                onPress={() => handleToggle(item.id)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <View style={[styles.checkboxCircle, item.completed && styles.checkboxChecked]}>
                                    {item.completed && (
                                        <Ionicons name="checkmark" size={14} color={Colors.background} />
                                    )}
                                </View>
                            </TouchableOpacity>

                            <Text
                                style={[
                                    styles.subTaskText,
                                    item.completed && styles.subTaskTextCompleted,
                                ]}
                                numberOfLines={2}
                            >
                                {item.text}
                            </Text>

                            {editable && (
                                <TouchableOpacity
                                    onPress={() => handleDelete(item.id)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    style={styles.deleteButton}
                                >
                                    <Ionicons name="close-circle" size={18} color={Colors.error} />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                />
            )}

            {/* Add New Sub-task */}
            {editable && (
                <View style={styles.addContainer}>
                    <TextInput
                        style={styles.input}
                        value={newSubTaskText}
                        onChangeText={setNewSubTaskText}
                        placeholder="Add a sub-task..."
                        placeholderTextColor={Colors.textDisabled}
                        onSubmitEditing={handleAdd}
                        returnKeyType="done"
                    />
                    <TouchableOpacity
                        onPress={handleAdd}
                        disabled={!newSubTaskText.trim()}
                        style={[
                            styles.addButton,
                            !newSubTaskText.trim() && styles.addButtonDisabled,
                        ]}
                    >
                        <Ionicons name="add" size={20} color={Colors.background} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 8,
    },
    progressContainer: {
        marginBottom: 12,
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    progressPercentage: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.primary,
    },
    progressBarBackground: {
        height: 6,
        backgroundColor: Colors.surfaceVariant,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.success,
        borderRadius: 3,
    },
    subTaskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 8,
    },
    checkbox: {
        marginRight: 4,
    },
    checkboxCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: Colors.success,
        borderColor: Colors.success,
    },
    subTaskText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: Colors.text,
    },
    subTaskTextCompleted: {
        textDecorationLine: 'line-through',
        color: Colors.textSecondary,
    },
    deleteButton: {
        padding: 4,
    },
    addContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    input: {
        flex: 1,
        backgroundColor: Colors.inputBackground,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        color: Colors.text,
        borderWidth: 1,
        borderColor: Colors.inputBorder,
    },
    addButton: {
        backgroundColor: Colors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonDisabled: {
        opacity: 0.4,
    },
});
