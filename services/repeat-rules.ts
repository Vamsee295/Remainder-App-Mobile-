/**
 * Repeat rules, shared by the app and (mirrored in AlarmScheduler.java) the native scheduler.
 * No imports, so scripts/check-repeat-rules.ts can run it with plain node.
 *
 * Recurrence values: 'daily' | 'weekdays' | 'days' (picked weekdays) | 'monthDay' (same date each month)
 * | 'weekly' / 'monthly' (legacy names: daily for 7 / 30 days, stopped by the task's deadline).
 */
export type Rule =
  | { kind: 'none' }
  | { kind: 'daily' }
  | { kind: 'days'; days: number[] } // 0 = Sunday ... 6 = Saturday
  | { kind: 'monthDay'; day: number }; // 1..31; short months use their last day

export const WEEKDAYS = [1, 2, 3, 4, 5];

/** repeatDays holds the picked weekdays for 'days', or [day of month] for 'monthDay'. */
export function ruleFor(recurrence: string | undefined, repeatDays: number[] | undefined, anchor: Date): Rule {
  switch (recurrence) {
    case 'daily':
    case 'weekly':
    case 'monthly':
      return { kind: 'daily' };
    case 'weekdays':
      return { kind: 'days', days: WEEKDAYS };
    case 'days':
      return { kind: 'days', days: repeatDays?.length ? repeatDays : [anchor.getDay()] };
    case 'monthDay':
      return { kind: 'monthDay', day: repeatDays?.[0] ?? anchor.getDate() };
    default:
      return { kind: 'none' };
  }
}

const daysIn = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

/** True when `d` is a day this rule fires on. */
export function matches(d: Date, rule: Rule): boolean {
  if (rule.kind === 'days') return rule.days.includes(d.getDay());
  if (rule.kind === 'monthDay') return d.getDate() === Math.min(rule.day, daysIn(d.getFullYear(), d.getMonth()));
  return rule.kind === 'daily';
}

/** The next occurrence strictly after `d`, same time of day. Calendar days, so DST doesn't shift the time. */
export function step(d: Date, rule: Rule): Date {
  const next = new Date(d);
  if (rule.kind === 'monthDay') {
    next.setDate(1);
    next.setMonth(next.getMonth() + 1);
    next.setDate(Math.min(rule.day, daysIn(next.getFullYear(), next.getMonth())));
    return next;
  }
  do next.setDate(next.getDate() + 1);
  while (rule.kind === 'days' && !rule.days.includes(next.getDay()));
  return next;
}

/** `d` if the rule fires that day, otherwise the next day it does (used for the first reminder). */
export function snap(d: Date, rule: Rule): Date {
  return rule.kind === 'none' || matches(d, rule) ? d : step(d, rule);
}

/** First occurrence after `now`, stepping from `d` (at least one step). */
export function nextAfter(d: Date, rule: Rule, now = Date.now()): Date {
  let next = step(d, rule);
  for (let i = 0; next.getTime() <= now && i < 5000; i++) next = step(next, rule);
  return next;
}

/** Rule as the native scheduler reads it: "" | "daily" | "days:1,3,5" | "monthly:15". */
export function toNative(rule: Rule): string {
  if (rule.kind === 'daily') return 'daily';
  if (rule.kind === 'days') return `days:${rule.days.join(',')}`;
  if (rule.kind === 'monthDay') return `monthly:${rule.day}`;
  return '';
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Short label for badges: "Daily", "Weekdays", "Mon Wed Fri", "Monthly on 15". */
export function describe(rule: Rule): string {
  if (rule.kind === 'daily') return 'Daily';
  if (rule.kind === 'monthDay') return `Monthly on ${rule.day}`;
  if (rule.kind === 'days') {
    const days = [...rule.days].sort();
    if (days.join() === WEEKDAYS.join()) return 'Weekdays';
    if (days.length === 7) return 'Daily';
    return days.map((d) => DAY_NAMES[d]).join(' ');
  }
  return '';
}
