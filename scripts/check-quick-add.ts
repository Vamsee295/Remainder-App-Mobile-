// Run: node --experimental-strip-types scripts/check-quick-add.ts
import assert from 'node:assert/strict';
import { parseQuickAdd } from '../services/quick-add.ts';

const now = new Date(2026, 10, 17, 14, 0); // Tue Nov 17 2026, 2:00 pm
const at = (d: number, h: number, m = 0, month = 10, year = 2026) => new Date(year, month, d, h, m).getTime();
const check = (input: string, title: string, when: number, recurrence = 'none') => {
  const r = parseQuickAdd(input, now);
  assert.equal(r.title, title, input);
  assert.equal(r.when.getTime(), when, `${input} -> ${r.when}`);
  assert.equal(r.recurrence, recurrence, `${input} recurrence`);
  return r;
};

// times and today / tomorrow (unchanged behaviour)
check('call mom at 6pm', 'call mom', at(17, 18));
check('call mom tomorrow at 6:30 pm', 'call mom', at(18, 18, 30));
check('standup at 9am', 'standup', at(18, 9)); // already passed today -> tomorrow
check('gym 18:30', 'gym', at(17, 18, 30));
check('pay rent tomorrow', 'pay rent', at(18, 9));
check('buy milk', 'buy milk', at(17, 15)); // no time -> in one hour
check('lunch at 12pm today', 'lunch', at(17, 12)); // day named, so it stays today even though passed
check('wake up at 12am', 'wake up', at(18, 0));
check('look at 99 problems', 'look at 99 problems', at(17, 15)); // not a time

// relative
check('stretch in 20 min', 'stretch', at(17, 14, 20));
check('call back in 2 hours', 'call back', at(17, 16));

// weekdays
check('team call friday 4:30pm', 'team call', at(20, 16, 30));
check('review on mon', 'review', at(23, 9));
check('standup tuesday 9am', 'standup', at(24, 9)); // today is Tuesday but 9am passed -> next week
check('demo tuesday 5pm', 'demo', at(17, 17)); // today, still ahead

// dates
check('pay rent on 25 nov', 'pay rent', at(25, 9));
check('pay rent nov 25 at 10am', 'pay rent', at(25, 10));
check('dentist 3/12 4pm', 'dentist', at(3, 16, 0, 11)); // 3 December
check('renew passport 5 jan', 'renew passport', at(5, 9, 0, 0, 2027)); // passed this year -> next year

// parts of the day
check('dinner tonight', 'dinner', at(17, 20));
check('walk evening at 7', 'walk', at(17, 19));
check('jog morning', 'jog', at(18, 9)); // morning already gone -> tomorrow

// repeats
check('water plants daily', 'water plants', at(18, 9), 'daily');
check('gym every day at 7am', 'gym', at(18, 7), 'daily');
check('standup weekdays 9:30', 'standup', at(18, 9, 30), 'weekdays');
const days = check('gym every mon and thu at 7am', 'gym', at(18, 7), 'days');
assert.deepEqual(days.repeatDays, [1, 4]);
check('pay bills monthly', 'pay bills', at(18, 9), 'monthDay');

console.log('quick-add: all checks passed');
