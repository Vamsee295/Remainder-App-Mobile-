import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

interface EmptyStateProps {
    icon: keyof typeof Ionicons.glyphMap;
    message: string;
    submessage?: string;
}

export function EmptyState({ icon, message, submessage }: EmptyStateProps) {
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={80} color={Colors.textDisabled} />
            </View>
            <Text style={styles.message}>{message}</Text>
            {submessage && <Text style={styles.submessage}>{submessage}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    iconContainer: {
        marginBottom: 20,
        opacity: 0.5,
    },
    message: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    submessage: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
});
