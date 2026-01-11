import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskCategory, TaskPriority } from '@/types';
import { Colors } from '@/constants/theme';
import { CATEGORIES, PRIORITIES } from '@/constants/categories';

interface FilterDropdownProps {
    selectedCategory: TaskCategory | 'all';
    selectedPriority: TaskPriority | 'all';
    onCategoryChange: (category: TaskCategory | 'all') => void;
    onPriorityChange: (priority: TaskPriority | 'all') => void;
}

export function FilterDropdown({
    selectedCategory,
    selectedPriority,
    onCategoryChange,
    onPriorityChange,
}: FilterDropdownProps) {
    const [visible, setVisible] = useState(false);

    const hasActiveFilters = selectedCategory !== 'all' || selectedPriority !== 'all';

    const clearFilters = () => {
        onCategoryChange('all');
        onPriorityChange('all');
    };

    return (
        <>
            <TouchableOpacity
                style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
                onPress={() => setVisible(true)}
            >
                <Ionicons
                    name="funnel"
                    size={18}
                    color={hasActiveFilters ? Colors.primary : Colors.text}
                />
                {hasActiveFilters && <View style={styles.badge} />}
            </TouchableOpacity>

            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={() => setVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setVisible(false)}
                >
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filters</Text>
                            <TouchableOpacity onPress={() => setVisible(false)}>
                                <Ionicons name="close" size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Category Filter */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Category</Text>
                                <TouchableOpacity
                                    style={[
                                        styles.filterOption,
                                        selectedCategory === 'all' && styles.filterOptionActive,
                                    ]}
                                    onPress={() => onCategoryChange('all')}
                                >
                                    <Text
                                        style={[
                                            styles.filterOptionText,
                                            selectedCategory === 'all' && styles.filterOptionTextActive,
                                        ]}
                                    >
                                        All Categories
                                    </Text>
                                    {selectedCategory === 'all' && (
                                        <Ionicons name="checkmark" size={20} color={Colors.primary} />
                                    )}
                                </TouchableOpacity>
                                {CATEGORIES.map((category) => (
                                    <TouchableOpacity
                                        key={category.value}
                                        style={[
                                            styles.filterOption,
                                            selectedCategory === category.value && styles.filterOptionActive,
                                        ]}
                                        onPress={() => onCategoryChange(category.value)}
                                    >
                                        <View style={styles.categoryOption}>
                                            <Ionicons
                                                name={category.icon as any}
                                                size={16}
                                                color={category.color}
                                            />
                                            <Text
                                                style={[
                                                    styles.filterOptionText,
                                                    selectedCategory === category.value &&
                                                    styles.filterOptionTextActive,
                                                ]}
                                            >
                                                {category.label}
                                            </Text>
                                        </View>
                                        {selectedCategory === category.value && (
                                            <Ionicons name="checkmark" size={20} color={Colors.primary} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Priority Sort */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Sort by Priority</Text>
                                <TouchableOpacity
                                    style={[
                                        styles.filterOption,
                                        selectedPriority === 'all' && styles.filterOptionActive,
                                    ]}
                                    onPress={() => onPriorityChange('all')}
                                >
                                    <Text
                                        style={[
                                            styles.filterOptionText,
                                            selectedPriority === 'all' && styles.filterOptionTextActive,
                                        ]}
                                    >
                                        No Priority Sort
                                    </Text>
                                    {selectedPriority === 'all' && (
                                        <Ionicons name="checkmark" size={20} color={Colors.primary} />
                                    )}
                                </TouchableOpacity>
                                {PRIORITIES.map((priority) => (
                                    <TouchableOpacity
                                        key={priority.value}
                                        style={[
                                            styles.filterOption,
                                            selectedPriority === priority.value && styles.filterOptionActive,
                                        ]}
                                        onPress={() => onPriorityChange(priority.value)}
                                    >
                                        <View style={styles.categoryOption}>
                                            <View
                                                style={[styles.priorityDot, { backgroundColor: priority.color }]}
                                            />
                                            <Text
                                                style={[
                                                    styles.filterOptionText,
                                                    selectedPriority === priority.value &&
                                                    styles.filterOptionTextActive,
                                                ]}
                                            >
                                                {priority.label} Priority First
                                            </Text>
                                        </View>
                                        {selectedPriority === priority.value && (
                                            <Ionicons name="checkmark" size={20} color={Colors.primary} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {hasActiveFilters && (
                                <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                                    <Text style={styles.clearButtonText}>Clear All Filters</Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    filterButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: Colors.surface,
        position: 'relative',
    },
    filterButtonActive: {
        backgroundColor: Colors.primary + '20',
    },
    badge: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    filterOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: Colors.surface,
    },
    filterOptionActive: {
        backgroundColor: Colors.primary + '15',
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    categoryOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    filterOptionText: {
        fontSize: 16,
        color: Colors.text,
        fontWeight: '500',
    },
    filterOptionTextActive: {
        color: Colors.primary,
        fontWeight: '600',
    },
    priorityDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    clearButton: {
        backgroundColor: Colors.error + '15',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    clearButtonText: {
        color: Colors.error,
        fontSize: 16,
        fontWeight: '600',
    },
});
