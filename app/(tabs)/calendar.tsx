import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Button, Card, Empty, Screen, ScreenHeader, SectionHeader } from '@/components/kit';
import { MonthGrid } from '@/components/month-grid';
import { TaskRow } from '@/components/task-row';
import { TaskSheet } from '@/components/task-sheet';
import { useTasks } from '@/hooks/use-tasks';
import { Task } from '@/types';

export default function CalendarScreen() {
  const { tasks, saveTask, toggleTask, deleteTask, snoozeTask } = useTasks();
  const [selected, setSelected] = useState(() => new Date());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const marked = new Set(tasks.filter((t) => !t.completed).map((t) => new Date(t.dateTime).toDateString()));
  const dayTasks = tasks
    .filter((t) => new Date(t.dateTime).toDateString() === selected.toDateString())
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const isToday = selected.toDateString() === new Date().toDateString();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader eyebrow="Remainder / Calendar" hand="tap a day to see what's on it" title="Plan the" mark="Month." />

        <Card>
          <MonthGrid selected={selected} onSelect={setSelected} marked={marked} />
        </Card>

        <SectionHeader
          eyebrow={isToday ? 'Today' : selected.toLocaleDateString('en-US', { weekday: 'long' })}
          title={selected.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          count={dayTasks.length}
        />

        {dayTasks.length === 0 ? <Empty title="Free day" hint="nothing planned here yet" /> : null}
        {dayTasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onToggle={toggleTask}
            onSnooze={snoozeTask}
            onEdit={(t) => {
              setEditing(t);
              setSheetOpen(true);
            }}
          />
        ))}

        <Button
          label="Add task on this day"
          arrow
          style={styles.add}
          onPress={() => {
            setEditing(null);
            setSheetOpen(true);
          }}
        />
      </ScrollView>

      <TaskSheet
        visible={sheetOpen}
        task={editing}
        prefilledDate={selected}
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
  content: { padding: 20, paddingRight: 26, paddingBottom: 48 },
  add: { marginTop: 8 },
});
