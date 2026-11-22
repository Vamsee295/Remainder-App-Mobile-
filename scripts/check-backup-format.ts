// Run: node --experimental-strip-types scripts/check-backup-format.ts
import assert from 'node:assert/strict';
import { backupFileName, makeBackup, parseBackup } from '../services/backup-format.ts';

const task = { id: 't1', title: 'Gym', dateTime: '2026-11-23T09:00:00.000Z', notificationIds: ['old'] };
const round = parseBackup(JSON.stringify(makeBackup([task, { id: 'bad' }], [{ id: 'd1', text: 'Milk' }], [])));
assert.equal(round.tasks.length, 1, 'malformed task dropped');
assert.equal(round.tasks[0].notificationIds, undefined, 'old notification ids removed');
assert.equal(round.todos.length, 1);

assert.throws(() => parseBackup('not json'), /not valid JSON/);
assert.throws(() => parseBackup('{"app":"other"}'), /isn't a Remainder backup/);
assert.throws(() => parseBackup('{"app":"remainder","version":99}'), /newer version/);
assert.equal(parseBackup('{"app":"remainder","version":1}').tasks.length, 0, 'missing lists become empty');

assert.equal(backupFileName(new Date(2026, 10, 2)), 'remainder-backup-2026-11-02.json');
console.log('backup-format: all checks passed');
