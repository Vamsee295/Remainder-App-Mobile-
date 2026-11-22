package com.vamsee05.remainderapp;

import android.app.AlarmManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationManagerCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

/** JS bridge: NativeModules.AlarmModule */
public class AlarmModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public AlarmModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @NonNull
    @Override
    public String getName() {
        return "AlarmModule";
    }

    /**
     * @param repeat "" | "daily" | "days:1,3,5" | "monthly:15" (see AlarmScheduler)
     * @param until  timestamp after which a repeating alarm stops (0 = never stops)
     * @param mode   "ring" or "notify"
     * @param earlyMs heads-up this many ms before each occurrence (0 = none)
     */
    @ReactMethod
    public void setAlarm(String alarmId, double timestamp, String soundUri, String title, String description,
                         String repeat, double until, String mode, double earlyMs, Promise promise) {
        try {
            boolean ok = AlarmScheduler.schedule(reactContext, alarmId, (long) timestamp, soundUri, title,
                description, repeat, (long) until, mode, 0, (long) earlyMs);
            if (ok) promise.resolve(alarmId);
            else promise.reject("PERMISSION_ERROR", "Exact alarms are not allowed for this app");
        } catch (Exception e) {
            promise.reject("ALARM_ERROR", e.getMessage());
        }
    }

    /** Done / Snooze taps made outside the app since the last call, as a JSON array string. Empties the queue. */
    @ReactMethod
    public void consumeEvents(Promise promise) {
        promise.resolve(AlarmActions.consume(reactContext));
    }

    /** What could stop reminders on this phone. Each flag true = fine. */
    @ReactMethod
    public void getHealth(Promise promise) {
        WritableMap map = Arguments.createMap();
        AlarmManager alarms = (AlarmManager) reactContext.getSystemService(Context.ALARM_SERVICE);
        PowerManager power = (PowerManager) reactContext.getSystemService(Context.POWER_SERVICE);
        NotificationManager notes = reactContext.getSystemService(NotificationManager.class);

        map.putBoolean("notifications", NotificationManagerCompat.from(reactContext).areNotificationsEnabled());
        map.putBoolean("exactAlarms", Build.VERSION.SDK_INT < Build.VERSION_CODES.S || (alarms != null && alarms.canScheduleExactAlarms()));
        map.putBoolean("battery", power == null || power.isIgnoringBatteryOptimizations(reactContext.getPackageName()));
        map.putBoolean("fullScreen", Build.VERSION.SDK_INT < 34 || (notes != null && notes.canUseFullScreenIntent()));
        map.putString("maker", Build.MANUFACTURER == null ? "" : Build.MANUFACTURER.toLowerCase());
        promise.resolve(map);
    }

    /** Opens the settings page that fixes one item from getHealth. */
    @ReactMethod
    public void openFix(String which, Promise promise) {
        String pkg = reactContext.getPackageName();
        Intent intent;
        switch (which) {
            case "notifications":
                intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, pkg);
                break;
            case "exactAlarms":
                intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:" + pkg));
                break;
            case "battery":
                intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + pkg));
                break;
            case "fullScreen":
                intent = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, Uri.parse("package:" + pkg));
                break;
            default:
                intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + pkg));
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            reactContext.startActivity(intent);
        } catch (Exception e) {
            // Some phones lack the specific page: fall back to the app's settings page.
            reactContext.startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + pkg))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        }
        promise.resolve(null);
    }

    @ReactMethod
    public void cancelAlarm(String alarmId, Promise promise) {
        try {
            AlarmScheduler.cancel(reactContext, alarmId);
            promise.resolve(alarmId);
        } catch (Exception e) {
            promise.reject("ALARM_ERROR", e.getMessage());
        }
    }
}
