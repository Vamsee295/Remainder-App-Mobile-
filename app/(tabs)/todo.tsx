import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { FlatList, Keyboard, ScrollView, StyleSheet, View } from 'react-native';

import { Badge, Button, Card, Checkbox, Chip, Empty, Fab, Field, FieldLabel, IconButton, Screen, ScreenHeader, Sheet, Stamp, Txt } from '@/components/kit';
import { MonthGrid } from '@/components/month-grid';
import { C } from '@/constants/theme';
import { StorageService } from '@/services/storage-service';
import { TodoItem } from '@/types';

const newId = () => Date.now().toString() + Math.random().toString(36).slice(2, 11);

/** "Overdue" / "Today" / "Tomorrow" / "Nov 21" */
function deadlineBadge(deadline: string) {
  const d = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.floor((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - today.getTime()) / 86400000);
  if (days < 0) return <Badge label="Overdue" color={C.paper} bg={C.accentD} />;
  if (days === 0) return <Badge label="Today" />;
  if (days === 1) return <Badge label="Tomorrow" color={C.teal} bg={C.tealLight} />;
  return <Badge label={d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} color={C.ink} bg={C.paper2} />;
}

export default function TodoScreen() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [text, setText] = useState('');
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [pickDate, setPickDate] = useState(false);
  const [error, setError] = useState('');

  const reload = () => StorageService.loadTodos().then(setTodos);
  /** Change storage, then refresh from it. */
  const run = (action: Promise<void>) => action.catch((e) => console.error('To-do action failed:', e)).then(reload);

  useEffect(() => {
    reload();
  }, []);

  const open = () => {
    setText('');
    setDeadline(undefined);
    setPickDate(false);
    setError('');
    setSheetOpen(true);
  };

  const save = () => {
    if (!text.trim()) {
      setError('Write what you need to do.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    run(StorageService.addTodo({ id: newId(), text: text.trim(), completed: false, createdAt: new Date().toISOString(), deadline: deadline?.toISOString() }));
    setSheetOpen(false);
  };

  const active = todos.filter((t) => !t.completed);
  const sorted = [...active, ...todos.filter((t) => t.completed)];

  return (
    <Screen>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <ScreenHeader
            eyebrow="Remainder / To-Do"
            hand="small stuff, no alarms"
            title="Quick"
            mark="List."
            right={active.length ? <Stamp label={`${active.length} left`} /> : null}
          />
        }
        ListEmptyComponent={<Empty title="List is clear" hint="tap + to add the first item" />}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Txt v="title" color={item.completed ? C.mute : C.accent} style={styles.num}>
              {String(index + 1).padStart(2, '0')}
            </Txt>
            <Checkbox
              checked={item.completed}
              label={`Mark ${item.text} ${item.completed ? 'not done' : 'done'}`}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                run(StorageService.updateTodo({ ...item, completed: !item.completed }));
              }}
            />
            <View style={styles.body}>
              <Txt v="bodyBold" style={item.completed && styles.struck}>
                {item.text}
              </Txt>
              {item.deadline && !item.completed ? deadlineBadge(item.deadline) : null}
            </View>
            <IconButton icon="trash-sharp" label={`Delete ${item.text}`} color={C.accentD} onPress={() => run(StorageService.deleteTodo(item.id))} />
          </View>
        )}
      />

      <Fab label="New to-do" onPress={open} />

      <Sheet
        visible={sheetOpen}
        title="New to-do"
        onClose={() => setSheetOpen(false)}
        footer={
          <>
            <Button label="Cancel" kind="secondary" style={styles.flex} onPress={() => setSheetOpen(false)} />
            <Button label="Add" arrow style={styles.flex} onPress={save} />
          </>
        }>
        <ScrollView style={styles.shrink} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <FieldLabel>What needs doing?</FieldLabel>
        <Field
          value={text}
          onChangeText={(v) => {
            setText(v);
            setError('');
          }}
          onSubmitEditing={save}
          placeholder="Buy printer paper"
          maxLength={200}
          autoFocus
          accessibilityLabel="To-do text"
          style={error ? { borderColor: C.accentD } : null}
        />
        {error ? <Txt v="label" color={C.accentD} style={styles.error}>{error}</Txt> : null}

        <FieldLabel>Deadline</FieldLabel>
        <View style={styles.deadlineRow}>
          <Chip
            label={deadline ? deadline.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'No deadline'}
            active={pickDate}
            onPress={() => {
              Keyboard.dismiss(); // room for the calendar
              setPickDate(!pickDate);
            }}
          />
          {deadline ? <IconButton icon="close-sharp" label="Remove deadline" onPress={() => setDeadline(undefined)} /> : null}
        </View>
        {pickDate ? (
          <Card style={styles.picker}>
            <MonthGrid selected={deadline ?? new Date()} minDate={new Date()} onSelect={setDeadline} />
          </Card>
        ) : null}
        </ScrollView>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  shrink: { flexShrink: 1 },
  list: { padding: 20, paddingBottom: 110 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1.5, borderStyle: 'dashed', borderColor: C.line },
  num: { width: 34 },
  body: { flex: 1, gap: 6 },
  struck: { textDecorationLine: 'line-through', color: C.mute },
  error: { marginTop: 6, letterSpacing: 0.5 },
  deadlineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 4 },
  picker: { marginTop: 14, marginRight: 6, marginBottom: 6 },
});
