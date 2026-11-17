import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Card, Chip, Field, FieldLabel, IconButton, Sheet, Txt } from '@/components/kit';
import { MonthGrid } from '@/components/month-grid';
import { formatDay, formatTime } from '@/components/task-row';
import { CATEGORIES, PRIORITIES, RECURRENCES } from '@/constants/categories';
import { BW, C, R, SH } from '@/constants/theme';
import { NotificationService } from '@/services/notification-service';
import { StorageService } from '@/services/storage-service';
import { RecurrenceType, Task, TaskCategory, TaskFormData, TaskPriority, TaskSuggestion } from '@/types';

type Props = {
  visible: boolean;
  task?: Task | null;
  /** Start date for a new task (used by the Calendar tab). */
  prefilledDate?: Date;
  onSave: (data: TaskFormData) => void;
  onCancel: () => void;
  /** Shown as a Delete button when editing an existing task. */
  onDelete?: (id: string) => void;
};

const defaultWhen = (day?: Date) => {
  const d = day ? new Date(day) : new Date();
  if (!day) d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
};

export function TaskSheet({ visible, task, prefilledDate, onSave, onCancel, onDelete }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [when, setWhen] = useState(defaultWhen);
  const [category, setCategory] = useState<TaskCategory>('other');
  const [priority, setPriority] = useState<TaskPriority>('low');
  const [alarm, setAlarm] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);
  const [errors, setErrors] = useState<{ title?: string; when?: string }>({});
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [sound, setSound] = useState('default');
  const [testing, setTesting] = useState(false);

  // Fill the form each time the sheet opens.
  useEffect(() => {
    if (!visible) return;
    setTitle(task?.title ?? '');
    setDescription(task?.description ?? '');
    setWhen(task ? new Date(task.dateTime) : defaultWhen(prefilledDate));
    setCategory(task?.category ?? 'other');
    setPriority(task?.priority ?? 'low');
    setRecurrence(task?.recurrence ?? 'none');
    setAlarm(task ? task.alarmEnabled !== false : false);
    setPicker(null);
    setErrors({});
    StorageService.loadTaskSuggestions().then((all) => setSuggestions(all.slice(0, 6))).catch(() => setSuggestions([]));
    StorageService.loadSelectedAlarmSound().then(setSound).catch(() => setSound('default'));
  }, [visible, task, prefilledDate]);

  const setTime = (hours: number, minutes: number) => {
    const next = new Date(when);
    next.setHours((hours + 24) % 24, (minutes + 60) % 60, 0, 0);
    setWhen(next);
  };

  const save = () => {
    const problems: typeof errors = {};
    if (!title.trim()) problems.title = 'Give the task a title.';
    if (when <= new Date()) problems.when = 'Pick a date and time in the future.';
    setErrors(problems);
    if (problems.title || problems.when) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      date: when,
      time: when,
      category,
      priority,
      recurrence,
      enableAlarm: alarm,
    });
  };

  const importSound = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Allow access to audio files in Settings to use your own alarm sound.');
        return;
      }
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: false });
      if (result.canceled || !result.assets?.length) return;
      await StorageService.saveSelectedAlarmSound(result.assets[0].uri);
      setSound(result.assets[0].uri);
    } catch (error) {
      console.error('Error picking audio file:', error);
      alert('Could not import that audio file. Try another one.');
    }
  };

  const useDefaultSound = async () => {
    await StorageService.saveSelectedAlarmSound('default');
    setSound('default');
  };

  const hour12 = when.getHours() % 12 || 12;
  const pm = when.getHours() >= 12;

  return (
    <Sheet
      visible={visible}
      title={task ? 'Edit task' : 'New task'}
      onClose={onCancel}
      footer={
        <>
          {task && onDelete ? (
            <IconButton icon="trash-sharp" label={`Delete ${task.title}`} color={C.accentD} onPress={() => onDelete(task.id)} />
          ) : null}
          <Button label="Cancel" kind="secondary" style={styles.flex} onPress={onCancel} />
          <Button label={task ? 'Update' : 'Save'} arrow style={styles.flex} onPress={save} />
        </>
      }>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={styles.shrink} contentContainerStyle={styles.content}>
        {!task && suggestions.length > 0 ? (
          <>
            <Txt v="label" color={C.accent}>
              Used before
            </Txt>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.chips}>
              {suggestions.map((s) => (
                <Chip
                  key={s.id}
                  label={s.title}
                  onPress={() => {
                    setTitle(s.title);
                    setDescription(s.description ?? '');
                    setTime(s.hour, s.minute);
                    StorageService.updateSuggestionUsage(s.id);
                  }}
                />
              ))}
            </ScrollView>
          </>
        ) : null}

        <FieldLabel>Title</FieldLabel>
        <Field
          value={title}
          onChangeText={(v) => {
            setTitle(v);
            if (errors.title) setErrors({ ...errors, title: undefined });
          }}
          placeholder="What do you need to do?"
          maxLength={100}
          accessibilityLabel="Title"
          style={errors.title ? styles.fieldError : null}
        />
        {errors.title ? <Txt v="label" color={C.accentD} style={styles.error}>{errors.title}</Txt> : null}

        <FieldLabel>Notes</FieldLabel>
        <Field
          value={description}
          onChangeText={setDescription}
          placeholder="Optional details"
          multiline
          maxLength={500}
          accessibilityLabel="Notes"
          style={styles.notes}
        />

        <FieldLabel>When</FieldLabel>
        <View style={styles.row}>
          <Tile label="Date" value={formatDay(when)} active={picker === 'date'} onPress={() => setPicker(picker === 'date' ? null : 'date')} />
          <Tile label="Time" value={formatTime(when)} active={picker === 'time'} onPress={() => setPicker(picker === 'time' ? null : 'time')} />
        </View>
        {errors.when ? <Txt v="label" color={C.accentD} style={styles.error}>{errors.when}</Txt> : null}

        {picker === 'date' ? (
          <Card style={styles.picker}>
            <MonthGrid
              selected={when}
              minDate={new Date()}
              onSelect={(d) => {
                const next = new Date(d);
                next.setHours(when.getHours(), when.getMinutes(), 0, 0);
                setWhen(next);
              }}
            />
          </Card>
        ) : null}

        {picker === 'time' ? (
          <Card style={[styles.picker, styles.timeRow]}>
            <Stepper label="Hour" value={String(hour12).padStart(2, '0')} onUp={() => setTime(when.getHours() + 1, when.getMinutes())} onDown={() => setTime(when.getHours() - 1, when.getMinutes())} />
            <Txt v="hero">:</Txt>
            {/* ponytail: minutes move in steps of 5. Add a typed minute field if exact minutes matter. */}
            <Stepper
              label="Minute"
              value={String(when.getMinutes()).padStart(2, '0')}
              onUp={() => setTime(when.getHours(), Math.floor(when.getMinutes() / 5) * 5 + 5)}
              onDown={() => setTime(when.getHours(), Math.ceil(when.getMinutes() / 5) * 5 - 5)}
            />
            <View style={styles.ampm}>
              <Chip label="AM" active={!pm} onPress={() => pm && setTime(when.getHours() - 12, when.getMinutes())} />
              <Chip label="PM" active={pm} onPress={() => !pm && setTime(when.getHours() + 12, when.getMinutes())} />
            </View>
          </Card>
        ) : null}

        <FieldLabel>Category</FieldLabel>
        <View style={styles.wrap}>
          {CATEGORIES.map((c) => (
            <Chip key={c.value} label={c.label} active={category === c.value} onPress={() => setCategory(c.value)} />
          ))}
        </View>

        <FieldLabel>Priority</FieldLabel>
        <View style={styles.wrap}>
          {PRIORITIES.map((p) => (
            <Chip key={p.value} label={p.label} active={priority === p.value} color={p.color} onPress={() => setPriority(p.value)} />
          ))}
        </View>

        <FieldLabel>Remind me by</FieldLabel>
        <View style={styles.wrap}>
          <Chip label="Notification" active={!alarm} color={C.ink} onPress={() => setAlarm(false)} />
          <Chip label="Ring alarm" active={alarm} onPress={() => setAlarm(true)} />
        </View>
        <Txt v="mono" style={styles.note}>
          {alarm ? '> Rings like an alarm until you dismiss or snooze it.' : '> A notification, repeated 5 and 10 min later if ignored.'}
        </Txt>

        <FieldLabel>Repeat</FieldLabel>
        <View style={styles.wrap}>
          {RECURRENCES.map((r) => (
            <Chip key={r.value} label={r.label} active={recurrence === r.value} color={C.teal} onPress={() => setRecurrence(r.value)} />
          ))}
        </View>
        <Txt v="mono" style={styles.note}>{`> ${RECURRENCES.find((r) => r.value === recurrence)?.note.replace('Rings', alarm ? 'Rings' : 'Reminds you')}`}</Txt>

        {alarm ? (
          <>
            {Platform.OS !== 'web' ? (
              <>
                <FieldLabel>Alarm sound</FieldLabel>
                <View style={styles.soundRow}>
                  <Txt v="mono" style={styles.flex}>
                    {sound.startsWith('content://') ? 'Your imported sound' : 'Default alarm'}
                  </Txt>
                  {sound !== 'default' ? <IconButton icon="refresh-sharp" label="Use the default alarm sound" onPress={useDefaultSound} /> : null}
                  <Chip label="Import" onPress={importSound} />
                </View>
                {NotificationService.canRing() ? (
                  <Chip
                    label={testing ? 'Rings in 10 seconds…' : 'Ring a test alarm'}
                    color={C.teal}
                    active={testing}
                    style={styles.test}
                    onPress={() => {
                      setTesting(true);
                      NotificationService.ringTestAlarm(10)
                        .catch(() => alert('Could not set the test alarm. Allow "Alarms & reminders" for this app in Settings.'))
                        .finally(() => setTimeout(() => setTesting(false), 10000));
                    }}
                  />
                ) : null}
              </>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </Sheet>
  );
}

function Tile({ label, value, active, onPress }: { label: string; value: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      accessibilityState={{ expanded: active }}
      style={[styles.tile, active && { backgroundColor: C.accentLight }]}>
      <Txt v="label">{label}</Txt>
      <Txt v="mono" style={styles.tileValue}>
        {value}
      </Txt>
    </Pressable>
  );
}

function Stepper({ label, value, onUp, onDown }: { label: string; value: string; onUp: () => void; onDown: () => void }) {
  return (
    <View style={styles.stepper}>
      <IconButton icon="chevron-up-sharp" label={`${label} up`} onPress={onUp} />
      <Txt v="hero" accessibilityLabel={`${label} ${value}`}>
        {value}
      </Txt>
      <IconButton icon="chevron-down-sharp" label={`${label} down`} onPress={onDown} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  shrink: { flexShrink: 1 },
  content: { paddingBottom: 12, paddingRight: 6 },
  bleed: { marginHorizontal: -20 },
  chips: { gap: 10, paddingVertical: 8, paddingHorizontal: 20 },
  row: { flexDirection: 'row', gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingRight: 4, paddingBottom: 4 },
  fieldError: { borderColor: C.accentD },
  error: { marginTop: 6, letterSpacing: 0.5 },
  notes: { minHeight: 76, textAlignVertical: 'top' },
  tile: { flex: 1, borderWidth: BW, borderColor: C.ink, borderRadius: R.btn, backgroundColor: C.card, padding: 12, gap: 4, boxShadow: SH.sm, marginBottom: 4, marginRight: 4 },
  tileValue: { fontSize: 16 },
  picker: { marginTop: 14, marginRight: 6, marginBottom: 6 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  stepper: { alignItems: 'center', gap: 6 },
  ampm: { gap: 10, marginLeft: 8 },
  note: { fontSize: 12, color: C.mute, marginTop: 10 },
  test: { alignSelf: 'flex-start', marginTop: 12 },
  soundRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 4, paddingBottom: 4 },
});
