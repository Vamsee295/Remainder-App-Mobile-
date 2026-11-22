package com.vamsee05.remainderapp;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/**
 * Home-screen widget: today's open tasks (up to 4) and a + button.
 * The app sends upcoming open tasks with their times (AlarmModule.updateWidget); the widget picks
 * "today" itself on every redraw, so it rolls over at midnight even if the app isn't opened.
 */
public class TodayWidget extends AppWidgetProvider {
    private static final String PREFS = "WidgetData";
    private static final int[] ROWS = {R.id.widget_row1, R.id.widget_row2, R.id.widget_row3, R.id.widget_row4};

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) manager.updateAppWidget(id, build(context));
    }

    /** Called by the app after tasks change. */
    static void save(Context context, String json) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString("tasks", json).apply();
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, TodayWidget.class));
        for (int id : ids) manager.updateAppWidget(id, build(context));
    }

    /** Done tapped on a notification: drop the task from the widget now, without waiting for the app to open. */
    static void remove(Context context, String id) {
        try {
            JSONArray tasks = new JSONArray(context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("tasks", "[]"));
            JSONArray kept = new JSONArray();
            for (int i = 0; i < tasks.length(); i++) {
                if (!id.equals(tasks.getJSONObject(i).optString("id"))) kept.put(tasks.getJSONObject(i));
            }
            save(context, kept.toString());
        } catch (Exception ignored) {
        }
    }

    private static RemoteViews build(Context context) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_today);

        Calendar end = Calendar.getInstance();
        end.set(Calendar.HOUR_OF_DAY, 23);
        end.set(Calendar.MINUTE, 59);
        end.set(Calendar.SECOND, 59);
        long now = System.currentTimeMillis();

        List<String> lines = new ArrayList<>();
        try {
            JSONArray tasks = new JSONArray(context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("tasks", "[]"));
            SimpleDateFormat time = new SimpleDateFormat("h:mm a", Locale.getDefault());
            for (int i = 0; i < tasks.length(); i++) { // already sorted by time
                JSONObject t = tasks.getJSONObject(i);
                long at = t.optLong("t");
                if (at > end.getTimeInMillis()) break;
                lines.add((at < now ? "LATE  " : time.format(new Date(at)) + "  ") + t.optString("title"));
            }
        } catch (Exception ignored) {
        }

        views.setTextViewText(R.id.widget_count, lines.isEmpty() ? "" : String.valueOf(lines.size()));
        views.setViewVisibility(R.id.widget_empty, lines.isEmpty() ? View.VISIBLE : View.GONE);
        for (int i = 0; i < ROWS.length; i++) {
            boolean show = i < lines.size();
            views.setViewVisibility(ROWS[i], show ? View.VISIBLE : View.GONE);
            if (show) views.setTextViewText(ROWS[i], i == ROWS.length - 1 && lines.size() > ROWS.length
                ? "+" + (lines.size() - ROWS.length + 1) + " more" : lines.get(i));
        }

        // Tap the widget: open the app. Tap +: open the app on a new task (remainderapp:///?new=1).
        views.setOnClickPendingIntent(R.id.widget_root, AlarmActions.openApp(context));
        Intent add = new Intent(Intent.ACTION_VIEW, Uri.parse("remainderapp:///?new=1")).setPackage(context.getPackageName())
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        views.setOnClickPendingIntent(R.id.widget_add, PendingIntent.getActivity(context, 7, add,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        return views;
    }
}
