import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { TodoFormData } from '@/types';
import { Colors } from '@/constants/theme';
import { CustomCalendarPicker } from './custom-calendar-picker';

interface AddTodoModalProps {
    visible: boolean;
    onSave: (todoData: TodoFormData) => void;
    onCancel: () => void;
}

export function AddTodoModal({
    visible,
    onSave,
    onCancel,
}: AddTodoModalProps) {
    const [text, setText] = useState('');
    const [deadline, setDeadline] = useState<Date | undefined>(undefined);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (visible) {
            setText('');
            setDeadline(undefined);
            setShowDatePicker(false);
            setError('');
        }
    }, [visible]);

    const handleSave = () => {
        if (!text.trim()) {
            setError('Please enter a to-do item');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSave({ text: text.trim(), deadline });
        setText('');
        setDeadline(undefined);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const handleCancel = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setText('');
        onCancel();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            statusBarTranslucent={Platform.OS === 'android'}
            navigationBarTranslucent={Platform.OS === 'android'}
            onRequestClose={handleCancel}
        >
            {Platform.OS === 'ios' ? (
                <KeyboardAvoidingView behavior="padding" style={styles.container}>
                    {renderModalContent()}
                </KeyboardAvoidingView>
            ) : (
                <View style={styles.container}>
                    {renderModalContent()}
                </View>
            )}
        </Modal>
    );

    function renderModalContent() {
        return (
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>New To-Do</Text>
                        <TouchableOpacity onPress={handleCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close" size={28} color={Colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.content}
                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                    >
                        {/* Text Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>What do you need to do?</Text>
                            <TextInput
                                style={[styles.input, error && styles.inputError]}
                                placeholder="Enter your to-do item"
                                placeholderTextColor={Colors.textDisabled}
                                value={text}
                                onChangeText={(value) => {
                                    setText(value);
                                    setError('');
                                }}
                                maxLength={200}
                                multiline
                                autoFocus
                            />
                            {error && <Text style={styles.errorText}>{error}</Text>}
                        </View>

                        {/* Deadline Picker */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Deadline (Optional)</Text>
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setShowDatePicker(!showDatePicker);
                                }}
                            >
                                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                                <Text style={styles.dateButtonText}>
                                    {deadline ? formatDate(deadline) : 'Set deadline'}
                                </Text>
                                {deadline && (
                                    <TouchableOpacity
                                        onPress={() => setDeadline(undefined)}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>

                            {showDatePicker && (
                                <View style={styles.calendarContainer}>
                                    <CustomCalendarPicker
                                        selectedDate={deadline || new Date()}
                                        onDateChange={(date) => {
                                            setDeadline(date);
                                            setShowDatePicker(false);
                                        }}
                                        minimumDate={new Date()}
                                    />
                                </View>
                            )}
                        </View>
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
                                <Text style={styles.buttonPrimaryText}>Add</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }
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
        maxHeight: '50%',
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
        flexShrink: 1,
    },
    contentContainer: {
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
        minHeight: 80,
        textAlignVertical: 'top',
    },
    inputError: {
        borderColor: Colors.error,
    },
    errorText: {
        fontSize: 12,
        color: Colors.error,
        marginTop: 4,
        fontWeight: '600',
    },
    dateButton: {
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
    dateButtonText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    calendarContainer: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        marginTop: 8,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
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
        color: '#000000',
    },
    buttonSecondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.border,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonSecondaryText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
});
