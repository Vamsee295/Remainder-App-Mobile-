/**
 * Text for sharing reminders. No imports, so scripts/check-share-format.ts runs it with node.
 *
 * Chat apps don't make custom app links tappable, so a shared reminder is one plain line that
 * Remainder's quick add understands: the friend pastes it into quick add and gets the same task.
 */
type Shareable = { title: string; dateTime: string; recurrence?: string; repeatDays?: number[]; completed?: boolean };

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** "call mom on 27 nov at 6:05pm every mon, thu" — round-trips through parseQuickAdd. */
export function quickAddLine(task: Shareable): string {
  const d = new Date(task.dateTime);
  const h = d.getHours() % 12 || 12;
  const time = `${h}:${String(d.getMinutes()).padStart(2, '0')}${d.getHours() < 12 ? 'am' : 'pm'}`;
  const repeat =
    task.recurrence === 'daily' || task.recurrence === 'weekly' || task.recurrence === 'monthly'
      ? ' daily'
      : task.recurrence === 'weekdays'
        ? ' weekdays'
        : task.recurrence === 'days' && task.repeatDays?.length
          ? ` every ${task.repeatDays.map((n) => DAYS[n]).join(', ')}`
          : task.recurrence === 'monthDay'
            ? ' monthly'
            : '';
  return `${task.title} on ${d.getDate()} ${MONTHS[d.getMonth()]} at ${time}${repeat}`;
}

/** One reminder, ready for WhatsApp / SMS. */
export function shareTaskText(task: Shareable): string {
  return `🔔 ${quickAddLine(task)}\n\nGot Remainder? Paste the line above into quick add.`;
}

/** A whole list (to-dos or tasks), ticked items last. */
export function shareListText(title: string, items: { text: string; done: boolean }[]): string {
  const sorted = [...items.filter((i) => !i.done), ...items.filter((i) => i.done)];
  return `${title}\n${sorted.map((i) => `${i.done ? '☑' : '☐'} ${i.text}`).join('\n')}\n\n— from Remainder`;
}
