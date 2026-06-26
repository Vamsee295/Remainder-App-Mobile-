import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ScrollView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '@/types';
import { StorageService } from '@/services/storage-service';
import { StatisticsService } from '@/services/statistics-service';
import { StatCard } from '@/components/stat-card';
import { Colors } from '@/constants/theme';

export default function StatisticsScreenSimple() {
    const [tasks, setTasks] = useState<Task[]>([]);

    const loadTasks = async () => {
        try {
            const loadedTasks = await StorageService.loadTasks();
            setTasks(loadedTasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    };

    // Reload tasks when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            loadTasks();
        }, [])
    );

    const stats = StatisticsService.getCompletionStats(tasks);
    const streakInfo = StatisticsService.getStreakInfo(tasks);
    const productiveTime = StatisticsService.getMostProductiveTime(tasks);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Ionicons name="stats-chart" size={32} color={Colors.primary} />
                        <View style={styles.headerText}>
                            <Text style={styles.headerTitle}>Statistics</Text>
                            <Text style={styles.headerSubtitle}>Track your productivity</Text>
                        </View>
                    </View>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Overview Stats */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Overview</Text>
                        <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                                <StatCard
                                    icon="checkmark-done"
                                    title="Completion Rate"
                                    value={`${stats.completionRate.toFixed(0)}%`}
                                    subtitle={`${stats.totalCompleted} of ${stats.totalCreated} tasks`}
                                    color={Colors.success}
                                />
                            </View>

                            <View style={styles.statItem}>
                                <StatCard
                                    icon="flame"
                                    title="Current Streak"
                                    value={`${streakInfo.currentStreak} ${streakInfo.currentStreak === 1 ? 'day' : 'days'}`}
                                    subtitle={`Best: ${streakInfo.longestStreak} days`}
                                    color="#f97316"
                                />
                            </View>

                            <View style={styles.statItem}>
                                <StatCard
                                    icon="create"
                                    title="Total Created"
                                    value={stats.totalCreated}
                                    subtitle="All time"
                                    color={Colors.primary}
                                />
                            </View>

                            <View style={styles.statItem}>
                                <StatCard
                                    icon="checkbox"
                                    title="Total Completed"
                                    value={stats.totalCompleted}
                                    subtitle="All time"
                                    color={Colors.success}
                                />
                            </View>

                            <View style={styles.statItem}>
                                <StatCard
                                    icon="list"
                                    title="Active Tasks"
                                    value={stats.activeCount}
                                    subtitle="Pending completion"
                                    color={Colors.warning}
                                />
                            </View>

                            <View style={styles.statItem}>
                                <StatCard
                                    icon="time"
                                    title="Most Productive"
                                    value={productiveTime}
                                    subtitle="Peak productivity time"
                                    color="#8b5cf6"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Empty State */}
                    {tasks.length === 0 && (
                        <View style={styles.emptyState}>
                            <Ionicons name="bar-chart-outline" size={64} color={Colors.textDisabled} />
                            <Text style={styles.emptyTitle}>No Data Yet</Text>
                            <Text style={styles.emptyText}>
                                Start creating and completing tasks to see your statistics!
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerText: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.text,
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textSecondary,
        marginTop: 2,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 16,
    },
    statsGrid: {
        gap: 12,
    },
    statItem: {
        marginBottom: 0,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textSecondary,
        textAlign: 'center',
        maxWidth: 280,
    },
});
