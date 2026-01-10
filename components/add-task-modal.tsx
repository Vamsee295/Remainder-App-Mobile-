import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Task, TaskFormData } from '@/types';
import { Colors } from '@/constants/theme';

interface AddTaskModalProps {
    visible: boolean;
    task?: Task | null;
    prefilledDate?: Date;
    onSave: (taskData: TaskFormData) => void;
    onCancel: () => void;
}

export function AddTaskModal({
    visible,
    task,
    prefilledDate,
    onSave,
    onCancel,
}: AddTaskModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [errors, setErrors] = useState<{ title?: string; dateTime?: string }>({});

    useEffect(() => {
        if (visible) {
            if (task) {
                // Edit mode
                setTitle(task.title);
                setDescription(task.description || '');
                const taskDate = new Date(task.dateTime);
                setSelectedDate(taskDate);
                setSelectedTime(taskDate);
            } else if (prefilledDate) {
                // Prefilled date from calendar
                setSelectedDate(prefilledDate);
                setSelectedTime(prefilledDate);
            } else {
                // Reset for new task
                resetForm();
            }
            setErrors({});
        }
    }, [visible, task, prefilledDate]);

    const resetForm = () => {
        setTitle('');
        setDescription('');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        setSelectedDate(tomorrow);
        setSelectedTime(tomorrow);
    };

    const validateForm = (): boolean => {
        const newErrors: { title?: string; dateTime?: string } = {};

        if (!title.trim()) {
            newErrors.title = 'Title is required';
        }

        const combinedDateTime = new Date(selectedDate);
        combinedDateTime.setHours(selectedTime.getHours());
        combinedDateTime.setMinutes(selectedTime.getMinutes());

        if (combinedDateTime <= new Date()) {
            newErrors.dateTime = 'Date and time must be in the future';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validateForm()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        onSave({
            title: title.trim(),
            description: description.trim() || undefined,
            date: selectedDate,
            time: selectedTime,
        });

        resetForm();
    };

    const handleCancel = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        resetForm();
        onCancel();
    };

    const handleDateChange = (event: any, date?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (date) {
            setSelectedDate(date);
        }
    };

    const handleTimeChange = (event: any, date?: Date) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (date) {
            setSelectedTime(date);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleCancel}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>
                                {task ? 'Edit Task' : 'New Task'}
                            </Text>
                            <TouchableOpacity onPress={handleCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Ionicons name="close" size={28} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                            {/* Title Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Title *</Text>
                                <TextInput
                                    style={[styles.input, errors.title && styles.inputError]}
                                    placeholder="What do you need to do?"
                                    placeholderTextColor={Colors.textDisabled}
                                    value={title}
                                    onChangeText={setTitle}
                                    maxLength={100}
                                />
                                {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
                            </View>

                            {/* Description Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Description (Optional)</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Add more details..."
                                    placeholderTextColor={Colors.textDisabled}
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                    numberOfLines={4}
                                    maxLength={500}
                                    textAlignVertical="top"
                                />
                            </View>

                            {/* Date Picker */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Date *</Text>
                                <TouchableOpacity
                                    style={styles.pickerButton}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setShowDatePicker(true);
                                    }}
                                >
                                    <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                                    <Text style={styles.pickerButtonText}>{formatDate(selectedDate)}</Text>
                                    <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            {/* Time Picker */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Time *</Text>
                                <TouchableOpacity
                                    style={styles.pickerButton}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setShowTimePicker(true);
                                    }}
                                >
                                    <Ionicons name="time-outline" size={20} color={Colors.primary} />
                                    <Text style={styles.pickerButtonText}>{formatTime(selectedTime)}</Text>
                                    <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
                                </TouchableOpacity>
                                {errors.dateTime && <Text style={styles.errorText}>{errors.dateTime}</Text>}
                            </View>

                            {/* Date Picker Component */}
                            {showDatePicker && (
                                <DateTimePicker
                                    value={selectedDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleDateChange}
                                    minimumDate={new Date()}
                                    textColor={Colors.text}
                                    themeVariant="dark"
                                />
                            )}

                            {/* Time Picker Component */}
                            {showTimePicker && (
                                <DateTimePicker
                                    value={selectedTime}
                                    mode="time"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleTimeChange}
                                    textColor={Colors.text}
                                    themeVariant="dark"
                                />
                            )}
                        </ScrollView>

                        {/* Footer Buttons */}
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonSecondary]}
                                onPress={handleCancel}
                            >
                                <Text style={styles.buttonSecondaryText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleSave}
                            >
                                <LinearGradient
                                    colors={['#cbe7ff', '#a0cfff', '#7bc3ff', '#56aaff']}
                                    start={{ x: 0.5, y: 0 }}
                                    end={{ x: 0.5, y: 1 }}
                                    style={styles.buttonPrimaryGradient}
                                >
                                    <Text style={styles.buttonPrimaryText}>
                                        {task ? 'Update' : 'Create'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: Colors.overlay,
        justifyContent: 'flex-end',
    },
    modal: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 16,
            },
        }),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text,
    },
    content: {
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: Colors.inputBackground,
        borderWidth: 1,
        borderColor: Colors.inputBorder,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: Colors.text,
        fontWeight: '600',
    },
    inputError: {
        borderColor: Colors.error,
    },
    textArea: {
        minHeight: 100,
        paddingTop: 12,
    },
    errorText: {
        fontSize: 12,
        color: Colors.error,
        marginTop: 4,
        fontWeight: '600',
    },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.inputBackground,
        borderWidth: 1,
        borderColor: Colors.inputBorder,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    pickerButtonText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: Platform.OS === 'ios' ? 32 : 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
    },
    button: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    buttonPrimaryGradient: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonPrimaryText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000000', // Black text on gradient
    },
    buttonSecondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    buttonSecondaryText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
});
