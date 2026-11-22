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

        // The base id is what the app knows the task by; a snooze or follow-up belongs to the same task.
        String baseId = AlarmScheduler.baseId(alarmId);

        if ("early".equals(data.optString("mode"))) {
            AlarmActions.showHeadsUp(context, baseId, data.optString("title", "Reminder"), data.optLong("early", 0));
            AlarmScheduler.afterFired(context, alarmId, data); // one-shot: the next heads-up is set with the next reminder
            return;
        }

        if ("notify".equals(data.optString("mode"))) {
            int followUp = data.optInt("followUp", 0);
            String title = data.optString("title", "Reminder");
            String description = data.optString("description", "");
            AlarmActions.showReminder(context, baseId, title, description, followUp > 0);
            // Not done yet? Remind again in 5 minutes, up to the follow-ups set in Settings. Done / Snooze cancel these.
            int followUps = AppSettings.followUps(context);
            if (followUp < followUps) {
                AlarmScheduler.schedule(context, baseId + AlarmScheduler.FOLLOW_UP_SUFFIX, System.currentTimeMillis() + 5 * 60000L,
                    data.optString("sound"), title, description, "", 0, "notify", followUp + 1);
            }
            // A follow-up re-uses its own key for the next one; only the last follow-up is forgotten here.
            boolean isFollowUp = alarmId.endsWith(AlarmScheduler.FOLLOW_UP_SUFFIX);
            if (!isFollowUp || followUp >= followUps) AlarmScheduler.afterFired(context, alarmId, data);
            return;
        }

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
