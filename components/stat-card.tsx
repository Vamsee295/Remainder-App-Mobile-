import React from 'react';
import {
    View,
    Text,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

interface StatCardProps {
    icon: string;
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
}

export function StatCard({ icon, title, value, subtitle, color = Colors.primary }: StatCardProps) {
    return (
        <View style={styles.card}>
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon as any} size={24} color={color} />
            </View>
            <View style={styles.content}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.value}>{value}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.cardBackground,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        gap: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    value: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 11,
        fontWeight: '500',
        color: Colors.textSecondary,
    },
});
