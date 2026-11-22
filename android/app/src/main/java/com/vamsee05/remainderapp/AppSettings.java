package com.vamsee05.remainderapp;

import android.content.Context;
import android.content.SharedPreferences;

/** User settings the native side needs (set from the app's Settings section via AlarmModule.setSettings). */
final class AppSettings {
    private static final String PREFS = "AppSettings";

    private AppSettings() {}

    /** Snooze length in minutes (default 10). */
    static int snoozeMinutes(Context context) {
        return clamp(prefs(context).getInt("snooze", 10), 1, 120);
    }

    /** "Still to do" follow-ups after a Notify reminder, 5 minutes apart (default 2). */
    static int followUps(Context context) {
        return clamp(prefs(context).getInt("followUps", 2), 0, 5);
    }

    /** How long an alarm rings before it stops and leaves a missed-alarm note (default 2 min). */
    static long ringMs(Context context) {
        return clamp(prefs(context).getInt("ringMinutes", 2), 1, 30) * 60000L;
    }

    static void save(Context context, int snooze, int followUps, int ringMinutes) {
        prefs(context).edit().putInt("snooze", snooze).putInt("followUps", followUps).putInt("ringMinutes", ringMinutes).apply();
    }

    private static int clamp(int v, int min, int max) {
        return Math.max(min, Math.min(max, v));
    }

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }
}
