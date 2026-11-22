import React, { useState } from 'react';
import { RefreshControl, ScrollView, SectionList, StyleSheet, View } from 'react-native';

import { Chip, Empty, Fab, PromptInput, Screen, ScreenHeader, SectionHeader, Segmented, Stamp } from '@/components/kit';
import { TaskRow } from '@/components/task-row';
import { TaskSheet } from '@/components/task-sheet';
import { CATEGORIES } from '@/constants/categories';
import { C } from '@/constants/theme';
import { useTasks } from '@/hooks/use-tasks';
import { parseQuickAdd } from '@/services/quick-add';
import { Task, TaskCategory, TaskFilter } from '@/types';

const FILTERS: { value: TaskFilter; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Done' },
  { value: 'all', label: 'All' },
];

const EMPTY: Record<TaskFilter, { title: string; hint: string }> = {
  active: { title: 'Nothing queued', hint: 'type a task above, or tap +' },
  completed: { title: 'Nothing done yet', hint: 'finished tasks land here' },
  all: { title: 'No tasks yet', hint: 'type a task above, or tap +' },
};

/** Split tasks into Late / Today / Tomorrow / This week / Later, each sorted by time. */
function groupByDay(tasks: Task[]) {
  const day0 = new Date();
  day0.setHours(0, 0, 0, 0);
  const dayAt = (n: number) => new Date(day0.getFullYear(), day0.getMonth(), day0.getDate() + n).getTime();
  const now = Date.now();

  const groups: Record<string, Task[]> = { Late: [], Today: [], Tomorrow: [], 'This week': [], Later: [] };
  for (const task of [...tasks].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())) {
    const t = new Date(task.dateTime).getTime();
    if (t < now && !task.completed) groups.Late.push(task);
    else if (t < dayAt(1)) groups.Today.push(task);
    else if (t < dayAt(2)) groups.Tomorrow.push(task);
    else if (t < dayAt(7)) groups['This week'].push(task);
    else groups.Later.push(task);
  }
  return Object.entries(groups)
    .filter(([, data]) => data.length)
    .map(([title, data]) => ({ title, data }));
}

export default function TasksScreen() {
  const { tasks, reload, saveTask, toggleTask, deleteTask, snoozeTask } = useTasks();
  const [filter, setFilter] = useState<TaskFilter>('active');
  const [category, setCategory] = useState<TaskCategory | 'all'>('all');
  const [quick, setQuick] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const active = tasks.filter((t) => !t.completed);
  const dueToday = active.filter((t) => new Date(t.dateTime).toDateString() === new Date().toDateString()).length;

  const shown = tasks
    .filter((t) => (filter === 'all' ? true : filter === 'active' ? !t.completed : t.completed))
    .filter((t) => category === 'all' || (t.category ?? 'other') === category);
  const sections = groupByDay(shown);

  const submitQuick = () => {
    const { title, when, daily } = parseQuickAdd(quick);
    if (!title) return;
    saveTask({ title, date: when, time: when, category: 'other', priority: 'low', recurrence: daily ? 'daily' : 'none', enableAlarm: false });
    setQuick('');
  };

  const header = (
    <View>
      <ScreenHeader
        eyebrow="Remainder / Tasks"
        hand={dueToday ? `hi — ${dueToday} ${dueToday === 1 ? 'thing' : 'things'} due today` : 'hi — nothing due today'}
        title="Get it"
        mark="Done."
        right={active.length ? <Stamp label={`${active.length} open`} /> : null}
      />

      <PromptInput
        value={quick}
        onChangeText={setQuick}
        onSubmitEditing={submitQuick}
        placeholder="call mom at 6pm"
        returnKeyType="done"
        accessibilityLabel="Quick add a task. Type a title and a time, then press enter."
      />

      <Segmented options={FILTERS} value={filter} onChange={setFilter} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.categories}>
        <Chip label="All types" active={category === 'all'} color={C.ink} onPress={() => setCategory('all')} />
        {CATEGORIES.map((c) => (
          <Chip key={c.value} label={c.label} active={category === c.value} color={C.ink} onPress={() => setCategory(c.value)} />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <Screen>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        ListEmptyComponent={
          category !== 'all' && tasks.length ? (
            <Empty title={`Nothing in ${CATEGORIES.find((c) => c.value === category)?.label}`} hint="pick another type, or All types" />
          ) : (
            <Empty {...EMPTY[filter]} />
          )
        }
        renderSectionHeader={({ section }) => (
          <SectionHeader title={section.title} count={section.data.length} />
        )}
        renderItem={({ item }) => (
          <TaskRow
            task={item}
            onToggle={toggleTask}
            onSnooze={snoozeTask}
            onEdit={(task) => {
              setEditing(task);
              setSheetOpen(true);
            }}
          />
        )}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={C.accent}
            colors={[C.accent]}
            onRefresh={async () => {
              setRefreshing(true);
              await reload();
              setRefreshing(false);
            }}
          />
        }
      />

      <Fab
        label="New task"
        onPress={() => {
          setEditing(null);
          setSheetOpen(true);
        }}
      />

      <TaskSheet
        visible={sheetOpen}
        task={editing}
        onCancel={() => setSheetOpen(false)}
        onDelete={(id) => {
          deleteTask(id);
          setSheetOpen(false);
        }}
        onSave={(data) => {
          saveTask(data, editing);
          setSheetOpen(false);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, paddingRight: 26, paddingBottom: 120 },
  bleed: { marginLeft: -20, marginRight: -26 },
  categories: { gap: 8, paddingTop: 12, paddingBottom: 6, paddingHorizontal: 20 },
});
