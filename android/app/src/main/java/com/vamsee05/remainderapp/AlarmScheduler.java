package com.vamsee05.remainderapp;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import org.json.JSONObject;

import java.util.Map;

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
    static final long DAY_MS = 24L * 60 * 60 * 1000;

    private AlarmScheduler() {}

    /** Ringing alarm (the original behaviour). */
    public static boolean schedule(Context context, String id, long time, String sound, String title,
                                   String description, boolean repeatDaily, long until) {
        return schedule(context, id, time, sound, title, description, repeatDaily, until, "ring", 0);
    }

    /**
     * @param mode     "ring" = full-screen ringing alarm, "notify" = normal notification with Done / Snooze
     * @param followUp how many follow-ups already went out for this round (Notify only)
     * @return false when the system does not allow exact alarms (the caller should fall back).
     */
    public static boolean schedule(Context context, String id, long time, String sound, String title,
                                   String description, boolean repeatDaily, long until, String mode, int followUp) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) return false;

        try {
            JSONObject data = new JSONObject();
            data.put("time", time);
            data.put("sound", sound == null ? "default" : sound);
            data.put("title", title == null ? "Reminder" : title);
            data.put("description", description == null ? "" : description);
            data.put("repeatDaily", repeatDaily);
            data.put("until", until);
            data.put("mode", "notify".equals(mode) ? "notify" : "ring");
            data.put("followUp", followUp);
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
        drop(context, id, id + SNOOZE_SUFFIX, id + FOLLOW_UP_SUFFIX);
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
        for (String suffix : new String[]{SNOOZE_SUFFIX, FOLLOW_UP_SUFFIX}) {
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
        long next = data.optLong("time", now) + DAY_MS;
        while (next <= now) next += DAY_MS;

        if (data.optBoolean("repeatDaily", false) && (until == 0 || next <= until)) {
            schedule(context, id, next, data.optString("sound"), data.optString("title"),
                data.optString("description"), true, until, data.optString("mode", "ring"), 0);
        } else {
            prefs(context).edit().remove(id).apply();
        }
    }

    /** Alarms are wiped when the phone restarts, so set every saved one again. */
    public static void rescheduleAll(Context context) {
        long now = System.currentTimeMillis();
        for (Map.Entry<String, ?> entry : prefs(context).getAll().entrySet()) {
            String id = entry.getKey();
            JSONObject data = load(context, id);
            if (data == null) continue;

            long time = data.optLong("time", 0);
            long until = data.optLong("until", 0);
            boolean repeat = data.optBoolean("repeatDaily", false);

            if (time <= now && repeat) {
                while (time <= now) time += DAY_MS;
                if (until != 0 && time > until) {
                    prefs(context).edit().remove(id).apply();
                    continue;
                }
            } else if (time <= now) {
                time = now + 15000; // missed while the phone was off: ring shortly after boot
            }
            schedule(context, id, time, data.optString("sound"), data.optString("title"),
                data.optString("description"), repeat, until, data.optString("mode", "ring"), data.optInt("followUp", 0));
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
