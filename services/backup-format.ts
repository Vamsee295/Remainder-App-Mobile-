/**
 * Backup file format. No imports, so scripts/check-backup-format.ts runs it with plain node.
 * A restore reads a file from outside the app, so everything is checked before it replaces any data.
 */
export const BACKUP_APP = 'remainder';
export const BACKUP_VERSION = 1;

type Item = Record<string, unknown>;
export type Backup = { app: string; version: number; exportedAt: string; tasks: Item[]; todos: Item[]; suggestions: Item[] };

export function makeBackup(tasks: Item[], todos: Item[], suggestions: Item[], now = new Date()): Backup {
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), tasks, todos, suggestions };
}

const isObj = (v: unknown): v is Item => typeof v === 'object' && v !== null && !Array.isArray(v);
const validDate = (v: unknown) => typeof v === 'string' && !Number.isNaN(Date.parse(v));

/** Parses and checks a backup file. Throws an Error with a message fit to show the user. */
export function parseBackup(text: string): Backup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("This file isn't a Remainder backup (it's not valid JSON).");
  }
  if (!isObj(raw) || raw.app !== BACKUP_APP) throw new Error("This file isn't a Remainder backup.");
  if (typeof raw.version !== 'number' || raw.version > BACKUP_VERSION) {
    throw new Error('This backup comes from a newer version of Remainder. Update the app, then try again.');
  }

  const list = (v: unknown) => (Array.isArray(v) ? v.filter(isObj) : []);
  // Keep only items with the fields the app needs; drop anything malformed instead of crashing later.
  const tasks = list(raw.tasks).filter((t) => typeof t.id === 'string' && typeof t.title === 'string' && validDate(t.dateTime));
  const todos = list(raw.todos).filter((t) => typeof t.id === 'string' && typeof t.text === 'string');
  const suggestions = list(raw.suggestions).filter((s) => typeof s.id === 'string' && typeof s.title === 'string');

  // Notification ids belong to the phone that made the backup; the restore schedules fresh ones.
  for (const t of tasks) delete t.notificationIds;

  return {
    app: BACKUP_APP,
    version: raw.version,
    exportedAt: validDate(raw.exportedAt) ? (raw.exportedAt as string) : new Date(0).toISOString(),
    tasks,
    todos,
    suggestions,
  };
}

/** "remainder-backup-2026-11-22.json" */
export const backupFileName = (now = new Date()) =>
  `remainder-backup-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.json`;
