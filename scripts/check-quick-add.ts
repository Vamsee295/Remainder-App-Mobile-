// Run: node --experimental-strip-types scripts/check-quick-add.ts
import assert from 'node:assert/strict';
import { parseQuickAdd } from '../services/quick-add.ts';

const now = new Date(2026, 10, 17, 14, 0); // Nov 17 2026, 2:00 pm
const at = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m).getTime();
const check = (input: string, title: string, when: number) => {
  const r = parseQuickAdd(input, now);
  assert.equal(r.title, title, input);
  assert.equal(r.when.getTime(), when, `${input} -> ${r.when}`);
};

check('call mom at 6pm', 'call mom', at(17, 18));
check('call mom tomorrow at 6:30 pm', 'call mom', at(18, 18, 30));
check('standup at 9am', 'standup', at(18, 9)); // already passed today -> tomorrow
check('gym 18:30', 'gym', at(17, 18, 30));
check('pay rent tomorrow', 'pay rent', at(18, 9));
check('buy milk', 'buy milk', at(17, 15)); // no time -> in one hour
check('lunch at 12pm today', 'lunch', at(17, 12)); // day named, so it stays today even though passed
check('wake up at 12am', 'wake up', at(18, 0));
check('look at 99 problems', 'look at 99 problems', at(17, 15)); // not a time
check('gym every day at 7am', 'gym', at(18, 7));
assert.equal(parseQuickAdd('gym every day at 7am', now).daily, true);
assert.equal(parseQuickAdd('read daily', now).daily, true);
assert.equal(parseQuickAdd('call mom at 6pm', now).daily, false);
console.log('quick-add: all checks passed');
