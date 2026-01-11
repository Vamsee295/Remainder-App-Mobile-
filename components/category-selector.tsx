import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskCategory } from '@/types';
import { CATEGORIES } from '@/constants/categories';
import { Colors } from '@/constants/theme';

interface CategorySelectorProps {
    selectedCategory?: TaskCategory;
    onSelectCategory: (category: TaskCategory) => void;
}

export function CategorySelector({ selectedCategory, onSelectCategory }: CategorySelectorProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>Category</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {CATEGORIES.map((category) => {
                    const isSelected = selectedCategory === category.value;
                    return (
                        <TouchableOpacity
                            key={category.value}
                            style={[
                                styles.categoryChip,
                                isSelected && {
                                    backgroundColor: category.color + '20',
                                    borderColor: category.color
                                }
                            ]}
                            onPress={() => onSelectCategory(category.value)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={category.icon as any}
                                size={16}
                                color={isSelected ? category.color : Colors.textSecondary}
                            />
                            <Text style={[
                                styles.categoryText,
                                isSelected && { color: category.color, fontWeight: '700' }
                            ]}>
                                {category.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 8,
    },
    scrollContent: {
        gap: 8,
        paddingRight: 16,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.surfaceVariant,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
});
