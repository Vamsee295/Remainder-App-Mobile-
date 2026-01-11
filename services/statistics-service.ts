import { Task } from '@/types';

export interface CompletionStats {
    totalCreated: number;
    totalCompleted: number;
    completionRate: number;
    activeCount: number;
}

export interface StreakInfo {
    currentStreak: number;
    longestStreak: number;
    lastCompletionDate: string | null;
}

export interface WeeklyData {
    day: string;
    completed: number;
    created: number;
}

export interface CategoryStats {
    category: string;
    count: number;
    color: string;
}

export interface TimeStats {
    hour: number;
    count: number;
}

export class StatisticsService {
    /**
     * Calculate overall completion statistics
     */
    static getCompletionStats(tasks: Task[]): CompletionStats {
        const totalCreated = tasks.length;
        const totalCompleted = tasks.filter(t => t.completed).length;
        const completionRate = totalCreated > 0 ? (totalCompleted / totalCreated) * 100 : 0;
        const activeCount = tasks.filter(t => !t.completed).length;

        return {
            totalCreated,
            totalCompleted,
            completionRate,
            activeCount,
        };
    }

    /**
     * Calculate streak information based on consecutive days with completed tasks
     */
    static getStreakInfo(tasks: Task[]): StreakInfo {
        const completedTasks = tasks
            .filter(t => t.completed)
            .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

        if (completedTasks.length === 0) {
            return {
                currentStreak: 0,
                longestStreak: 0,
                lastCompletionDate: null,
            };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get unique dates when tasks were completed
        const completionDates = new Set(
            completedTasks.map(task => {
                const date = new Date(task.dateTime);
                date.setHours(0, 0, 0, 0);
                return date.getTime();
            })
        );

        const sortedDates = Array.from(completionDates).sort((a, b) => b - a);

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        // Calculate current streak
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let checkDate = sortedDates[0] === today.getTime() ? today : yesterday;
        let dateIndex = 0;

        while (dateIndex < sortedDates.length) {
            if (sortedDates[dateIndex] === checkDate.getTime()) {
                currentStreak++;
                dateIndex++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        // Calculate longest streak
        for (let i = 0; i < sortedDates.length; i++) {
            tempStreak = 1;
            let currentDate = new Date(sortedDates[i]);

            for (let j = i + 1; j < sortedDates.length; j++) {
                const previousDate = new Date(currentDate);
                previousDate.setDate(previousDate.getDate() - 1);

                if (sortedDates[j] === previousDate.getTime()) {
                    tempStreak++;
                    currentDate = new Date(sortedDates[j]);
                } else {
                    break;
                }
            }

            longestStreak = Math.max(longestStreak, tempStreak);
        }

        const lastCompletionDate = completedTasks[completedTasks.length - 1]?.dateTime || null;

        return {
            currentStreak,
            longestStreak,
            lastCompletionDate,
        };
    }

    /**
     * Get completed and created task counts for the past 7 days
     */
    static getWeeklyData(tasks: Task[]): WeeklyData[] {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const data: WeeklyData[] = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);

            const dayTasks = tasks.filter(task => {
                const taskDate = new Date(task.dateTime);
                return taskDate >= date && taskDate < nextDay;
            });

            const completed = dayTasks.filter(t => t.completed).length;
            const created = dayTasks.length;

            data.push({
                day: days[date.getDay()],
                completed,
                created,
            });
        }

        return data;
    }

    /**
     * Get task distribution by category
     */
    static getCategoryStats(tasks: Task[]): CategoryStats[] {
        const categoryCounts = new Map<string, { count: number; color: string }>();

        const categoryColors: Record<string, string> = {
            work: '#3b82f6',
            personal: '#8b5cf6',
            health: '#10b981',
            shopping: '#f59e0b',
            other: '#6b7280',
        };

        tasks.forEach(task => {
            const category = task.category || 'other';
            const current = categoryCounts.get(category) || { count: 0, color: categoryColors[category] };
            categoryCounts.set(category, { count: current.count + 1, color: current.color });
        });

        return Array.from(categoryCounts.entries()).map(([category, data]) => ({
            category: category.charAt(0).toUpperCase() + category.slice(1),
            count: data.count,
            color: data.color,
        }));
    }

    /**
     * Get most productive hours (when most tasks are completed)
     */
    static getProductiveHours(tasks: Task[]): TimeStats[] {
        const hourCounts = new Map<number, number>();

        tasks
            .filter(t => t.completed)
            .forEach(task => {
                const hour = new Date(task.dateTime).getHours();
                hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
            });

        const timeStats: TimeStats[] = Array.from(hourCounts.entries())
            .map(([hour, count]) => ({ hour, count }))
            .sort((a, b) => b.count - a.count);

        return timeStats;
    }

    /**
     * Get the most productive time of day description
     */
    static getMostProductiveTime(tasks: Task[]): string {
        const productiveHours = this.getProductiveHours(tasks);

        if (productiveHours.length === 0) {
            return 'No data yet';
        }

        const topHour = productiveHours[0].hour;

        if (topHour < 6) {
            return 'Late Night (12AM-6AM)';
        } else if (topHour < 12) {
            return 'Morning (6AM-12PM)';
        } else if (topHour < 18) {
            return 'Afternoon (12PM-6PM)';
        } else {
            return 'Evening (6PM-12AM)';
        }
    }
}
