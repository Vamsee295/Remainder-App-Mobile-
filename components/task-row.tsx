import * as Haptics from 'expo-haptics';
import React, { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

import { Badge, Card, Checkbox, IconButton, Txt } from '@/components/kit';
import { getCategoryConfig, getPriorityConfig, RECURRENCES } from '@/constants/categories';
import { BW, C, R } from '@/constants/theme';
import { AlarmService } from '@/services/alarm-service';
import { describe, ruleFor } from '@/services/repeat-rules';
import { Task } from '@/types';

export const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
export const formatDay = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

/** "Daily", "Weekdays", "Mon Wed Fri", "Monthly on 15"; the legacy 7 / 30-day repeats keep their labels. */
const repeatLabel = (task: Task, when: Date) =>
  task.recurrence === 'weekly' || task.recurrence === 'monthly'
    ? RECURRENCES.find((r) => r.value === task.recurrence)?.label
    : describe(ruleFor(task.recurrence, task.repeatDays, when));

type Props = {
  task: Task;
  onToggle: (id: string) => void;
  onEdit?: (task: Task) => void;
  onSnooze?: (id: string) => void;
  /** Swipe left. Without it the row doesn't swipe. */
  onTomorrow?: (id: string) => void;
};

/** Swipe right = done, swipe left = tomorrow. Done tasks don't swipe. */
export function TaskRow(props: Props) {
  const { task, onToggle, onTomorrow } = props;
  const swipe = useRef<SwipeableMethods>(null);
  if (task.completed || !onTomorrow) return (
      <View style={styles.gap}>
        <RowCard {...props} />
      </View>
    );

  return (
    <ReanimatedSwipeable
      ref={swipe}
      friction={1.6}
      leftThreshold={90}
      rightThreshold={90}
      overshootLeft={false}
      overshootRight={false}
      containerStyle={styles.gap}
      renderLeftActions={() => <SwipeAction label="✓ Done" bg={C.teal} side="left" />}
      renderRightActions={() => <SwipeAction label="Tomorrow →" bg={C.gold} side="right" />}
      onSwipeableOpen={(direction) => {
        swipe.current?.close();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // 'right' = the card moved right, uncovering the left (Done) action.
        if (direction === 'right') onToggle(task.id);
        else onTomorrow(task.id);
      }}>
      <RowCard {...props} />
    </ReanimatedSwipeable>
  );
}

function SwipeAction({ label, bg, side }: { label: string; bg: string; side: 'left' | 'right' }) {
  return (
    <View style={[styles.action, { backgroundColor: bg, alignItems: side === 'left' ? 'flex-start' : 'flex-end' }]}>
      <Txt v="cond" color={side === 'left' ? C.paper : C.ink}>{label}</Txt>
    </View>
  );
}

function RowCard({ task, onToggle, onEdit, onSnooze }: Props) {
  const when = new Date(task.dateTime);
  const late = when < new Date() && !task.completed;
  const category = getCategoryConfig(task.category);
  const priority = getPriorityConfig(task.priority);
  const repeats = task.recurrence && task.recurrence !== 'none';

  return (
    <Card style={[styles.card, task.completed && styles.done]}>
      <Checkbox
        checked={task.completed}
        label={`Mark ${task.title} ${task.completed ? 'not done' : 'done'}`}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle(task.id);
        }}
      />

      <Pressable style={styles.body} onPress={() => onEdit?.(task)} accessibilityRole="button" accessibilityLabel={`Edit ${task.title}`}>
        <Txt v="label" color={late ? C.accentD : C.mute}>
          {formatTime(when)} · {formatDay(when)}
        </Txt>
        <Txt v="cond" numberOfLines={2} style={[styles.title, task.completed && styles.struck]}>
          {task.title}
        </Txt>
        {task.description ? (
          <Txt numberOfLines={2} style={styles.desc}>
            {task.description}
          </Txt>
        ) : null}

        <View style={styles.badges}>
          {task.category && task.category !== 'other' ? <Badge label={category.label} color={category.color} bg={category.tint} /> : null}
          {task.priority && task.priority !== 'low' ? <Badge label={priority.label} color={C.ink} bg={C.paper2} /> : null}
          {task.alarmEnabled !== false && !task.completed ? <Badge label="⏰ Rings" color={C.paper} bg={C.accent} /> : null}
          {repeats ? <Badge label={`↻ ${repeatLabel(task, when)}`} color={C.teal} bg={C.tealLight} /> : null}
          {task.subTasks?.length ? (
            <Badge label={`☑ ${task.subTasks.filter((s) => s.completed).length}/${task.subTasks.length}`} color={C.ink} bg={C.paper2} />
          ) : null}
          {late ? <Badge label="Late" color={C.paper} bg={C.accentD} /> : null}
          {task.isExpired ? <Badge label="Expired" color={C.paper} bg={C.ink} /> : null}
          {task.alarmSnoozedCount ? <Badge label={`Snoozed ×${task.alarmSnoozedCount}`} color={C.ink} bg={C.paper2} /> : null}
        </View>

        {task.deadlineDate && !task.isExpired ? (
          <Txt v="label" style={styles.deadline}>
            {AlarmService.formatDeadlineInfo(task)}
          </Txt>
        ) : null}
      </Pressable>

      {late && onSnooze ? <IconButton icon="alarm-sharp" label={`Snooze ${task.title} 5 minutes`} onPress={() => onSnooze(task.id)} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 14 },
  // Room for the card's hard shadow inside the swipe container, which clips its contents.
  gap: { marginBottom: 10, paddingRight: 6, paddingBottom: 6 },
  action: { flex: 1, justifyContent: 'center', paddingHorizontal: 22, borderRadius: R.card, borderWidth: BW, borderColor: C.ink, marginRight: 6, marginBottom: 6 },
  done: { backgroundColor: C.paper2, boxShadow: 'none' },
  body: { flex: 1, gap: 4 },
  title: { fontSize: 21, lineHeight: 24 },
  struck: { textDecorationLine: 'line-through', color: C.mute },
  desc: { fontSize: 14, lineHeight: 20 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  deadline: { marginTop: 4, letterSpacing: 0.5 },
});
