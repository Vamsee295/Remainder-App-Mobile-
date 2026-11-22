package com.vamsee05.remainderapp;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import androidx.core.app.NotificationCompat;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Done / Snooze from outside the app (notification buttons, alarm screen).
 * Works with the app closed: each tap is written to a small queue in SharedPreferences,
 * and the app applies the queue (marks done, moves the time) the next time it opens.
 */
public class AlarmActions extends BroadcastReceiver {
    static final String ACTION_DONE = "com.vamsee05.remainderapp.TASK_DONE";
    static final String ACTION_SNOOZE = "com.vamsee05.remainderapp.TASK_SNOOZE";
    static final int SNOOZE_MINUTES = 10;

    private static final String EVENTS = "AlarmEvents";
    private static final String REMINDER_CHANNEL = "REMINDERS";

    /** Notification buttons for quiet (Notify) reminders and missed alarms. */
    @Override
    public void onReceive(Context context, Intent intent) {
        String id = intent.getStringExtra("alarmId");
        if (id == null) return;
        JSONObject data = AlarmScheduler.load(context, id);

        if (ACTION_DONE.equals(intent.getAction())) {
            done(context, id);
        } else if (ACTION_SNOOZE.equals(intent.getAction())) {
            String mode = intent.getStringExtra("mode");
            snooze(context, id, SNOOZE_MINUTES, data == null ? "default" : data.optString("sound"),
                intent.getStringExtra("title"), intent.getStringExtra("description"), mode == null ? "notify" : mode);
        }
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.cancel(id.hashCode());
            manager.cancel((id + AlarmScheduler.EARLY_SUFFIX).hashCode()); // heads-up, if this came from one
        }
    }

    /** Task finished: stop this round's follow-ups and tell the app. Tomorrow's repeat is left alone. */
    static void done(Context context, String id) {
        AlarmScheduler.cancelFollowUps(context, id);
        record(context, id, "done", 0);
    }

    /** Remind again in `minutes`, and tell the app the new time. */
    static void snooze(Context context, String id, int minutes, String sound, String title, String description, String mode) {
        AlarmScheduler.cancelFollowUps(context, id);
        long time = System.currentTimeMillis() + minutes * 60000L;
        AlarmScheduler.schedule(context, id + AlarmScheduler.SNOOZE_SUFFIX, time, sound, title, description, "", 0, mode, 0);
        record(context, id, "snooze", time);
    }

    private static synchronized void record(Context context, String id, String type, long time) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(EVENTS, Context.MODE_PRIVATE);
            JSONArray events = new JSONArray(prefs.getString("queue", "[]"));
            JSONObject event = new JSONObject();
            event.put("id", id);
            event.put("type", type);
            event.put("time", time);
            event.put("at", System.currentTimeMillis());
            events.put(event);
            prefs.edit().putString("queue", events.toString()).commit(); // commit: the process may die right after
        } catch (Exception ignored) {
        }
    }

    /** Returns the queued taps (JSON array) and empties the queue. */
    static synchronized String consume(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(EVENTS, Context.MODE_PRIVATE);
        String queue = prefs.getString("queue", "[]");
        prefs.edit().remove("queue").commit();
        return queue;
    }

    /** A quiet reminder (Notify mode): normal notification sound, with Done and Snooze buttons. */
    static void showReminder(Context context, String id, String title, String description, boolean followUp) {
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(REMINDER_CHANNEL, "Reminders", NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("Reminders set to Notification");
            manager.createNotificationChannel(channel);
        }
        String name = title == null || title.isEmpty() ? "Reminder" : title;
        manager.notify(id.hashCode(), withButtons(context, new NotificationCompat.Builder(context, REMINDER_CHANNEL)
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setContentTitle((followUp ? "⏰ Still to do: " : "🔔 ") + name)
            .setContentText(description == null || description.isEmpty() ? "Your reminder is due" : description)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setContentIntent(openApp(context))
            .setAutoCancel(true), id, title, description, "notify").build());
    }

    /** Heads-up before a reminder: "In 15 min: Team meeting". Only a Done button; snoozing a heads-up makes no sense. */
    static void showHeadsUp(Context context, String id, String title, long earlyMs) {
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            manager.createNotificationChannel(new NotificationChannel(REMINDER_CHANNEL, "Reminders", NotificationManager.IMPORTANCE_HIGH));
        }
        long minutes = earlyMs / 60000;
        String when = minutes >= 1440 ? "Tomorrow" : minutes >= 60 ? "In " + (minutes / 60) + " h" : "In " + minutes + " min";
        manager.notify((id + AlarmScheduler.EARLY_SUFFIX).hashCode(), new NotificationCompat.Builder(context, REMINDER_CHANNEL)
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setContentTitle(when + ": " + (title == null || title.isEmpty() ? "Reminder" : title))
            .setContentText("Heads-up from Remainder")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setContentIntent(openApp(context))
            .setAutoCancel(true)
            .addAction(0, "Done", button(context, ACTION_DONE, id, title, "", "notify"))
            .build());
    }

    /** Adds "Done" and "Snooze 10 min" buttons. `mode` is how the snoozed reminder comes back: "ring" or "notify". */
    static NotificationCompat.Builder withButtons(Context context, NotificationCompat.Builder builder, String id, String title,
                                                  String description, String mode) {
        return builder
            .addAction(0, "Done", button(context, ACTION_DONE, id, title, description, mode))
            .addAction(0, "Snooze " + SNOOZE_MINUTES + " min", button(context, ACTION_SNOOZE, id, title, description, mode));
    }

    private static PendingIntent button(Context context, String action, String id, String title, String description, String mode) {
        Intent intent = new Intent(context, AlarmActions.class).setAction(action);
        intent.putExtra("alarmId", id);
        intent.putExtra("title", title);
        intent.putExtra("description", description);
        intent.putExtra("mode", mode);
        // A distinct request code per task and button, or Android reuses one PendingIntent for all of them.
        return PendingIntent.getBroadcast(context, (id + action).hashCode(), intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static PendingIntent openApp(Context context) {
        Intent open = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        return PendingIntent.getActivity(context, 4, open == null ? new Intent() : open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
