package com.vamsee05.remainderapp;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import org.json.JSONObject;

/** Runs when an alarm is due, and when the phone has restarted. */
public class AlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "AlarmReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            AlarmScheduler.rescheduleAll(context);
            return;
        }

        String alarmId = intent.getStringExtra("alarmId");
        JSONObject data = alarmId == null ? null : AlarmScheduler.load(context, alarmId);
        if (data == null) {
            Log.w(TAG, "Alarm fired but has no saved data: " + alarmId);
            return;
        }

        // The base id is what the app knows the task by; a snooze rings under the same task.
        String baseId = alarmId.endsWith(AlarmScheduler.SNOOZE_SUFFIX)
            ? alarmId.substring(0, alarmId.length() - AlarmScheduler.SNOOZE_SUFFIX.length())
            : alarmId;

        Intent service = new Intent(context, AlarmService.class);
        service.setAction(AlarmService.ACTION_RING);
        service.putExtra("alarmId", baseId);
        service.putExtra("soundUri", data.optString("sound", "default"));
        service.putExtra("title", data.optString("title", "Reminder"));
        service.putExtra("description", data.optString("description", ""));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(service);
        else context.startService(service);

        AlarmScheduler.afterFired(context, alarmId, data);
    }
}
