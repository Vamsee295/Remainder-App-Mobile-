/**
 * Quick add: "call mom tomorrow at 6pm" -> { title: "call mom", when: <tomorrow 18:00> }.
 * Understands "today", "tomorrow", "at 6", "at 6pm", "at 6:30 pm", "18:30".
 * ponytail: tiny regex parser, no weekdays or dates. If people type "next friday", add a date library then.
 */
export function parseQuickAdd(input: string, now = new Date()): { title: string; when: Date; daily: boolean } {
  let text = ` ${input} `;
  const when = new Date(now);
  let dayGiven = false;

  // "every day" / "daily" -> repeats daily
  const daily = /\s(every\s?day|daily)\s/i.test(text);
  text = text.replace(/\s(every\s?day|daily)(?=\s)/gi, ' ');

  if (/\stomorrow\s/i.test(text)) {
    when.setDate(when.getDate() + 1);
    dayGiven = true;
  } else if (/\stoday\s/i.test(text)) {
    dayGiven = true;
  }
  text = text.replace(/\s(today|tomorrow)(?=\s)/gi, ' ');

  // "at 6", "at 6pm", "at 6:30 pm", or a bare "18:30" / "6pm"
  const m = text.match(/\s(?:at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?|(\d{1,2}):(\d{2})\s*(am|pm)?|(\d{1,2})\s*(am|pm))(?=\s)/i);
  const hourRaw = m ? Number(m[1] ?? m[4] ?? m[7]) : NaN;
  const minute = m ? Number(m[2] ?? m[5] ?? 0) : 0;
  const period = m ? (m[3] ?? m[6] ?? m[8])?.toLowerCase() : undefined;

  if (m && hourRaw <= 23 && minute <= 59 && !(period && (hourRaw < 1 || hourRaw > 12))) {
    let hour = hourRaw;
    if (period === 'pm' && hour < 12) hour += 12;
    if (period === 'am' && hour === 12) hour = 0;
    when.setHours(hour, minute, 0, 0);
    // A time that already passed today means tomorrow, unless a day was named.
    if (!dayGiven && when <= now) when.setDate(when.getDate() + 1);
    text = text.replace(m[0], ' ');
  } else if (dayGiven && when.toDateString() !== now.toDateString()) {
    when.setHours(9, 0, 0, 0); // "tomorrow" with no time -> 9:00
  } else {
    when.setTime(now.getTime() + 60 * 60 * 1000); // no time at all -> in one hour
    when.setSeconds(0, 0);
  }

  return { title: text.replace(/\s+/g, ' ').trim(), when, daily };
}
