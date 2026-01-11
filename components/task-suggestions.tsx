import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { TaskSuggestion } from '@/types';
import { Colors } from '@/constants/theme';

interface TaskSuggestionsProps {
    suggestions: TaskSuggestion[];
    onSelectSuggestion: (suggestion: TaskSuggestion) => void;
}

export function TaskSuggestions({ suggestions, onSelectSuggestion }: TaskSuggestionsProps) {
    console.log('TaskSuggestions component rendered with suggestions:', suggestions);
    console.log('Number of suggestions:', suggestions.length);

    // DEBUG: Always show the section with info
    const hasNoSuggestions = suggestions.length === 0;

    const formatTime = (hour: number, minute: number) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        const displayMinute = minute.toString().padStart(2, '0');
        return `${displayHour}:${displayMinute} ${period}`;
    };

    const handleSelectSuggestion = (suggestion: TaskSuggestion) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelectSuggestion(suggestion);
    };

    // Show most recent 5 suggestions
    const recentSuggestions = [...suggestions]
        .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
        .slice(0, 5);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.headerText}>Quick Suggestions</Text>
                <Text style={styles.debugText}>({suggestions.length} saved)</Text>
            </View>

            {hasNoSuggestions ? (
                <Text style={styles.emptyText}>
                    Create a task to see suggestions here! 💡
                </Text>
            ) : (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {recentSuggestions.map((suggestion) => (
                        <TouchableOpacity
                            key={suggestion.id}
                            style={styles.suggestionCard}
                            onPress={() => handleSelectSuggestion(suggestion)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.cardContent}>
                                <Text style={styles.suggestionTitle} numberOfLines={1}>
                                    {suggestion.title}
                                </Text>
                                <View style={styles.timeContainer}>
                                    <Ionicons name="time" size={12} color={Colors.primary} />
                                    <Text style={styles.suggestionTime}>
                                        {formatTime(suggestion.hour, suggestion.minute)}
                                    </Text>
                                </View>
                                {suggestion.usageCount > 1 && (
                                    <View style={styles.badge}>
                                        <Ionicons name="repeat" size={10} color={Colors.primary} />
                                        <Text style={styles.badgeText}>{suggestion.usageCount}x</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    headerText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    debugText: {
        fontSize: 11,
        fontWeight: '500',
        color: Colors.textDisabled,
        marginLeft: 4,
    },
    emptyText: {
        fontSize: 12,
        fontWeight: '500',
        color: Colors.textSecondary,
        fontStyle: 'italic',
        paddingVertical: 8,
    },
    scrollContent: {
        gap: 8,
        paddingRight: 16,
    },
    suggestionCard: {
        backgroundColor: Colors.inputBackground,
        borderWidth: 1,
        borderColor: Colors.inputBorder,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        minWidth: 140,
        maxWidth: 180,
    },
    cardContent: {
        position: 'relative',
    },
    suggestionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 6,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    suggestionTime: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.primary,
    },
    badge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.primary,
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: Colors.primary,
    },
});
