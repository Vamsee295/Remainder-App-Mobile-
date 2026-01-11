import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Colors } from '@/constants/theme';
import { CategoryStats } from '@/services/statistics-service';

interface CategoryPieChartProps {
    data: CategoryStats[];
}

const screenWidth = Dimensions.get('window').width;

export function CategoryPieChart({ data }: CategoryPieChartProps) {
    if (data.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Category Breakdown</Text>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No tasks created yet</Text>
                </View>
            </View>
        );
    }

    const chartData = data.map(item => ({
        name: item.category,
        count: item.count,
        color: item.color,
        legendFontColor: Colors.text,
        legendFontSize: 13,
    }));

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Category Breakdown</Text>
            <Text style={styles.subtitle}>Distribution of tasks by category</Text>

            <PieChart
                data={chartData}
                width={screenWidth - 48}
                height={220}
                chartConfig={{
                    color: (opacity = 1) => Colors.text,
                    labelColor: (opacity = 1) => Colors.text,
                }}
                accessor="count"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
                hasLegend={true}
                style={styles.chart}
            />
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
