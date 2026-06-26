import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { Task, TaskFormData, TaskSuggestion, TaskCategory, TaskPriority, RecurrenceType, DEFAULT_ALARM_SOUNDS } from '@/types';
import { Colors } from '@/constants/theme';
import { CustomCalendarPicker } from './custom-calendar-picker';
import { CustomTimePicker } from './custom-time-picker';
import { TaskSuggestions } from './task-suggestions';
import { CategorySelector } from './category-selector';
import { PrioritySelector } from './priority-selector';
import { RecurrenceSelector } from './recurrence-selector';
import { StorageService } from '@/services/storage-service';
import * as MediaLibrary from 'expo-media-library';
import * as DocumentPicker from 'expo-document-picker';

interface AddTaskModalProps {
    visible: boolean;
    task?: Task | null;
    prefilledDate?: Date;
    onSave: (taskData: TaskFormData) => void;
    onCancel: () => void;
}

const getDefaultTaskDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
};

export function AddTaskModal({
    visible,
    task,
    prefilledDate,
    onSave,
    onCancel,
}: AddTaskModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedDate, setSelectedDate] = useState(getDefaultTaskDate);
    const [selectedTime, setSelectedTime] = useState(getDefaultTaskDate);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [errors, setErrors] = useState<{ title?: string; dateTime?: string }>({});
    const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<TaskCategory>('other');
    const [selectedPriority, setSelectedPriority] = useState<TaskPriority>('low');
    const [selectedRecurrence, setSelectedRecurrence] = useState<RecurrenceType>('none');
    const [enableAlarm, setEnableAlarm] = useState(true); // Alarm enabled by default
    const [selectedAlarmSound, setSelectedAlarmSound] = useState('default'); // Selected alarm sound ID
    const [showSoundPicker, setShowSoundPicker] = useState(false); // Sound picker modal
    const [minimumDate, setMinimumDate] = useState(() => new Date());

    const resetForm = useCallback(() => {
        const defaultDate = getDefaultTaskDate();

        setTitle('');
        setDescription('');
        setSelectedDate(defaultDate);
        setSelectedTime(defaultDate);
        setSelectedCategory('other');
        setSelectedPriority('low');
        setSelectedRecurrence('none');
        setEnableAlarm(true);
        setShowDatePicker(false);
        setShowTimePicker(false);
        setShowSoundPicker(false);
        setErrors({});
    }, []);

    const loadSavedAlarmSound = useCallback(async () => {
        try {
            const savedSound = await StorageService.loadSelectedAlarmSound();
            setSelectedAlarmSound(savedSound);
        } catch (error) {
            console.error('Error loading alarm sound:', error);
        }
    }, []);

    const loadSuggestions = useCallback(async () => {
        try {
            const loadedSuggestions = await StorageService.loadTaskSuggestions();
            setSuggestions(loadedSuggestions);
        } catch (error) {
            console.error('Error loading suggestions:', error);
        }
    }, []);

    useEffect(() => {
        if (visible) {
            setMinimumDate(new Date());
            setShowDatePicker(false);
            setShowTimePicker(false);
            setShowSoundPicker(false);

            if (task) {
                // Edit mode
                setTitle(task.title);
                setDescription(task.description || '');
                const taskDate = new Date(task.dateTime);
                setSelectedDate(taskDate);
                setSelectedTime(taskDate);
                setSelectedCategory(task.category || 'other');
                setSelectedPriority(task.priority || 'low');
                setSelectedRecurrence(task.recurrence || 'none');
                setEnableAlarm(Boolean(task.notificationIds?.length || (task.recurrence && task.recurrence !== 'none')));
            } else if (prefilledDate) {
                // Prefilled date from calendar
                setSelectedDate(prefilledDate);
                setSelectedTime(prefilledDate);
                setEnableAlarm(true);
            } else {
                // Reset for new task
                resetForm();
            }
            setErrors({});
            loadSuggestions();
            loadSavedAlarmSound(); // Load saved alarm sound preference
        }
    }, [visible, task, prefilledDate, resetForm, loadSuggestions, loadSavedAlarmSound]);

    const selectedAlarmSoundName = useMemo(
        () => DEFAULT_ALARM_SOUNDS.find(s => s.id === selectedAlarmSound)?.name || 'Select Sound',
        [selectedAlarmSound]
    );

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
            category: selectedCategory,
            priority: selectedPriority,
            recurrence: enableAlarm ? selectedRecurrence : 'none', // Only set recurrence if alarm is enabled
            enableAlarm: enableAlarm,
        });

        resetForm();
    };

    const handleCancel = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        resetForm();
        onCancel();
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

    const handleSelectSuggestion = useCallback(async (suggestion: TaskSuggestion) => {
        // Populate form with suggestion data
        setTitle(suggestion.title);
        setDescription(suggestion.description || '');

        // Set the time based on suggestion
        const newTime = new Date();
        newTime.setHours(suggestion.hour);
        newTime.setMinutes(suggestion.minute);
        setSelectedTime(newTime);

        // Update suggestion usage count
        await StorageService.updateSuggestionUsage(suggestion.id);

        // Reload suggestions to reflect updated usage
        loadSuggestions();
    }, [loadSuggestions]);

    const handleCategorySelect = useCallback((category: TaskCategory) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedCategory(category);
    }, []);

    const handlePrioritySelect = useCallback((priority: TaskPriority) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedPriority(priority);
    }, []);

    const handleRecurrenceSelect = useCallback((recurrence: RecurrenceType) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedRecurrence(recurrence);
    }, []);

    const handleTitleChange = useCallback((value: string) => {
        setTitle(value);
        if (errors.title) {
            setErrors(prevErrors => ({ ...prevErrors, title: undefined }));
        }
    }, [errors.title]);

    const handleDateSelect = useCallback((date: Date) => {
        setSelectedDate(date);
        if (errors.dateTime) {
            setErrors(prevErrors => ({ ...prevErrors, dateTime: undefined }));
        }
    }, [errors.dateTime]);

    const handleTimeSelect = useCallback((time: Date) => {
        setSelectedTime(time);
        if (errors.dateTime) {
            setErrors(prevErrors => ({ ...prevErrors, dateTime: undefined }));
        }
    }, [errors.dateTime]);

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
                    <View style={styles.overlay}>
                        <View style={styles.modal}>
                            {renderModalContent()}
                        </View>
                    </View>
                </KeyboardAvoidingView>
            ) : (
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        {renderModalContent()}
                    </View>
                </View>
            )}
        </Modal>
    );

    function renderModalContent() {
        return (
            <>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>
                                {task ? 'Edit Task' : 'New Task'}
                            </Text>
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
                            {/* Title Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Title *</Text>
                                <TextInput
                                    style={[styles.input, errors.title && styles.inputError]}
                                    placeholder="What do you need to do?"
                                    placeholderTextColor={Colors.textDisabled}
                                    value={title}
                                    onChangeText={handleTitleChange}
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

                            {/* Category Selector */}
                            <CategorySelector
                                selectedCategory={selectedCategory}
                                onSelectCategory={handleCategorySelect}
                            />

                            {/* Priority Selector */}
                            <PrioritySelector
                                selectedPriority={selectedPriority}
                                onSelectPriority={handlePrioritySelect}
                            />

                            {/* Alarm Toggle */}
                            <View style={styles.inputGroup}>
                                <View style={styles.alarmToggleContainer}>
                                    <View style={styles.alarmToggleLabel}>
                                        <Ionicons name="alarm" size={20} color={enableAlarm ? Colors.warning : Colors.textSecondary} />
                                        <Text style={styles.label}>Enable Alarm 🔔</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.toggleSwitch, enableAlarm && styles.toggleSwitchActive]}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setEnableAlarm(!enableAlarm);
                                        }}
                                    >
                                        <View style={[styles.toggleThumb, enableAlarm && styles.toggleThumbActive]} />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.helperText}>
                                    {enableAlarm ? '✓ This task will trigger an alarm notification' : '○ This task will be a regular reminder (no alarm)'}
                                </Text>
                            </View>

                            {/* Alarm Sound Selector - Only show if alarm is enabled */}
                            {enableAlarm && (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Alarm Sound 🎵</Text>
                                    <TouchableOpacity
                                        style={styles.soundPickerButton}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setShowSoundPicker(!showSoundPicker);
                                        }}
                                    >
                                        <Ionicons name="musical-notes" size={20} color={Colors.primary} />
                                        <Text style={styles.soundPickerButtonText}>
                                            {selectedAlarmSoundName}
                                        </Text>
                                        <Ionicons name={showSoundPicker ? "chevron-up" : "chevron-down"} size={20} color={Colors.textSecondary} />
                                    </TouchableOpacity>

                                    {/* Sound Picker List */}
                                    {showSoundPicker && (
                                        <View style={styles.soundPickerList}>
                                            <ScrollView style={styles.soundScrollView} nestedScrollEnabled>
                                                {DEFAULT_ALARM_SOUNDS.map((sound) => (
                                                    <TouchableOpacity
                                                        key={sound.id}
                                                        style={[
                                                            styles.soundOption,
                                                            selectedAlarmSound === sound.id && styles.soundOptionSelected
                                                        ]}
                                                        onPress={() => {
                                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                            setSelectedAlarmSound(sound.id);
                                                        }}
                                                    >
                                                        <View style={styles.soundOptionContent}>
                                                            <View style={styles.soundOptionLeft}>
                                                                <Ionicons
                                                                    name={sound.isCustom ? "document-attach" : "musical-note"}
                                                                    size={18}
                                                                    color={selectedAlarmSound === sound.id ? Colors.primary : Colors.textSecondary}
                                                                />
                                                                <View style={{ flex: 1 }}>
                                                                    <Text style={[
                                                                        styles.soundOptionName,
                                                                        selectedAlarmSound === sound.id && styles.soundOptionNameSelected
                                                                    ]}>
                                                                        {sound.name}
                                                                    </Text>
                                                                    <Text style={styles.soundOptionDescription}>
                                                                        {sound.description}
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                            <View style={styles.soundOptionRight}>
                                                                {/* Preview/Play Button */}
                                                                <TouchableOpacity
                                                                    style={styles.playButton}
                                                                    onPress={async (e) => {
                                                                        e.stopPropagation();
                                                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                                        // Trigger a test notification to preview the sound
                                                                        try {
                                                                            await Notifications.scheduleNotificationAsync({
                                                                                content: {
                                                                                    title: `🔔 Preview: ${sound.name}`,
                                                                                    body: 'This is how your alarm will sound',
                                                                                    sound: true,
                                                                                },
                                                                                trigger: null,
                                                                            });
                                                                        } catch (error) {
                                                                            console.error('Error playing preview:', error);
                                                                        }
                                                                    }}
                                                                >
                                                                    <Ionicons name="play-circle" size={28} color={Colors.primary} />
                                                                </TouchableOpacity>
                                                                {selectedAlarmSound === sound.id && (
                                                                    <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                                                                )}
                                                            </View>
                                                        </View>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>

                                            {/* OK Button to confirm selection */}
                                            <View style={styles.soundPickerFooter}>
                                                <TouchableOpacity
                                                    style={styles.importButton}
                                                    onPress={async () => {
                                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                        try {
                                                            // Request media library permissions first
                                                            const { status } = await MediaLibrary.requestPermissionsAsync();

                                                            if (status !== 'granted') {
                                                                alert('Permission denied! Please allow access to your media files in Settings.');
                                                                return;
                                                            }

                                                            const result = await DocumentPicker.getDocumentAsync({
                                                                type: 'audio/*',
                                                                copyToCacheDirectory: false, // Use original URI
                                                            });

                                                            if (!result.canceled && result.assets && result.assets.length > 0) {
                                                                const audioFile = result.assets[0];
                                                                const soundUri = audioFile.uri;
                                                                const soundName = audioFile.name;

                                                                console.log('Selected audio file:', soundName);
                                                                console.log('Audio URI:', soundUri);

                                                                // Save the ACTUAL audio URI (content:// path)
                                                                await StorageService.saveSelectedAlarmSound(soundUri);
                                                                setSelectedAlarmSound(soundUri);

                                                                // Show success feedback
                                                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                                                alert(`✅ Imported: ${soundName}\n\nThis sound will be used for your alarms!\n\nURI: ${soundUri}`);
                                                                setShowSoundPicker(false);
                                                            }
                                                        } catch (error) {
                                                            console.error('Error picking audio file:', error);
                                                            alert('Failed to import audio file. Please try again.\n\nError: ' + error);
                                                        }
                                                    }}
                                                >
                                                    <Ionicons name="cloud-upload-outline" size={20} color={Colors.primary} />
                                                    <Text style={styles.importButtonText}>Import from Storage</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={styles.soundOkButton}
                                                    onPress={async () => {
                                                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                                        await StorageService.saveSelectedAlarmSound(selectedAlarmSound);
                                                        console.log(`Confirmed alarm sound: ${selectedAlarmSound}`);
                                                        setShowSoundPicker(false);
                                                    }}
                                                >
                                                    <Text style={styles.soundOkButtonText}>OK - Use This Sound</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* Recurrence Selector - Only show if alarm is enabled */}
                            {enableAlarm && (
                                <RecurrenceSelector
                                    selectedRecurrence={selectedRecurrence}
                                    onSelectRecurrence={handleRecurrenceSelect}
                                />
                            )}

                            {/* Deadline Info Display */}
                            {selectedRecurrence && selectedRecurrence !== 'none' && (
                                <View style={styles.deadlineInfoBox}>
                                    <View style={styles.deadlineInfoHeader}>
                                        <Ionicons name="information-circle" size={18} color={Colors.info} />
                                        <Text style={styles.deadlineInfoTitle}>Alarm Information</Text>
                                    </View>
                                    <Text style={styles.deadlineInfoText}>
                                        {selectedRecurrence === 'daily' && '• This alarm will ring daily indefinitely until you manually stop it.'}
                                        {selectedRecurrence === 'weekly' && '• This alarm will ring daily for 7 days from creation, then automatically expire.'}
                                        {selectedRecurrence === 'monthly' && '• This alarm will ring daily for 30 days from creation, then automatically expire.'}
                                    </Text>
                                </View>
                            )}

                            {/* Date Picker */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Date *</Text>
                                <TouchableOpacity
                                    style={styles.pickerButton}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setShowDatePicker(!showDatePicker);
                                        setShowTimePicker(false);
                                    }}
                                >
                                    <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                                    <Text style={styles.pickerButtonText}>{formatDate(selectedDate)}</Text>
                                    <Ionicons name={showDatePicker ? "chevron-up" : "chevron-down"} size={20} color={Colors.textSecondary} />
                                </TouchableOpacity>

                                {/* Custom Calendar Picker */}
                                {showDatePicker && (
                                    <View style={styles.customPickerContainer}>
                                        <CustomCalendarPicker
                                            selectedDate={selectedDate}
                                            onDateChange={handleDateSelect}
                                            minimumDate={minimumDate}
                                        />
                                    </View>
                                )}
                            </View>

                            {/* Time Picker */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Time *</Text>
                                <TouchableOpacity
                                    style={styles.pickerButton}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setShowTimePicker(!showTimePicker);
                                        setShowDatePicker(false);
                                    }}
                                >
                                    <Ionicons name="time-outline" size={20} color={Colors.primary} />
                                    <Text style={styles.pickerButtonText}>{formatTime(selectedTime)}</Text>
                                    <Ionicons name={showTimePicker ? "chevron-up" : "chevron-down"} size={20} color={Colors.textSecondary} />
                                </TouchableOpacity>

                                {/* Custom Time Picker */}
                                {showTimePicker && (
                                    <View style={styles.customPickerContainer}>
                                        <CustomTimePicker
                                            selectedTime={selectedTime}
                                            onTimeChange={handleTimeSelect}
                                        />
                                    </View>
                                )}
                                {errors.dateTime && <Text style={styles.errorText}>{errors.dateTime}</Text>}
                            </View>

                            {/* Task Suggestions */}
                            {!task && (
                                <TaskSuggestions
                                    suggestions={suggestions}
                                    onSelectSuggestion={handleSelectSuggestion}
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
            </>
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
        alignSelf: 'stretch',
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
    customPickerContainer: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        marginTop: 8,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
    },
    picker: {
        backgroundColor: Colors.surface,
        height: 180,
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
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonSecondaryText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    deadlineInfoBox: {
        backgroundColor: Colors.info + '10',
        borderWidth: 1,
        borderColor: Colors.info,
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
    },
    deadlineInfoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    deadlineInfoTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.info,
    },
    deadlineInfoText: {
        fontSize: 13,
        color: Colors.text,
        lineHeight: 20,
    },
    alarmToggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    alarmToggleLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    toggleSwitch: {
        width: 50,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.surfaceVariant,
        padding: 2,
        justifyContent: 'center',
    },
    toggleSwitchActive: {
        backgroundColor: Colors.warning,
    },
    toggleThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleThumbActive: {
        transform: [{ translateX: 22 }],
    },
    helperText: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontStyle: 'italic',
    },
    soundPickerButton: {
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
    soundPickerButtonText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    soundPickerList: {
        marginTop: 8,
        backgroundColor: Colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        maxHeight: 300,
        overflow: 'hidden',
    },
    soundScrollView: {
        maxHeight: 300,
    },
    soundOption: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    soundOptionSelected: {
        backgroundColor: Colors.primary + '10',
    },
    soundOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    soundOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    soundOptionName: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
    },
    soundOptionNameSelected: {
        color: Colors.primary,
    },
    soundOptionDescription: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    soundOptionRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    playButton: {
        padding: 4,
    },
    soundPickerFooter: {
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
        backgroundColor: Colors.background,
        gap: 8,
    },
    importButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surface,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.primary,
        gap: 8,
    },
    importButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.primary,
    },
    soundOkButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
    },
    soundOkButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
