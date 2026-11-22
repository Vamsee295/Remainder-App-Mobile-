package com.vamsee05.remainderapp;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import org.json.JSONObject;

import java.util.Calendar;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Single place that schedules, cancels and restores alarms.
 * Every alarm is stored in SharedPreferences as JSON under its id, so it can be
 * read back when it fires and re-scheduled after the phone restarts.
 */
public final class AlarmScheduler {
    private static final String TAG = "AlarmScheduler";
    private static final String PREFS = "AlarmPrefsV2";
    static final String SNOOZE_SUFFIX = "#snooze";
    /** "Still to do" follow-ups of a Notify reminder, 5 and 10 minutes after it. */
    static final String FOLLOW_UP_SUFFIX = "#nag";
    static final int FOLLOW_UPS = 2;
    /** Heads-up shown `early` ms before a reminder. */
    static final String EARLY_SUFFIX = "#early";

    private AlarmScheduler() {}

    /**
     * @param repeat   "" (once) | "daily" | "days:1,3,5" (0 = Sunday) | "monthly:15" — same rules as services/repeat-rules.ts
     * @param until    timestamp after which a repeating alarm stops (0 = never)
     * @param mode     "ring" = full-screen ringing alarm, "notify" = normal notification with Done / Snooze
     * @param followUp how many follow-ups already went out for this round (Notify only)
     * @return false when the system does not allow exact alarms (the caller should fall back).
     */
    public static boolean schedule(Context context, String id, long time, String sound, String title,
                                   String description, String repeat, long until, String mode, int followUp) {
        return schedule(context, id, time, sound, title, description, repeat, until, mode, followUp, 0);
    }

    /**
     * @param early heads-up this many ms before each occurrence (0 = none). The heads-up is set here every time
     *              the reminder is set, so repeats and reboots carry it along without extra bookkeeping.
     */
    public static boolean schedule(Context context, String id, long time, String sound, String title,
                                   String description, String repeat, long until, String mode, int followUp, long early) {
        if (!scheduleOne(context, id, time, sound, title, description, repeat, until, mode, followUp, early)) return false;
        if (early > 0 && time - early > System.currentTimeMillis()) {
            scheduleOne(context, id + EARLY_SUFFIX, time - early, sound, title, description, "", 0, "early", 0, early);
        } else {
            drop(context, id + EARLY_SUFFIX);
        }
        return true;
    }

