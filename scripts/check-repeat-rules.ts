// Run: node --experimental-strip-types scripts/check-repeat-rules.ts
import assert from 'node:assert/strict';
import { describe, nextAfter, ruleFor, snap, step, toNative } from '../services/repeat-rules.ts';

const d = (m: number, day: number, h = 9) => new Date(2026, m, day, h, 0); // months are 0-based
const same = (a: Date, b: Date, msg: string) => assert.equal(a.getTime(), b.getTime(), `${msg}: ${a} vs ${b}`);
const wed = d(10, 18); // Wed Nov 18 2026

// daily
same(step(wed, ruleFor('daily', undefined, wed)), d(10, 19), 'daily +1');
// weekdays: Fri -> Mon
same(step(d(10, 20), ruleFor('weekdays', undefined, wed)), d(10, 23), 'weekdays skip weekend');
// picked days Mon/Wed/Fri
const mwf = ruleFor('days', [1, 3, 5], wed);
same(step(wed, mwf), d(10, 20), 'MWF wed->fri');
same(step(d(10, 20), mwf), d(10, 23), 'MWF fri->mon');
same(snap(d(10, 19), mwf), d(10, 20), 'snap thu -> fri');
same(snap(wed, mwf), wed, 'snap keeps a matching day');
// monthly on the 31st: Jan 31 -> Feb 28 -> Mar 31
const m31 = ruleFor('monthDay', [31], d(0, 31));
same(step(d(0, 31), m31), d(1, 28), 'monthly 31 in Feb');
same(step(d(1, 28), m31), d(2, 31), 'monthly back to 31');
// nextAfter skips the past
same(nextAfter(d(10, 1), ruleFor('daily', undefined, wed), d(10, 18, 12).getTime()), d(10, 19), 'nextAfter skips past days');
// legacy 7/30-day options repeat daily
same(step(wed, ruleFor('weekly', undefined, wed)), d(10, 19), 'legacy weekly is daily');
// native strings and labels
assert.equal(toNative(mwf), 'days:1,3,5');
assert.equal(toNative(m31), 'monthly:31');
assert.equal(toNative(ruleFor('none', undefined, wed)), '');
assert.equal(describe(ruleFor('weekdays', undefined, wed)), 'Weekdays');
assert.equal(describe(mwf), 'Mon Wed Fri');
console.log('repeat-rules: all checks passed');
