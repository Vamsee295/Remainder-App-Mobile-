/**
 * Quick add: plain English to a task. No imports, so scripts/check-quick-add.ts runs it with node.
 *
 *   "call mom tomorrow at 6pm"         -> tomorrow 18:00
 *   "pay rent on 25 nov" / "nov 25" / "25/11"  -> that date, 9:00
 *   "team call friday 4:30pm"          -> next Friday 16:30
 *   "stretch in 20 min" / "in 2 hours" -> from now
 *   "dinner tonight" / "walk evening"  -> 20:00 / 18:00
 *   "gym every mon and thu at 7am"     -> repeats Mon + Thu
 *   "standup weekdays 9:30" / "water plants daily" / "pay bills monthly"
 * ponytail: regexes, English only. Swap for a date library if people need "next week tuesday" style phrases.
 */
export type QuickAdd = {
  title: string;
  when: Date;
  recurrence: 'none' | 'daily' | 'weekdays' | 'days' | 'monthDay';
  repeatDays?: number[];
};

const DAY = '(sun|mon|tue|wed|thu|fri|sat)[a-z]*';
const DAY_INDEX: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH = '(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*';
const PART_OF_DAY: Record<string, number> = { morning: 9, afternoon: 14, evening: 18, tonight: 20 };

export function parseQuickAdd(input: string, now = new Date()): QuickAdd {
  let text = ` ${input} `;
  /** Finds a phrase, removes it from the title, returns the match. */
  const take = (re: RegExp) => {
    const m = text.match(re);
    if (m) text = text.replace(m[0], ' ');
    return m;
  };

  // 1. Repeats
  let recurrence: QuickAdd['recurrence'] = 'none';
  let repeatDays: number[] | undefined;
  let m: RegExpMatchArray | null;
  if (take(/\s(every\s?day|daily)(?=\s)/i)) recurrence = 'daily';
  else if (take(/\s(every\s+)?week\s?days?(?=\s)/i)) recurrence = 'weekdays';
  else if ((m = take(new RegExp(`\\severy\\s+(${DAY}(?:\\s*(?:,|and|&)\\s*${DAY})*)(?=\\s)`, 'i')))) {
    recurrence = 'days';
    repeatDays = [...new Set([...m[1].toLowerCase().matchAll(/(sun|mon|tue|wed|thu|fri|sat)/g)].map((d) => DAY_INDEX[d[1]]))].sort();
  } else if (take(/\s(every\s+month|monthly)(?=\s)/i)) recurrence = 'monthDay';

  // 2. "in 20 min" / "in 2 hours": an exact moment, nothing else to work out.
  if ((m = take(/\sin\s+(\d{1,3})\s*(m|mins?|minutes?|h|hrs?|hours?)(?=\s)/i))) {
    const minutes = Number(m[1]) * (m[2].toLowerCase().startsWith('h') ? 60 : 1);
    const when = new Date(now.getTime() + minutes * 60000);
    when.setSeconds(0, 0);
    return { title: clean(text), when, recurrence, repeatDays };
  }

  // 3. Which day
  const when = new Date(now);
  let dayGiven = false;
  let weekdayGiven = false;
  if (take(/\stomorrow(?=\s)/i)) {
    when.setDate(when.getDate() + 1);
    dayGiven = true;
  } else if (take(/\stoday(?=\s)/i)) {
    dayGiven = true;
  } else if ((m = take(new RegExp(`\\s(?:on\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH}(?=\\s)`, 'i')) ?? take(new RegExp(`\\s(?:on\\s+)?${MONTH}\\s+(\\d{1,2})(?:st|nd|rd|th)?(?=\\s)`, 'i')))) {
    // "25 nov" puts the day first, "nov 25" the month first.
    const dayFirst = /^\d/.test(m[1]);
    setDate(when, now, MONTHS.indexOf((dayFirst ? m[2] : m[1]).toLowerCase().slice(0, 3)), Number(dayFirst ? m[1] : m[2]));
    dayGiven = true;
  } else if ((m = take(/\s(?:on\s+)?(\d{1,2})\/(\d{1,2})(?=\s)/))) {
    setDate(when, now, Number(m[2]) - 1, Number(m[1])); // day/month, as written in India and most of the world
    dayGiven = true;
  } else if ((m = take(new RegExp(`\\s(?:on\\s+|next\\s+|this\\s+)?${DAY}(?=\\s)`, 'i')))) {
    const target = DAY_INDEX[m[1].toLowerCase()];
    when.setDate(when.getDate() + ((target - when.getDay() + 7) % 7));
    dayGiven = weekdayGiven = true;
  }

  // 4. What time
  const part = take(/\s(morning|afternoon|evening|tonight)(?=\s)/i);
  const t = text.match(/\s(?:at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?|(\d{1,2}):(\d{2})\s*(am|pm)?|(\d{1,2})\s*(am|pm))(?=\s)/i);
  let hour = NaN;
  let minute = 0;
  if (t) {
    const raw = Number(t[1] ?? t[4] ?? t[7]);
    const period = (t[3] ?? t[6] ?? t[8])?.toLowerCase();
    minute = Number(t[2] ?? t[5] ?? 0);
    if (raw <= 23 && minute <= 59 && !(period && (raw < 1 || raw > 12))) {
      hour = raw;
      if (period === 'pm' && hour < 12) hour += 12;
      if (period === 'am' && hour === 12) hour = 0;
      // "at 7" with "evening"/"tonight" means 7 pm.
      if (!period && part && /evening|tonight|afternoon/i.test(part[1]) && hour < 12) hour += 12;
      text = text.replace(t[0], ' ');
    } else {
      minute = 0; // not a real time (e.g. "look at 99 problems"): it stays in the title
    }
  }
  if (Number.isNaN(hour) && part) hour = PART_OF_DAY[part[1].toLowerCase()];

  if (!Number.isNaN(hour)) {
    when.setHours(hour, minute, 0, 0);
    if (when <= now) {
      // Passed already: a named weekday means next week; no day at all means tomorrow.
      if (weekdayGiven) when.setDate(when.getDate() + 7);
      else if (!dayGiven) when.setDate(when.getDate() + 1);
    }
  } else if (dayGiven || recurrence !== 'none') {
    when.setHours(9, 0, 0, 0); // a day but no time -> 9:00
    if (when <= now && weekdayGiven) when.setDate(when.getDate() + 7);
    if (when <= now && !dayGiven) when.setDate(when.getDate() + 1);
  } else {
    when.setTime(now.getTime() + 60 * 60 * 1000); // no day, no time -> in one hour
    when.setSeconds(0, 0);
  }

  return { title: clean(text), when, recurrence, repeatDays };
}

const clean = (text: string) => text.replace(/\s+/g, ' ').trim();

/** Sets month/day; a date that already passed this year means next year. */
function setDate(when: Date, now: Date, month: number, day: number) {
  when.setFullYear(now.getFullYear(), month, day);
  const end = new Date(when);
  end.setHours(23, 59, 59, 999);
  if (end < now) when.setFullYear(now.getFullYear() + 1, month, day);
}
