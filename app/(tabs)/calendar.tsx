import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button, Card, Chip, Empty, Screen, ScreenHeader, SectionHeader, Txt } from '@/components/kit';
import { MonthGrid } from '@/components/month-grid';
import { formatTime, TaskRow } from '@/components/task-row';
import { TaskSheet } from '@/components/task-sheet';
import { C } from '@/constants/theme';
import { useTasks } from '@/hooks/use-tasks';
import { loadSettings } from '@/services/app-settings';
import { eventsOn, PhoneEvent } from '@/services/phone-calendar';
import { Task } from '@/types';

export default function CalendarScreen() {
  const { tasks, saveTask, toggleTask, deleteTask, snoozeTask, moveToTomorrow } = useTasks();
  const [selected, setSelected] = useState(() => new Date());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const marked = new Set(tasks.filter((t) => !t.completed).map((t) => new Date(t.dateTime).toDateString()));
  const dayTasks = tasks
    .filter((t) => new Date(t.dateTime).toDateString() === selected.toDateString())
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const isToday = selected.toDateString() === new Date().toDateString();

  // Phone calendar events for the picked day, when switched on in Settings (re-checked each time the tab opens).
  const [events, setEvents] = useState<PhoneEvent[]>([]);
  useFocusEffect(
    useCallback(() => {
      let live = true;
      loadSettings()
        .then((s) => (s.showCalendar ? eventsOn(selected) : []))
        .then((list) => live && setEvents(list))
        .catch(() => live && setEvents([]));
      return () => {
        live = false;
      };
    }, [selected]),
  );

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
            onTomorrow={moveToTomorrow}
            onEdit={(t) => {
              setEditing(t);
              setSheetOpen(true);
            }}
          />
        ))}

        {events.length ? (
          <>
            <SectionHeader eyebrow="From your calendar" title="Events" count={events.length} />
            {events.map((e) => {
              const future = e.start.getTime() > Date.now();
              const added = tasks.some((t) => t.title === e.title && new Date(t.dateTime).getTime() === e.start.getTime());
              return (
                <Card key={e.id} style={styles.event}>
                  <View style={styles.flex}>
                    <Txt v="label">{e.allDay ? 'All day' : `${formatTime(e.start)} – ${formatTime(e.end)}`}</Txt>
                    <Txt v="cond">{e.title}</Txt>
                  </View>
                  {future && !e.allDay ? (
                    <Chip
                      label={added ? 'Added' : 'Remind me'}
                      active={added}
                      color={C.teal}
                      disabled={added}
                      onPress={() =>
                        // A task at the event's start, with a 15-minute heads-up.
                        saveTask({ title: e.title, date: e.start, time: e.start, category: 'work', priority: 'medium', recurrence: 'none', earlyMinutes: 15, enableAlarm: false })
                      }
                    />
                  ) : null}
                </Card>
              );
            })}
          </>
        ) : null}

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
  flex: { flex: 1, gap: 2 },
  event: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 12 },
});
