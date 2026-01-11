import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Colors } from '@/constants/theme';

interface CustomTimePickerProps {
    selectedTime: Date;
    onTimeChange: (time: Date) => void;
}

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;

export function CustomTimePicker({ selectedTime, onTimeChange }: CustomTimePickerProps) {
    const [selectedHour, setSelectedHour] = useState(selectedTime.getHours() % 12 || 12);
    const [selectedMinute, setSelectedMinute] = useState(selectedTime.getMinutes());
    const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(selectedTime.getHours() >= 12 ? 'PM' : 'AM');

    // Generate arrays for hours, minutes
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    const handleHourChange = (hour: number) => {
        setSelectedHour(hour);
        updateTime(hour, selectedMinute, selectedPeriod);
    };

    const handleMinuteChange = (minute: number) => {
        setSelectedMinute(minute);
        updateTime(selectedHour, minute, selectedPeriod);
    };

    const handlePeriodChange = (period: 'AM' | 'PM') => {
        setSelectedPeriod(period);
        updateTime(selectedHour, selectedMinute, period);
    };

    const updateTime = (hour: number, minute: number, period: 'AM' | 'PM') => {
        const newDate = new Date(selectedTime);
        let hours24 = hour;
        if (period === 'PM' && hour !== 12) {
            hours24 = hour + 12;
        } else if (period === 'AM' && hour === 12) {
            hours24 = 0;
        }
        newDate.setHours(hours24);
        newDate.setMinutes(minute);
        onTimeChange(newDate);
    };

    const formatTime = () => {
        const hour = selectedHour;
        const minute = selectedMinute.toString().padStart(2, '0');
        return `${hour}:${minute}`;
    };

    const renderColumn = (
        items: number[] | string[],
        selectedValue: number | string,
        onSelect: (value: any) => void,
        formatter?: (value: any) => string
    ) => {
        return (
            <View style={styles.column}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_HEIGHT}
                    decelerationRate="fast"
                    nestedScrollEnabled={true}
                    contentContainerStyle={styles.scrollContent}
                    style={styles.scrollView}
                >
                    {/* Padding items at top */}
                    {Array.from({ length: Math.floor(VISIBLE_ITEMS / 2) }).map((_, i) => (
                        <View key={`top-${i}`} style={styles.itemContainer} />
                    ))}

                    {items.map((item) => {
                        const isSelected = item === selectedValue;
                        return (
                            <TouchableOpacity
                                key={item}
                                style={[
                                    styles.itemContainer,
                                    isSelected && styles.itemContainerSelected,
                                ]}
                                onPress={() => onSelect(item)}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.itemText,
                                        isSelected && styles.itemTextSelected,
                                    ]}
                                >
                                    {formatter ? formatter(item) : item}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}

                    {/* Padding items at bottom */}
                    {Array.from({ length: Math.floor(VISIBLE_ITEMS / 2) }).map((_, i) => (
                        <View key={`bottom-${i}`} style={styles.itemContainer} />
                    ))}
                </ScrollView>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Left side - Selected time display */}
                <View style={styles.displayPanel}>
                    <Text style={styles.displayTime}>{formatTime()}</Text>
                    <Text style={styles.displayPeriod}>{selectedPeriod}</Text>
                </View>

                {/* Right side - Picker columns */}
                <View style={styles.pickerPanel}>
                    {/* Hour column */}
                    {renderColumn(hours, selectedHour, handleHourChange)}

                    {/* Minute column */}
                    {renderColumn(minutes, selectedMinute, handleMinuteChange, (val) =>
                        val.toString().padStart(2, '0')
                    )}

                    {/* AM/PM column */}
                    <View style={styles.column}>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            nestedScrollEnabled={true}
                            contentContainerStyle={styles.scrollContent}
                            style={styles.scrollView}
                        >
                            {/* Padding */}
                            {Array.from({ length: Math.floor(VISIBLE_ITEMS / 2) }).map((_, i) => (
                                <View key={`top-${i}`} style={styles.itemContainer} />
                            ))}

                            {['AM', 'PM'].map((period) => {
                                const isSelected = period === selectedPeriod;
                                return (
                                    <TouchableOpacity
                                        key={period}
                                        style={[
                                            styles.itemContainer,
                                            isSelected && styles.itemContainerSelected,
                                        ]}
                                        onPress={() => handlePeriodChange(period as 'AM' | 'PM')}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            style={[
                                                styles.itemText,
                                                isSelected && styles.itemTextSelected,
                                            ]}
                                        >
                                            {period}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}

                            {/* Padding */}
                            {Array.from({ length: Math.floor(VISIBLE_ITEMS / 2) }).map((_, i) => (
                                <View key={`bottom-${i}`} style={styles.itemContainer} />
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    content: {
        flexDirection: 'row',
        height: ITEM_HEIGHT * VISIBLE_ITEMS,
    },
    displayPanel: {
        width: '35%',
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    displayTime: {
        fontSize: 36,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    displayPeriod: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    pickerPanel: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: Colors.surface,
    },
    column: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: 0,
    },
    itemContainer: {
        height: ITEM_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemContainerSelected: {
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        borderRadius: 24,
        marginHorizontal: 8,
    },
    itemText: {
        fontSize: 18,
        fontWeight: '500',
        color: Colors.textSecondary,
    },
    itemTextSelected: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.primary,
    },
});
