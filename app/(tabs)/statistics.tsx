import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Card, Empty, Screen, ScreenHeader, SectionHeader, Stamp, Txt } from '@/components/kit';
import { CATEGORIES } from '@/constants/categories';
import { BW, C } from '@/constants/theme';
import { useTasks } from '@/hooks/use-tasks';
import { StatisticsService } from '@/services/statistics-service';

export default function StatisticsScreen() {
  const { tasks } = useTasks();

  const stats = StatisticsService.getCompletionStats(tasks);
  const streak = StatisticsService.getStreakInfo(tasks);
  const week = StatisticsService.getWeeklyData(tasks);
  const weekMax = Math.max(1, ...week.map((d) => d.created));
  const byCategory = CATEGORIES.map((c) => ({ ...c, count: tasks.filter((t) => (t.category ?? 'other') === c.value).length })).filter((c) => c.count);
  const categoryMax = Math.max(1, ...byCategory.map((c) => c.count));
  const rate = Math.round(stats.completionRate);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          eyebrow="Remainder / Stats"
          hand="how it's going so far"
          title="Your"
          mark="Numbers."
          right={streak.currentStreak > 0 ? <Stamp label={`${streak.currentStreak} day streak`} /> : null}
        />

        {tasks.length === 0 ? (
          <Empty title="No data yet" hint="finish a few tasks and come back" />
        ) : (
          <>
            <Card dark style={styles.rateCard}>
              <Txt v="label" color={C.mint}>
                Completion rate
              </Txt>
              <Txt v="display" color={C.paper}>
                {rate}%
              </Txt>
              <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: rate }}>
                <View style={[styles.fill, { width: `${rate}%` }]} />
              </View>
              <Txt v="mono" color={C.paper} style={styles.small}>
                {`> ${stats.totalCompleted} of ${stats.totalCreated} tasks done`}
              </Txt>
            </Card>

            <View style={styles.grid}>
              <Tile label="Open" value={stats.activeCount} />
              <Tile label="Done" value={stats.totalCompleted} />
              <Tile label="Streak days" value={streak.currentStreak} />
              <Tile label="Best streak" value={streak.longestStreak} />
            </View>

            <SectionHeader n={1} eyebrow="Last 7 days" title="This week" />
            <Card>
              <View style={styles.bars}>
                {week.map((d, i) => (
                  <View key={i} style={styles.barCol} accessibilityLabel={`${d.day}: ${d.completed} of ${d.created} done`}>
                    <Txt v="label" style={styles.barNum}>
                      {d.created || ''}
                    </Txt>
                    <View style={[styles.bar, { height: Math.max(4, (d.created / weekMax) * 90) }]}>
                      <View style={[styles.barDone, { height: d.created ? `${(d.completed / d.created) * 100}%` : 0 }]} />
                    </View>
                    <Txt v="label">{d.day.slice(0, 2)}</Txt>
                  </View>
                ))}
              </View>
              <View style={styles.legend}>
                <View style={[styles.swatch, { backgroundColor: C.accent }]} />
                <Txt v="label">Done</Txt>
                <View style={[styles.swatch, { backgroundColor: C.card }]} />
                <Txt v="label">Planned</Txt>
              </View>
            </Card>

            <SectionHeader n={2} eyebrow="Where the work goes" title="By category" />
            <Card style={styles.categoryCard}>
              {byCategory.map((c) => (
                <View key={c.value} style={styles.catRow}>
                  <Txt v="mono" style={styles.catLabel}>
                    {c.label}
                  </Txt>
                  <View style={styles.catTrack}>
                    <View style={[styles.catFill, { width: `${(c.count / categoryMax) * 100}%`, backgroundColor: c.color }]} />
                  </View>
                  <Txt v="mono" style={styles.catCount}>
                    {c.count}
                  </Txt>
                </View>
              ))}
            </Card>

            <SectionHeader n={3} eyebrow="When you finish things" title="Best time" />
            <Txt v="mono">{`> ${StatisticsService.getMostProductiveTime(tasks)}`}</Txt>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <Card style={styles.tile}>
      <Txt v="label">{label}</Txt>
      <Txt v="hero">{value}</Txt>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingRight: 26, paddingBottom: 48 },
  rateCard: { gap: 6 },
  small: { fontSize: 12, marginTop: 4 },
  track: { height: 14, borderRadius: 7, backgroundColor: '#3a332e', overflow: 'hidden', marginTop: 4 },
  fill: { height: '100%', backgroundColor: C.accent, borderRadius: 7 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 20 },
  tile: { flexGrow: 1, flexBasis: '40%', padding: 14, gap: 2 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 140 },
  barCol: { alignItems: 'center', gap: 6, flex: 1 },
  barNum: { letterSpacing: 0 },
  bar: { width: 22, borderWidth: BW, borderColor: C.ink, borderRadius: 5, backgroundColor: C.card, justifyContent: 'flex-end', overflow: 'hidden' },
  barDone: { backgroundColor: C.accent },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  swatch: { width: 12, height: 12, borderWidth: 1.5, borderColor: C.ink, borderRadius: 3, marginLeft: 6 },
  categoryCard: { gap: 12 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catLabel: { width: 78, fontSize: 12 },
  catTrack: { flex: 1, height: 12, borderRadius: 6, backgroundColor: C.paper2, overflow: 'hidden' },
  catFill: { height: '100%', borderRadius: 6 },
  catCount: { width: 24, textAlign: 'right', fontSize: 12 },
});