    private static boolean scheduleOne(Context context, String id, long time, String sound, String title,
                                       String description, String repeat, long until, String mode, int followUp, long early) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) return false;

        try {
            JSONObject data = new JSONObject();
            data.put("time", time);
            data.put("sound", sound == null ? "default" : sound);
            data.put("title", title == null ? "Reminder" : title);
            data.put("description", description == null ? "" : description);
            data.put("repeat", repeat == null ? "" : repeat);
            data.put("until", until);
            data.put("mode", "notify".equals(mode) || "early".equals(mode) ? mode : "ring");
            data.put("followUp", followUp);
            data.put("early", early);
            prefs(context).edit().putString(id, data.toString()).apply();
        } catch (Exception e) {
            Log.e(TAG, "Could not save alarm " + id, e);
            return false;
        }

        // Tapping the alarm icon in the status bar opens the app.
        Intent open = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        PendingIntent show = PendingIntent.getActivity(context, 0, open == null ? new Intent() : open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        // setAlarmClock is the most reliable alarm type: it fires on time even in Doze mode.
        alarmManager.setAlarmClock(new AlarmManager.AlarmClockInfo(time, show), firePendingIntent(context, id));
        Log.d(TAG, "Scheduled " + id + " at " + time);
        return true;
    }

    /** Cancels the alarm and any snooze or follow-up that came from it. */
    public static void cancel(Context context, String id) {
        drop(context, id, id + SNOOZE_SUFFIX, id + FOLLOW_UP_SUFFIX, id + EARLY_SUFFIX);
    }

    /** Cancels this round's snooze and follow-ups but keeps the main (possibly repeating) alarm. */
    public static void cancelFollowUps(Context context, String id) {
        drop(context, id + SNOOZE_SUFFIX, id + FOLLOW_UP_SUFFIX);
    }

    private static void drop(Context context, String... keys) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        for (String key : keys) {
            if (alarmManager != null) alarmManager.cancel(firePendingIntent(context, key));
            prefs(context).edit().remove(key).apply();
        }
    }

    /** "task#snooze" / "task#nag" -> "task": the id the app knows the task by. */
    static String baseId(String alarmId) {
        for (String suffix : new String[]{SNOOZE_SUFFIX, FOLLOW_UP_SUFFIX, EARLY_SUFFIX}) {
            if (alarmId.endsWith(suffix)) return alarmId.substring(0, alarmId.length() - suffix.length());
        }
        return alarmId;
    }

    public static JSONObject load(Context context, String id) {
        try {
            String raw = prefs(context).getString(id, null);
            return raw == null ? null : new JSONObject(raw);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Called right after an alarm fired: a repeating alarm is set again for the next day,
     * a one-time alarm is forgotten.
     */
    public static void afterFired(Context context, String id, JSONObject data) {
        long now = System.currentTimeMillis();
        long until = data.optLong("until", 0);
        String repeat = repeatRule(data);

        if (!repeat.isEmpty()) {
            long next = nextTime(data.optLong("time", now), repeat, now);
            if (until == 0 || next <= until) {
                schedule(context, id, next, data.optString("sound"), data.optString("title"),
                    data.optString("description"), repeat, until, data.optString("mode", "ring"), 0, data.optLong("early", 0));
                return;
            }
        }
        prefs(context).edit().remove(id).apply();
    }

    /** Saved rule; alarms saved before repeat rules existed only had a "repeatDaily" flag. */
    static String repeatRule(JSONObject data) {
        String repeat = data.optString("repeat", "");
        return repeat.isEmpty() && data.optBoolean("repeatDaily", false) ? "daily" : repeat;
    }

    /** First occurrence after `now`, stepping from `from` by the rule (at least one step). Calendar days keep the time across DST. */
    static long nextTime(long from, String rule, long now) {
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(from);
        int guard = 0;
        do {
            step(c, rule);
        } while (c.getTimeInMillis() <= now && guard++ < 5000);
        return c.getTimeInMillis();
    }

    private static void step(Calendar c, String rule) {
        if (rule.startsWith("monthly:")) {
            int day = Integer.parseInt(rule.substring(8));
            c.set(Calendar.DAY_OF_MONTH, 1);
            c.add(Calendar.MONTH, 1);
            c.set(Calendar.DAY_OF_MONTH, Math.min(day, c.getActualMaximum(Calendar.DAY_OF_MONTH)));
        } else if (rule.startsWith("days:")) {
            Set<Integer> days = new HashSet<>();
            for (String d : rule.substring(5).split(",")) if (!d.isEmpty()) days.add(Integer.parseInt(d.trim()));
            for (int i = 0; i < 7; i++) {
                c.add(Calendar.DAY_OF_MONTH, 1);
                if (days.isEmpty() || days.contains(c.get(Calendar.DAY_OF_WEEK) - 1)) break; // DAY_OF_WEEK: Sunday = 1
            }
        } else {
            c.add(Calendar.DAY_OF_MONTH, 1);
        }
    }

    /** Alarms are wiped when the phone restarts, so set every saved one again. */
    public static void rescheduleAll(Context context) {
        long now = System.currentTimeMillis();
        for (Map.Entry<String, ?> entry : prefs(context).getAll().entrySet()) {
            String id = entry.getKey();
            JSONObject data = load(context, id);
            if (data == null) continue;
            if (id.endsWith(EARLY_SUFFIX)) continue; // re-created below together with its reminder

            long time = data.optLong("time", 0);
            long until = data.optLong("until", 0);
            String repeat = repeatRule(data);

            if (time <= now && !repeat.isEmpty()) {
                time = nextTime(time, repeat, now);
                if (until != 0 && time > until) {
                    prefs(context).edit().remove(id).apply();
                    continue;
                }
            } else if (time <= now) {
                time = now + 15000; // missed while the phone was off: ring shortly after boot
            }
            schedule(context, id, time, data.optString("sound"), data.optString("title"),
                data.optString("description"), repeat, until, data.optString("mode", "ring"), data.optInt("followUp", 0),
                data.optLong("early", 0));
        }
    }

    private static PendingIntent firePendingIntent(Context context, String id) {
        Intent intent = new Intent(context, AlarmReceiver.class);
        intent.setAction("com.vamsee05.remainderapp.ALARM_FIRE");
        intent.putExtra("alarmId", id);
        return PendingIntent.getBroadcast(context, id.hashCode(), intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }
}
