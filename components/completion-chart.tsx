import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Colors } from '@/constants/theme';
import { WeeklyData } from '@/services/statistics-service';

interface CompletionChartProps {
    data: WeeklyData[];
}

const screenWidth = Dimensions.get('window').width;

export function CompletionChart({ data }: CompletionChartProps) {
    const chartData = {
        labels: data.map(d => d.day),
        datasets: [
            {
                data: data.map(d => d.completed),
                color: (opacity = 1) => Colors.success,
            },
        ],
    };

    const maxValue = Math.max(...data.map(d => Math.max(d.completed, d.created)), 1);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Weekly Completion</Text>
            <Text style={styles.subtitle}>Tasks completed in the last 7 days</Text>

            {data.every(d => d.completed === 0) ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No completed tasks this week</Text>
                </View>
            ) : (
                <BarChart
                    data={chartData}
                    width={screenWidth - 48}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=""
                    fromZero
                    segments={4}
                    chartConfig={{
                        backgroundColor: Colors.cardBackground,
                        backgroundGradientFrom: Colors.cardBackground,
                        backgroundGradientTo: Colors.cardBackground,
                        decimalPlaces: 0,
                        color: (opacity = 1) => Colors.success,
                        labelColor: (opacity = 1) => Colors.textSecondary,
                        style: {
                            borderRadius: 16,
                        },
                        propsForBackgroundLines: {
                            strokeDasharray: '',
                            stroke: Colors.divider,
                            strokeWidth: 1,
                        },
                        propsForLabels: {
                            fontSize: 12,
                            fontWeight: '600',
                        },
                    }}
                    style={styles.chart}
                    showValuesOnTopOfBars
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.cardBackground,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.textSecondary,
        marginBottom: 16,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    emptyState: {
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textSecondary,
        fontStyle: 'italic',
    },
});
