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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { TodoFormData } from '@/types';
import { Colors } from '@/constants/theme';

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
    const [error, setError] = useState('');

    useEffect(() => {
        if (visible) {
            setText('');
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
        onSave({ text: text.trim() });
        setText('');
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
                            <Text style={styles.headerTitle}>New To-Do</Text>
                            <TouchableOpacity onPress={handleCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Ionicons name="close" size={28} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.content}>
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
                        </View>

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
