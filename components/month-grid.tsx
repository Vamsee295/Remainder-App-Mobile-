import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { IconButton, Txt } from '@/components/kit';
import { BW, C } from '@/constants/theme';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

type Props = {
  selected: Date;
  onSelect: (date: Date) => void;
  /** Days before this are disabled. */
  minDate?: Date;
  /** Days (Date.toDateString()) that get a dot. */
  marked?: Set<string>;
};

/** Month calendar. Used by the Calendar tab and as the date picker in sheets. */
export function MonthGrid({ selected, onSelect, minDate, marked }: Props) {
  const [month, setMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  const today = new Date().toDateString();
  const min = minDate ? startOfDay(minDate) : null;

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array(month.getDay()).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
  ];
  const shift = (by: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + by, 1));

  return (
    <View>
      <View style={styles.head}>
        <IconButton icon="chevron-back-sharp" label="Previous month" onPress={() => shift(-1)} />
        <Txt v="cond" style={styles.month}>
          {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Txt>
        <IconButton icon="chevron-forward-sharp" label="Next month" onPress={() => shift(1)} />
      </View>

      <View style={styles.grid}>
        {WEEKDAYS.map((d, i) => (
          <View key={i} style={styles.cell}>
            <Txt v="label">{d}</Txt>
          </View>
        ))}
        {cells.map((date, i) => {
          if (!date) return <View key={i} style={styles.cell} />;
          const key = date.toDateString();
          const isSelected = key === selected.toDateString();
          const disabled = !!min && date < min;
          return (
            <Pressable
              key={i}
              disabled={disabled}
              onPress={() => onSelect(date)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled }}
              accessibilityLabel={date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              style={styles.cell}>
              <View style={[styles.day, key === today && styles.today, isSelected && styles.selected]}>
                <Txt v="mono" style={[styles.num, disabled && { color: C.line }, isSelected && { color: C.paper }]}>
                  {date.getDate()}
                </Txt>
                {marked?.has(key) ? <View style={[styles.dot, isSelected && { backgroundColor: C.paper }]} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  month: { fontSize: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, height: 44, alignItems: 'center', justifyContent: 'center' },
  day: { width: 38, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: BW, borderColor: 'transparent' },
  today: { borderColor: C.ink, borderStyle: 'dashed' },
  selected: { backgroundColor: C.accent, borderColor: C.ink, borderStyle: 'solid', boxShadow: `2px 3px 0 ${C.ink}` },
  num: { fontSize: 14 },
  dot: { position: 'absolute', bottom: 3, width: 5, height: 5, borderRadius: 3, backgroundColor: C.accent },
});
