// Run: node --experimental-strip-types scripts/check-share-format.ts
import assert from 'node:assert/strict';
import { parseQuickAdd } from '../services/quick-add.ts';
import { quickAddLine, shareListText } from '../services/share-format.ts';

const now = new Date(2026, 10, 17, 14, 0); // Tue Nov 17 2026
const roundTrip = (task: { title: string; dateTime: string; recurrence?: string; repeatDays?: number[] }) => {
  const line = quickAddLine(task);
  const back = parseQuickAdd(line, now);
  assert.equal(back.title, task.title, line);
  assert.equal(back.when.getTime(), new Date(task.dateTime).getTime(), `${line} -> ${back.when}`);
  return { line, back };
};

const fri = new Date(2026, 10, 27, 18, 5).toISOString();
assert.equal(roundTrip({ title: 'call mom', dateTime: fri }).line, 'call mom on 27 nov at 6:05pm');
assert.equal(roundTrip({ title: 'standup', dateTime: new Date(2026, 10, 18, 9, 30).toISOString(), recurrence: 'weekdays' }).back.recurrence, 'weekdays');
const days = roundTrip({ title: 'gym', dateTime: new Date(2026, 10, 19, 7, 0).toISOString(), recurrence: 'days', repeatDays: [1, 4] });
assert.deepEqual(days.back.repeatDays, [1, 4]);
assert.equal(roundTrip({ title: 'midnight snack', dateTime: new Date(2026, 10, 20, 0, 15).toISOString() }).line, 'midnight snack on 20 nov at 12:15am');

assert.equal(shareListText('Groceries', [{ text: 'eggs', done: true }, { text: 'milk', done: false }]), 'Groceries\n☐ milk\n☑ eggs\n\n— from Remainder');
console.log('share-format: all checks passed');
